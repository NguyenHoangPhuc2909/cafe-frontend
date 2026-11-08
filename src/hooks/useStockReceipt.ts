import { useRef, useState } from "react";
import axios from "axios";
import type {
  StockReceiptDraft,
  StockReceiptRequest,
} from "../types/inventory";
import { receiveStaffStock } from "../services/staffInventory";
import { staffErrorMessage } from "../services/staffApi";
import {
  readPendingStockReceipt,
  savePendingStockReceipt,
  clearPendingStockReceipt,
} from "../utils/stockReceiptStorage";

export function useStockReceipt(token: string, username: string) {
  const [restored] = useState(() => readPendingStockReceipt(username));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(restored.error);
  const [pending, setPending] = useState<StockReceiptRequest | null>(
    restored.request,
  );

  const busyRef = useRef(false);
  const pendingRef = useRef<StockReceiptRequest | null>(restored.request);

  const blocked = restored.error !== null;

  const releasePending = (request: StockReceiptRequest) => {
    clearPendingStockReceipt(username, request.requestId);
    pendingRef.current = null;
    setPending(null);
  };

  const run = async (request: StockReceiptRequest) => {
    if (busyRef.current || blocked) return null;

    busyRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const movement = await receiveStaffStock(token, request);

      try {
        releasePending(request);
      } catch {
        setError(
          `Phiếu #${movement.id} đã được ghi nhận, nhưng chưa xóa được ` +
            "phiếu chờ trên trình duyệt. Dùng Gửi lại với cùng mã phiếu.",
        );
        return null;
      }

      return movement;
    } catch (cause) {
      const status = axios.isAxiosError(cause)
        ? cause.response?.status
        : undefined;

      if (status === 400 || status === 404 || status === 422) {
        try {
          releasePending(request);
          setError(staffErrorMessage(cause));
        } catch {
          setError(
            "BE đã từ chối phiếu nhưng chưa xóa được dữ liệu chờ. " +
              "Vui lòng thử lại khi bộ nhớ trình duyệt hoạt động.",
          );
        }
      } else {
        setError(
          `${staffErrorMessage(cause)} ` +
            "Giữ nguyên phiếu và dùng nút Gửi lại.",
        );
      }

      return null;
    } finally {
      busyRef.current = false;
      setIsSubmitting(false);
    }
  };

  const submit = async (draft: StockReceiptDraft) => {
    if (busyRef.current || pendingRef.current || blocked) return null;

    try {
      // Kiểm tra lại để không ghi đè phiếu chờ đã có.
      const current = readPendingStockReceipt(username);

      if (current.error) {
        setError(current.error);
        return null;
      }

      if (current.request) {
        pendingRef.current = current.request;
        setPending(current.request);
        setError("Đã khôi phục phiếu đang chờ. Dùng nút Gửi lại.");
        return null;
      }

      const request: StockReceiptRequest = {
        ...draft,
        note: draft.note.trim(),
        requestId: crypto.randomUUID(),
      };

      // Phải lưu thành công trước khi gửi POST.
      savePendingStockReceipt(username, request);

      pendingRef.current = request;
      setPending(request);

      return run(request);
    } catch {
      setError(
        "Chưa lưu được phiếu chờ. Chưa gửi yêu cầu nhập kho. " +
          "Vui lòng kiểm tra bộ nhớ trình duyệt.",
      );
      return null;
    }
  };

  const retry = async () => {
    const request = pendingRef.current;

    if (!request || busyRef.current || blocked) return null;

    return run(request);
  };

  return {
    submit,
    retry,
    isSubmitting,
    error,
    pending,
    blocked,
  };
}

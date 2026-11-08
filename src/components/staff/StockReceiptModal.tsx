import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal, message } from "antd";
import { useStockReceipt } from "../../hooks/useStockReceipt";
import type { Ingredient, PackagedStock } from "../../services/staffInventory";
import type { StockMovementResponse } from "../../types/inventory";

interface Props {
  token: string;
  username: string;
  ingredients: Ingredient[];
  packaged: PackagedStock[];
  onClose: () => void;
  onSuccess: (movement: StockMovementResponse) => void;
}

export default function StockReceiptModal({
  token,
  username,
  ingredients,
  packaged,
  onClose,
  onSuccess,
}: Props) {
  const [messageApi, contextHolder] = message.useMessage({ maxCount: 1 });
  const { submit, retry, isSubmitting, error, pending, blocked } =
    useStockReceipt(token, username);

  useEffect(() => {
    if (!error) {
      messageApi.destroy("stock-receipt-notice");
      return;
    }

    void messageApi.error({
      key: "stock-receipt-notice",
      content: error,
      duration: blocked ? 0 : 6,
    });
  }, [error, blocked, messageApi]);

  const [draftKind, setKind] = useState<"ingredient" | "packaged">(
    pending?.productId !== undefined ? "packaged" : "ingredient",
  );

  const [draftSelectedId, setSelectedId] = useState(
    pending ? String(pending.ingredientId ?? pending.productId) : "",
  );

  const [draftQuantity, setQuantity] = useState(
    pending ? String(pending.quantity) : "",
  );

  const [draftNote, setNote] = useState(pending?.note ?? "");

  const kind = pending
    ? pending.productId !== undefined
      ? "packaged"
      : "ingredient"
    : draftKind;

  const selectedId = pending
    ? String(pending.ingredientId ?? pending.productId)
    : draftSelectedId;

  const quantity = pending ? String(pending.quantity) : draftQuantity;
  const note = pending?.note ?? draftNote;

  const locked = isSubmitting || pending !== null;
  const options = kind === "ingredient" ? ingredients : packaged;
  const selected = options.find((item) => item.id === Number(selectedId));

  const unit = selected?.unit;

  const warn = (content: string) => {
    void messageApi.warning({
      key: "stock-receipt-notice",
      content,
      duration: 4,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || blocked) return;

    // Phiếu chưa rõ kết quả: gửi lại nguyên nội dung cũ.
    if (pending) {
      const movement = await retry();
      if (movement) onSuccess(movement);
      return;
    }

    const amount = Number(quantity);

    if (!selected) {
      warn("Vui lòng chọn nguyên liệu hoặc hàng đóng gói.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      warn("Số lượng nhập phải lớn hơn 0 và hợp lệ.");
      return;
    }

    if (
      kind === "packaged" &&
      (!Number.isInteger(amount) || amount > 2_147_483_647)
    ) {
      warn(
        "Hàng đóng gói phải nhập số nguyên trong giới hạn cho phép.",
      );
      return;
    }

    if (!note.trim() || note.length > 500) {
      warn("Vui lòng nhập ghi chú, tối đa 500 ký tự.");
      return;
    }

    const movement = await submit(
      kind === "ingredient"
        ? {
            ingredientId: selected.id,
            quantity: amount,
            note,
          }
        : {
            productId: selected.id,
            quantity: amount,
            note,
          },
    );

    if (movement) onSuccess(movement);
  };

  const fieldClass =
    "mt-2 min-h-control w-full rounded-xl border border-outline-variant " +
    "bg-white px-3 py-2 disabled:opacity-60";

  return (
    <>
      {contextHolder}
      <Modal
        open
        title="Nhập kho"
        footer={null}
        closable={!locked}
        keyboard={!locked}
        mask={{ closable: false }}
        onCancel={() => {
          if (!locked) onClose();
        }}
      >
        <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-3">
          <label className="block text-sm">
            Loại hàng
            <select
              value={kind}
              disabled={locked || blocked}
              className={fieldClass}
              onChange={(event) => {
                setKind(
                  event.target.value === "ingredient" ? "ingredient" : "packaged",
                );
                setSelectedId("");
                setQuantity("");
              }}
            >
              <option value="ingredient">Nguyên liệu</option>
              <option value="packaged">Hàng đóng gói</option>
            </select>
          </label>

          <label className="block text-sm">
            {kind === "ingredient" ? "Nguyên liệu" : "Sản phẩm"}
            <select
              value={selectedId}
              disabled={locked || blocked}
              className={fieldClass}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setQuantity("");
              }}
            >
              <option value="">Chọn mặt hàng</option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Số lượng nhập thêm {unit ? `(${unit})` : ""}
            <input
              type="number"
              step={kind === "packaged" ? 1 : "any"}
              value={quantity}
              disabled={locked || blocked}
              className={fieldClass}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>

          <label className="block text-sm">
            Ghi chú
            <textarea
              rows={3}
              maxLength={500}
              value={note}
              disabled={locked || blocked}
              className={fieldClass}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: Nhận hàng giao lúc 9h"
            />
          </label>

          {pending && !isSubmitting && (
            <p role="status" className="text-sm text-on-surface-variant">
              Phiếu chưa được xác nhận. Dùng Gửi lại để kiểm tra và hoàn tất cùng
              phiếu này.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={locked}
              onClick={onClose}
              className="min-h-control rounded-xl border border-outline-variant px-4 disabled:opacity-40"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting || blocked}
              className="min-h-control rounded-xl bg-primary px-4 font-semibold text-on-primary disabled:opacity-40"
            >
              {isSubmitting
                ? "Đang xử lý…"
                : pending
                  ? "Gửi lại"
                  : "Xác nhận nhập kho"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

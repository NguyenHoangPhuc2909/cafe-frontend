import SelectField from '../ui/SelectField';
import { useRef, useState } from "react";
import type { OrderResponse } from "../../types/order";
import type { PaymentMethod } from "../../types/payment";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import { usePaymentCountdown } from "../../hooks/usePaymentCountdown";
import {
  confirmStaffPayment,
  getStaffOrder,
  staffErrorMessage,
} from "../../services/staffApi";
import CheckoutSummary from "../common/CheckoutSummary";
import { formatCurrency } from "../../utils/format";

interface Props {
  order: OrderResponse;
  embedded?: boolean;
  onChanged: (message: string, success: boolean) => void;
}

export default function StaffPaymentPanel({ order, onChanged, embedded = false }: Props) {
  const { session } = useStaffAuth();
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [lockedMethod, setLockedMethod] = useState<PaymentMethod | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const busyRef = useRef(false);

  const deadline = order.paymentExpiresAt
    ? Date.parse(order.paymentExpiresAt)
    : undefined;
  const { countdown, remainingSeconds } = usePaymentCountdown(deadline);

  const paid =
    order.paymentStatus === "PAID" ||
    (confirmed && order.paymentStatus === "UNPAID");

  const payable =
    session?.role === "STAFF" &&
    !paid &&
    order.status === "PENDING" &&
    order.paymentStatus === "UNPAID" &&
    order.sessionId !== null &&
    remainingSeconds > 0 &&
    Number.isFinite(order.totalAmount) &&
    order.totalAmount >= 0;

  const confirm = async () => {
    if (!session || !payable || !acknowledged || busyRef.current) {
      return;
    }

    busyRef.current = true;
    setBusy(true);

    const selectedMethod = lockedMethod ?? method;
    setLockedMethod(selectedMethod);

    try {
      const payment = await confirmStaffPayment(
        session.accessToken,
        order.id,
        selectedMethod,
      );

      setConfirmed(true);
      onChanged(
        `Đã xác nhận ${formatCurrency(payment.amount)} cho đơn #${order.id}.`,
        true,
      );
    } catch (cause) {
      let success = false;
      let message =
        `Đơn #${order.id}: ${staffErrorMessage(cause)} ` +
        "Kiểm tra trạng thái trước khi thử lại.";

      // Request có thể đã thành công ở BE nhưng FE chưa nhận được kết quả.
      try {
        const latest = await getStaffOrder(session.accessToken, order.id);

        if (latest.paymentStatus === "PAID") {
          success = true;
          setConfirmed(true);
          message =
            `Đơn #${order.id} đã được ghi nhận thanh toán. ` +
            "Không cần xác nhận lại.";
        }
      } catch {
        // Giữ thông báo chưa xác định nếu không đọc lại được đơn.
      }

      onChanged(message, success);
    } finally {
      busyRef.current = false;
      setBusy(false);
      setAcknowledged(false);
    }
  };

  if (session?.role !== "STAFF") {
    return <CheckoutSummary order={order} embedded={embedded} />;
  }

  return (
    <div className={embedded ? "order-payment-content" : "space-y-4"}>
      <CheckoutSummary order={order} embedded={embedded} />

      <section
        aria-label="Xác nhận thanh toán"
        className={embedded ? "order-payment-section" : "rounded-2xl border border-outline-variant/30 bg-surface p-5"}
      >
        {paid && (
          <p className="font-semibold text-green-800">
            Đơn đã được ghi nhận thanh toán.
          </p>
        )}

        {!paid && !payable && !busy && (
          <p className="text-sm text-on-surface-variant">
            {order.status === "EXPIRED"
              ? "Đơn đã hết hạn thanh toán."
              : "Đơn hiện không đủ điều kiện xác nhận thanh toán."}
          </p>
        )}

        {!paid && (payable || busy) && (
          <>
            <p className="text-sm">
              Thời gian còn lại theo giờ thiết bị: <strong>{countdown}</strong>
            </p>

            <div className="mt-4 text-sm">
              <p className="mb-2 font-semibold">Phương thức đã nhận tiền</p>
              <SelectField label="Phương thức đã nhận tiền" value={lockedMethod ?? method} disabled={busy || lockedMethod !== null} className="w-full"
                onChange={value => { setMethod(value); setAcknowledged(false); }}
                options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK_TRANSFER', label: 'Chuyển khoản' }]} />
            </div>

            <label className="mt-4 flex min-h-control items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={acknowledged}
                disabled={busy}
                onChange={(event) => setAcknowledged(event.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-primary"
              />
              <span>
                Tôi đã kiểm tra đúng đơn #{order.id} và nhận đủ{" "}
                <strong>{formatCurrency(order.totalAmount)}</strong>.
              </span>
            </label>

            <button
              type="button"
              disabled={!acknowledged || busy || !payable || !session}
              onClick={() => void confirm()}
              className="mt-4 min-h-control w-full rounded-xl bg-primary px-4 font-semibold text-on-primary disabled:opacity-40"
            >
              {busy ? "Đang xử lý…" : "Xác nhận đã nhận tiền"}
            </button>

            {lockedMethod && !busy && (
              <p className="mt-3 text-xs text-on-surface-variant">
                Nếu cần gửi lại, giữ nguyên phương thức đã chọn và kiểm tra
                trạng thái đơn trước.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

import { useRef, useState } from "react";
import type { OrderResponse } from "../../types/order";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import { completeStaffOrder, staffErrorMessage } from "../../services/staffApi";

interface Props {
  order: OrderResponse;
  onChanged: (message: string, success: boolean) => void;
}

export default function CompleteOrderButton({ order, onChanged }: Props) {
  const { session } = useStaffAuth();
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const busyRef = useRef(false);

  const canComplete =
    session?.role === "STAFF" &&
    order.status === "PREPARING" &&
    order.paymentStatus === "PAID" &&
    !confirmed;

  const complete = async () => {
    if (!session || !canComplete || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);

    try {
      await completeStaffOrder(session.accessToken, order.id);
      setConfirmed(true);
      onChanged(`Đã hoàn thành đơn #${order.id}.`, true);
    } catch (cause) {
      onChanged(`Đơn #${order.id}: ${staffErrorMessage(cause)}`, false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!canComplete) return null;

  return (
    <section
      aria-label="Hoàn thành đơn"
      className="mt-4 rounded-2xl bg-surface p-5"
    >
      <p className="text-sm text-on-surface-variant">
        Bấm sau khi đã làm xong và giao đủ món cho khách.
      </p>

      <button
        type="button"
        disabled={busy || !session}
        onClick={() => void complete()}
        className="mt-4 min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary disabled:opacity-40"
      >
        {busy ? "Đang xử lý…" : "Hoàn thành"}
      </button>
    </section>
  );
}

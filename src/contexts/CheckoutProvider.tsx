import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { GuestOrderResponse } from "../types/guest";
import { useGuestSession } from "../hooks/useGuestSession";
import { guestErrorMessage } from "../services/guest";
import { CheckoutContext } from "./checkout";

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const guest = useGuestSession();
  const { attempt, readOrder } = guest;

  const [latest, setLatest] = useState<GuestOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Kết quả POST đã được GuestSessionProvider lưu để phục hồi sau reload.
  const storedOrder =
    attempt?.state === "success" ? (attempt.order ?? null) : null;

  const order =
    storedOrder && latest?.id === storedOrder.id ? latest : storedOrder;

  const orderId = storedOrder?.id;

  useEffect(() => {
    if (orderId === undefined) return;

    const controller = new AbortController();
    let active = true;
    let timer: number | undefined;

    const load = async () => {
      try {
        const next = await readOrder(orderId, controller.signal);

        if (!active) return;

        setLatest(next);
        setError(null);
      } catch (cause) {
        if (active && !controller.signal.aborted) {
          setError(guestErrorMessage(cause));
        }
      } finally {
        if (active) {
          timer = window.setTimeout(() => void load(), 5000);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [orderId, readOrder, version]);

  const startCheckout = async (): Promise<boolean> => {
    setError(null);

    if (order) return true;
    if (guest.isSubmitting || guest.isChecking) return false;

    if (guest.attempt) {
      setError("Vui lòng xử lý kết quả đơn trước đó trong giỏ.");
      return false;
    }

    if (!guest.session) {
      setError("Vui lòng xác nhận phiên bàn trước khi gửi đơn.");
      return false;
    }

    const created = await guest.submitOrder();

    if (!created) return false;

    setLatest(created);
    return true;
  };

  const refreshOrder = () => {
    setVersion((current) => current + 1);
  };

  const startNewOrder = (): boolean => {
    if (!order) return true;

    if (order.paymentStatus !== "PAID" && order.status !== "EXPIRED") {
      setError("Đơn hiện tại vẫn đang chờ thanh toán.");
      return false;
    }

    // Chỉ bỏ lựa chọn trên FE, không sửa hoặc xóa đơn trong BE.
    guest.dismissAttempt();
    setLatest(null);
    setError(null);
    return true;
  };

  return (
    <CheckoutContext.Provider
      value={{
        order,
        startCheckout,
        refreshOrder,
        startNewOrder,
        error: error ?? guest.orderError,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

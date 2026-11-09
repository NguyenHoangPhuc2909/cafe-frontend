import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { GuestOrderResponse } from '../types/guest';
import type { PageResponse } from '../types/api';
import { useGuestSession } from '../hooks/useGuestSession';
import { guestErrorMessage } from '../services/guest';
import { CheckoutContext } from './checkout';
import { selectGuestOrder } from '../utils/guest';

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const guest = useGuestSession();
  const { attempt, readOrder, readOrders } = guest;
  const sessionId = guest.session?.id ?? null;
  const storedOrder = attempt?.state === 'success' && attempt.order &&
    (sessionId === null || attempt.order.sessionId === sessionId) ? attempt.order : null;
  const scopeId = sessionId ?? storedOrder?.sessionId ?? null;
  const [selection, setSelection] = useState<{ sessionId: number; id: number | null } | null>(null);
  const [pagination, setPagination] = useState<{ sessionId: number; page: number } | null>(null);
  const page = pagination?.sessionId === scopeId ? pagination.page : 0;
  const [version, setVersion] = useState(0);
  const [history, setHistory] = useState<{
    sessionId: number; page: number; data: PageResponse<GuestOrderResponse> | null; error: string | null;
  } | null>(null);
  const currentHistory = history?.sessionId === scopeId && history.page === page ? history : null;
  const orders = currentHistory?.data?.content ?? (page === 0 && storedOrder ? [storedOrder] : []);
  const orderId = selection?.sessionId === scopeId
    ? selection.id ?? orders[0]?.id : storedOrder?.id ?? orders[0]?.id;
  const [latest, setLatest] = useState<GuestOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const order = selectGuestOrder(orderId, scopeId, orders, latest, storedOrder);

  useEffect(() => {
    if (sessionId === null) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const data = await readOrders(page, controller.signal);
        if (!controller.signal.aborted) setHistory({ sessionId, page, data, error: null });
      } catch (cause) {
        if (!controller.signal.aborted) setHistory(previous => ({
          sessionId, page,
          data: previous?.sessionId === sessionId && previous.page === page ? previous.data : null,
          error: guestErrorMessage(cause),
        }));
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(() => void load(), 5000);
      }
    };
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [sessionId, page, readOrders, version]);

  useEffect(() => {
    if (orderId === undefined) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const next = await readOrder(orderId, controller.signal);
        if (!controller.signal.aborted) { setLatest(next); setError(null); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(guestErrorMessage(cause));
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(() => void load(), 5000);
      }
    };
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [orderId, readOrder, version]);

  const startCheckout = async (): Promise<boolean> => {
    setError(null);
    if (guest.isSubmitting || guest.isChecking) return false;
    if (guest.attempt && guest.attempt.state !== 'success') {
      setError('Vui lòng xử lý kết quả lần gửi trước trong giỏ.');
      return false;
    }
    if (!guest.session) {
      setError('Vui lòng xác nhận phiên bàn trước khi gửi đơn.');
      return false;
    }
    const created = await guest.submitOrder();
    if (!created) return false;
    setLatest(created);
    setSelection({ sessionId: created.sessionId, id: created.id });
    setPagination({ sessionId: created.sessionId, page: 0 });
    setVersion(value => value + 1);
    return true;
  };

  const startNewOrder = (): boolean => {
    if (guest.isSubmitting || guest.isChecking || !guest.dismissAttempt()) return false;
    setError(null);
    return true;
  };

  return <CheckoutContext.Provider value={{
    order, orders, page,
    totalPages: currentHistory?.data?.totalPages ?? page + 1,
    isLoadingOrders: sessionId !== null && !currentHistory,
    selectOrder: id => {
      if (scopeId === null) return;
      setSelection({ sessionId: scopeId, id });
      setError(null);
    },
    setPage: next => {
      if (scopeId === null) return;
      setPagination({ sessionId: scopeId, page: next });
      setSelection({ sessionId: scopeId, id: null });
      setError(null);
    },
    reloadOrders: () => setVersion(value => value + 1),
    startCheckout, startNewOrder,
    error: error ?? guest.orderError ?? currentHistory?.error ?? null,
  }}>{children}</CheckoutContext.Provider>;
}

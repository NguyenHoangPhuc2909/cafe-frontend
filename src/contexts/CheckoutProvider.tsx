import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useCustomerCart } from '../hooks/useCustomerCart';
import { useGuestSession } from '../hooks/useGuestSession';
import { createCheckout, restoreCheckout, transitionCheckout } from '../utils/checkout';
import type { CheckoutEvent, CheckoutOrder } from '../utils/checkout';
import { CheckoutContext } from './checkout';

const KEY = 'cafe.checkout-preview.v1';
function readOrder() {
  try { return restoreCheckout(sessionStorage.getItem(KEY), Date.now()); } catch { return null; }
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const cart = useCustomerCart();
  const { completeSubmittedOrder } = cart;
  const guest = useGuestSession();
  const [order, setOrder] = useState(readOrder);
  const current = useRef(order);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback((next: CheckoutOrder | null) => {
    current.current = next;
    setOrder(next);
    try {
      if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
      else sessionStorage.removeItem(KEY);
    } catch { /* Keep the preview usable in memory if storage is disabled. */ }
  }, []);

  const dispatch = useCallback((event: CheckoutEvent) => {
    const previous = current.current;
    if (!previous) return;
    if (event.type === 'confirm' && (!guest.session || guest.isChecking || guest.session.id !== previous.sessionId)) {
      setError('Phiên bàn chưa được xác nhận hoặc đã thay đổi. Vui lòng kiểm tra lại phiên bàn trước khi thanh toán.');
      return;
    }
    // Payment and kitchen events are supplied by BE later; preview controls exist only in development.
    if (!import.meta.env.DEV && ['paid', 'failed', 'expire', 'advance'].includes(event.type)) return;
    const next = transitionCheckout(previous, event, Date.now());
    if (next === previous) return;
    setError(null);
    if (previous.paymentStatus !== 'paid' && next.paymentStatus === 'paid') {
      completeSubmittedOrder(previous.items, previous.note);
    }
    save(next);
  }, [completeSubmittedOrder, guest.session, guest.isChecking, save]);

  useEffect(() => {
    const tick = () => dispatch({ type: 'tick' });
    const timer = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [dispatch]);

  const startCheckout = () => {
    setError(null);
    if (guest.attempt) { setError('Vui lòng xử lý kết quả đơn trước đó trong giỏ.'); return false; }
    if (current.current) return true;
    if (!guest.session || guest.isChecking) { setError('Vui lòng xác nhận phiên bàn trước khi thanh toán.'); return false; }
    if (cart.isLoading || cart.menuError) { setError('Vui lòng tải lại thực đơn trước khi thanh toán.'); return false; }
    try {
      const next = createCheckout(cart.cart, cart.note, guest.session, `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, Date.now());
      save(next);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa thể mở thanh toán.');
      return false;
    }
  };

  const returnToCart = () => {
    if (current.current && !['unpaid', 'failed', 'expired'].includes(current.current.paymentStatus)) return;
    save(null); setError(null);
  };

  const finishOrder = () => {
    if (current.current?.preparationStatus !== 'served') return;
    save(null); setError(null);
  };

  return <CheckoutContext.Provider value={{ order, startCheckout, dispatch, returnToCart, finishOrder, error }}>{children}</CheckoutContext.Provider>;
}

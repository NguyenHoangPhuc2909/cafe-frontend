import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useCustomerCart } from '../hooks/useCustomerCart';
import { useGuestSession } from '../hooks/useGuestSession';
import { usePreviewOrders } from '../hooks/usePreviewOrders';
import { createCheckout, restoreCheckout } from '../utils/checkout';
import type { CheckoutEvent } from '../utils/checkout';
import { consumePreviewOnce, previewVersion } from '../utils/previewOrders';
import { changePreview, discardPreview, previewSnapshot, publishPreview, withPreviewLock } from '../services/previewOrders';
import { CheckoutContext } from './checkout';

const LEGACY_KEY = 'cafe.checkout-preview.v1';
const ACTIVE_KEY = 'cafe.checkout-active.v1';
function readLegacy() {
  try { return restoreCheckout(sessionStorage.getItem(LEGACY_KEY), Date.now()); } catch { return null; }
}
function readActive() {
  try { return sessionStorage.getItem(ACTIVE_KEY) ?? readLegacy()?.code ?? null; } catch { return null; }
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const cart = useCustomerCart();
  const { completeSubmittedOrder } = cart;
  const guest = useGuestSession();
  const orders = usePreviewOrders();
  const [legacy] = useState(readLegacy);
  const [activeCode, setActiveCode] = useState(readActive);
  const active = useRef(activeCode);
  const [error, setError] = useState<string | null>(null);
  const order = orders.find(candidate => candidate.code === activeCode) ?? (legacy?.code === activeCode ? legacy : null);

  const selectOrder = (code: string | null) => {
    active.current = code;
    setActiveCode(code);
    try {
      if (code) sessionStorage.setItem(ACTIVE_KEY, code);
      else sessionStorage.removeItem(ACTIVE_KEY);
    } catch { /* The active pointer can stay in memory until the tab closes. */ }
  };

  useEffect(() => {
    if (!legacy) return;
    try {
      if (!previewSnapshot().some(candidate => candidate.code === legacy.code)) publishPreview(legacy);
      if (active.current === legacy.code) sessionStorage.setItem(ACTIVE_KEY, legacy.code);
      sessionStorage.removeItem(LEGACY_KEY);
    } catch { /* Preserve the old receipt if local storage is unavailable. */ }
  }, [legacy]);

  useEffect(() => {
    if (order?.paymentStatus !== 'paid') return;
    void withPreviewLock('consume:' + order.code, () => {
      consumePreviewOnce(localStorage, order.code, () => completeSubmittedOrder(order.items, order.note));
    }).catch(() => setError('Chưa thể lưu kết quả cập nhật giỏ. Vui lòng giữ tab này và thử tải lại.'));
  }, [order, completeSubmittedOrder]);

  const dispatch = (event: CheckoutEvent) => {
    if (!order) return;
    // The customer can report payment; only Staff can confirm money or advance preparation.
    if (!['method', 'confirm', 'retry', 'tick'].includes(event.type)) return;
    if (event.type === 'confirm' && (!guest.session || guest.isChecking || guest.session.id !== order.sessionId)) {
      setError('Phiên bàn chưa được xác nhận hoặc đã thay đổi. Vui lòng kiểm tra lại phiên bàn.'); return;
    }
    setError(null);
    void changePreview(order.code, event, previewVersion(order)).catch(cause => {
      setError(cause instanceof Error ? cause.message : 'Chưa cập nhật được lượt thanh toán.');
    });
  };

  const startCheckout = () => {
    setError(null);
    if (guest.attempt) { setError('Vui lòng xử lý kết quả đơn trước đó trong giỏ.'); return false; }
    if (order) return true;
    if (!guest.session || guest.isChecking) { setError('Vui lòng xác nhận phiên bàn trước khi thanh toán.'); return false; }
    if (cart.isLoading || cart.menuError) { setError('Vui lòng tải lại thực đơn trước khi thanh toán.'); return false; }
    try {
      const next = createCheckout(cart.cart, cart.note, guest.session, `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, Date.now());
      if (!publishPreview(next)) throw new Error('Mã đơn thử đã tồn tại. Vui lòng thử lại.');
      selectOrder(next.code);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Trình duyệt chưa cho phép lưu dữ liệu thử nghiệm.');
      return false;
    }
  };

  const returnToCart = async () => {
    if (!order) return true;
    try {
      if (!await discardPreview(order.code)) { setError('Đơn đã chuyển trạng thái. Vui lòng kiểm tra trước khi sửa giỏ.'); return false; }
      selectOrder(null); setError(null); return true;
    } catch { setError('Chưa thể lưu thay đổi. Vui lòng thử lại.'); return false; }
  };

  const finishOrder = () => {
    if (order?.preparationStatus !== 'served') return;
    // Keep the completed order in Staff history; only clear this customer's active pointer.
    selectOrder(null); setError(null);
  };

  return <CheckoutContext.Provider value={{ order, startCheckout, dispatch, returnToCart, finishOrder, error }}>{children}</CheckoutContext.Provider>;
}

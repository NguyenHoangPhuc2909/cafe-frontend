import { restoreCheckout, transitionCheckout } from './checkout.ts';
import type { CheckoutEvent, CheckoutOrder } from './checkout.ts';

export const PREVIEW_ORDER_PREFIX = 'cafe.preview-order.v1.';
export interface PreviewStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function previewVersion(order: CheckoutOrder) {
  return JSON.stringify([order.code, order.paymentStatus, order.preparationStatus, order.method, order.expiresAt, order.total]);
}

export function readPreviewOrders(storage: PreviewStorage, now: number): CheckoutOrder[] {
  const orders: CheckoutOrder[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(PREVIEW_ORDER_PREFIX)) continue;
    const order = restoreCheckout(storage.getItem(key), now);
    if (order && key === PREVIEW_ORDER_PREFIX + order.code) orders.push(order);
  }
  return orders.sort((left, right) => right.createdAt - left.createdAt || left.code.localeCompare(right.code));
}

export function insertPreviewOrder(storage: PreviewStorage, order: CheckoutOrder) {
  const key = PREVIEW_ORDER_PREFIX + order.code;
  if (storage.getItem(key) !== null) return false;
  storage.setItem(key, JSON.stringify(order));
  return true;
}

export function updatePreviewOrder(storage: PreviewStorage, code: string, event: CheckoutEvent, now: number, expectedVersion?: string) {
  const key = PREVIEW_ORDER_PREFIX + code;
  const order = restoreCheckout(storage.getItem(key), now);
  if (!order) throw new Error('Không tìm thấy đơn thử nghiệm. Vui lòng tải lại danh sách.');
  // Persist expiry before rejecting an action based on an old screen.
  if (expectedVersion && previewVersion(order) !== expectedVersion) {
    storage.setItem(key, JSON.stringify(order));
    throw new Error('Trạng thái đơn đã thay đổi hoặc hết hạn. Vui lòng kiểm tra lại.');
  }
  const next = transitionCheckout(order, event, now);
  if (next !== order || storage.getItem(key) !== JSON.stringify(next)) storage.setItem(key, JSON.stringify(next));
  return next;
}

export function removeEditablePreview(storage: PreviewStorage, code: string, now: number) {
  const key = PREVIEW_ORDER_PREFIX + code;
  const order = restoreCheckout(storage.getItem(key), now);
  if (order && !['unpaid', 'failed', 'expired'].includes(order.paymentStatus)) return false;
  storage.removeItem(key);
  return true;
}

export function consumePreviewOnce(storage: PreviewStorage, code: string, consume: () => void) {
  const key = 'cafe.preview-consumed.v1.' + code;
  if (storage.getItem(key) === '1') return false;
  consume();
  storage.setItem(key, '1');
  return true;
}

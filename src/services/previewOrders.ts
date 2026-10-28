import type { CheckoutEvent, CheckoutOrder } from '../utils/checkout';
import { insertPreviewOrder, PREVIEW_ORDER_PREFIX, readPreviewOrders, removeEditablePreview, updatePreviewOrder } from '../utils/previewOrders';

const EVENT = 'cafe:preview-orders-changed';
const EMPTY: CheckoutOrder[] = [];
let fingerprint = '';
let cached: CheckoutOrder[] = EMPTY;

function notify() { window.dispatchEvent(new Event(EVENT)); }
export function previewSnapshot() {
  try {
    const entries: [string, string | null][] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith(PREVIEW_ORDER_PREFIX)) entries.push([key, localStorage.getItem(key)]);
    }
    entries.sort(([left], [right]) => left.localeCompare(right));
    const next = JSON.stringify(entries);
    if (next !== fingerprint) {
      fingerprint = next;
      cached = readPreviewOrders(localStorage, 0);
    }
    return cached;
  } catch { return EMPTY; }
}

export function subscribePreview(listener: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(PREVIEW_ORDER_PREFIX)) listener();
  };
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', storageChanged);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener('storage', storageChanged); };
}

export async function withPreviewLock<T>(code: string, action: () => T): Promise<T> {
  if (navigator.locks) return navigator.locks.request('cafe-preview:' + code, action);
  return action();
}

export function publishPreview(order: CheckoutOrder) {
  const inserted = insertPreviewOrder(localStorage, order);
  if (inserted) notify();
  return inserted;
}

export function changePreview(code: string, event: CheckoutEvent, expectedVersion?: string) {
  return withPreviewLock(code, () => {
    try { return updatePreviewOrder(localStorage, code, event, Date.now(), expectedVersion); }
    finally { notify(); }
  });
}

export function discardPreview(code: string) {
  return withPreviewLock(code, () => {
    const removed = removeEditablePreview(localStorage, code, Date.now());
    if (removed) notify();
    return removed;
  });
}

export function tickPreviews() {
  const now = Date.now();
  for (const order of previewSnapshot()) {
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'expired' && now >= order.expiresAt) {
      void changePreview(order.code, { type: 'tick' }).catch(() => { /* Another tab may have removed this draft. */ });
    }
  }
}

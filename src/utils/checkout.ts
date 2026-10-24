import type { CartItem } from '../types/cart.ts';
import { cartTotals } from './cart.ts';

export type PaymentMethod = 'transfer' | 'counter';
export type PaymentStatus = 'unpaid' | 'verifying' | 'paid' | 'failed' | 'expired';
export type PreparationStatus = 'received' | 'preparing' | 'ready' | 'served';
export interface CheckoutOrder {
  code: string;
  sessionId: number;
  tableName: string;
  items: CartItem[];
  note: string;
  total: number;
  createdAt: number;
  expiresAt: number;
  method: PaymentMethod;
  paymentStatus: PaymentStatus;
  preparationStatus: PreparationStatus | null;
}

export type CheckoutEvent =
  | { type: 'method'; method: PaymentMethod }
  | { type: 'confirm' | 'paid' | 'failed' | 'retry' | 'tick' | 'expire' | 'advance' };

const paymentStates: PaymentStatus[] = ['unpaid', 'verifying', 'paid', 'failed', 'expired'];
export const preparationStates: PreparationStatus[] = ['received', 'preparing', 'ready', 'served'];
export const PAYMENT_WINDOW_MS = 3 * 60 * 1000;

export function createCheckout(items: CartItem[], note: string, session: { id: number; tableName: string }, code: string, now: number): CheckoutOrder {
  if (!items.length || items.some(item => !Number.isSafeInteger(item.productId) || Number(item.productId) <= 0
    || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price)
    || item.price < 0 || item.isAvailable === false || item.options)) {
    throw new Error('Vui lòng kiểm tra các món và số lượng trong giỏ trước khi thanh toán.');
  }
  if (!Number.isSafeInteger(session.id) || session.id < 1 || !session.tableName.trim()) {
    throw new Error('Vui lòng quét QR để xác định bàn trước khi thanh toán.');
  }
  return {
    code, sessionId: session.id, tableName: session.tableName, items: items.map(item => ({ ...item })),
    note: note.slice(0, 500), total: cartTotals(items).total, createdAt: now, expiresAt: now + PAYMENT_WINDOW_MS,
    method: 'transfer', paymentStatus: 'unpaid', preparationStatus: null,
  };
}

export function transitionCheckout(order: CheckoutOrder, event: CheckoutEvent, now: number): CheckoutOrder {
  // Shorten pending previews saved under the old 5-minute setting without restarting their clock.
  if (order.paymentStatus !== 'paid' && order.expiresAt > order.createdAt + PAYMENT_WINDOW_MS) {
    order = { ...order, expiresAt: order.createdAt + PAYMENT_WINDOW_MS };
  }
  if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'expired' && now >= order.expiresAt) {
    return { ...order, paymentStatus: 'expired', preparationStatus: null };
  }
  switch (event.type) {
    case 'method':
      return order.paymentStatus === 'unpaid' ? { ...order, method: event.method } : order;
    case 'confirm':
      return order.paymentStatus === 'unpaid' ? { ...order, paymentStatus: 'verifying' } : order;
    case 'paid':
      return order.paymentStatus === 'verifying'
        ? { ...order, paymentStatus: 'paid', preparationStatus: 'received' } : order;
    case 'failed':
      return order.paymentStatus === 'verifying' ? { ...order, paymentStatus: 'failed' } : order;
    case 'retry':
      return order.paymentStatus === 'failed' ? { ...order, paymentStatus: 'unpaid' } : order;
    case 'expire':
      return order.paymentStatus !== 'paid' && order.paymentStatus !== 'expired'
        ? { ...order, expiresAt: now, paymentStatus: 'expired', preparationStatus: null } : order;
    case 'advance': {
      if (order.paymentStatus !== 'paid' || !order.preparationStatus || order.preparationStatus === 'served') return order;
      const next = preparationStates[preparationStates.indexOf(order.preparationStatus) + 1];
      return { ...order, preparationStatus: next };
    }
    default: return order;
  }
}

export function restoreCheckout(raw: string | null, now: number): CheckoutOrder | null {
  try {
    const parsed: unknown = JSON.parse(raw ?? 'null');
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as CheckoutOrder;
    if (typeof value.code !== 'string' || !value.code.startsWith('DEMO-')
      || !Number.isSafeInteger(value.sessionId) || value.sessionId < 1 || typeof value.tableName !== 'string'
      || typeof value.note !== 'string' || !Array.isArray(value.items) || !value.items.length
      || !Number.isFinite(value.createdAt) || !Number.isFinite(value.expiresAt) || value.createdAt > value.expiresAt
      || !paymentStates.includes(value.paymentStatus) || !['transfer', 'counter'].includes(value.method)) return null;
    if (value.items.some(item => !item || typeof item.id !== 'string' || typeof item.name !== 'string'
      || !Number.isSafeInteger(item.productId) || Number(item.productId) <= 0
      || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0)) return null;
    if (value.paymentStatus === 'paid' ? !preparationStates.includes(value.preparationStatus as PreparationStatus)
      : value.preparationStatus !== null) return null;
    return transitionCheckout({ ...value, total: cartTotals(value.items).total }, { type: 'tick' }, now);
  } catch { return null; }
}

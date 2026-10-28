import type { CheckoutOrder, PaymentMethod, PaymentStatus } from './checkout.ts';
import { matchesStaffSearch } from './staffOrders.ts';

export interface HistoryFilters {
  query: string;
  status: 'all' | PaymentStatus | 'served';
  method: 'all' | PaymentMethod;
  source: 'all' | 'customer' | 'samples';
  from: string;
  to: string;
  sessionId: number | null;
}

function localDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const date = new Date(value + 'T00:00:00');
  const [year, month, day] = value.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date.getTime() : NaN;
}

export function historyDateError(from: string, to: string) {
  if ((from && !Number.isFinite(localDay(from))) || (to && !Number.isFinite(localDay(to)))) return 'Ngày lọc chưa hợp lệ.';
  if (from && to && localDay(from) > localDay(to)) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
  return null;
}

export function filterOrderHistory(orders: CheckoutOrder[], filters: HistoryFilters) {
  if (historyDateError(filters.from, filters.to)) return [];
  const start = filters.from ? localDay(filters.from) : -Infinity;
  const nextDay = filters.to ? new Date(localDay(filters.to)) : null;
  if (nextDay) nextDay.setDate(nextDay.getDate() + 1);
  const end = nextDay?.getTime() ?? Infinity;
  return orders.filter(order => {
    if (order.createdAt < start || order.createdAt >= end) return false;
    if (filters.sessionId !== null && order.sessionId !== filters.sessionId) return false;
    if (filters.status === 'served' ? order.paymentStatus !== 'paid' || order.preparationStatus !== 'served'
      : filters.status !== 'all' && order.paymentStatus !== filters.status) return false;
    if (filters.method !== 'all' && order.method !== filters.method) return false;
    const sample = order.code.startsWith('DEMO-SAMPLE-');
    if (filters.source === 'samples' && !sample || filters.source === 'customer' && sample) return false;
    return matchesStaffSearch(order, filters.query);
  }).sort((left, right) => right.createdAt - left.createdAt || left.code.localeCompare(right.code));
}

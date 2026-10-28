import type { CheckoutOrder } from './checkout.ts';

export type StaffOrderFilter = 'payment' | 'kitchen' | 'ready' | 'history';
export function belongsToStaffFilter(order: CheckoutOrder, filter: StaffOrderFilter) {
  if (filter === 'payment') return ['unpaid', 'verifying', 'failed'].includes(order.paymentStatus);
  if (filter === 'kitchen') return order.paymentStatus === 'paid' && ['received', 'preparing'].includes(order.preparationStatus ?? '');
  if (filter === 'ready') return order.paymentStatus === 'paid' && order.preparationStatus === 'ready';
  return order.paymentStatus === 'expired' || (order.paymentStatus === 'paid' && order.preparationStatus === 'served');
}

export function orderStatusLabel(order: CheckoutOrder) {
  if (order.paymentStatus === 'expired') return 'Hết hạn';
  if (order.paymentStatus === 'failed') return 'Chưa nhận được tiền';
  if (order.paymentStatus === 'unpaid') return 'Chờ khách thanh toán';
  if (order.paymentStatus === 'verifying') return 'Chờ xác nhận nhận tiền';
  return ({ received: 'Đã nhận đơn', preparing: 'Đang pha chế', ready: 'Sẵn sàng phục vụ', served: 'Đã phục vụ' })[order.preparationStatus ?? 'received'];
}

export function matchesStaffSearch(order: CheckoutOrder, query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
  return normalize([order.code, order.tableName, ...order.items.map(item => item.name)].join(' ')).includes(normalize(query.trim()));
}

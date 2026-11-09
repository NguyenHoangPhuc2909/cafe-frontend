import type { OrderResponse } from '../types/order';

type OrderState = Pick<OrderResponse, 'status' | 'paymentStatus'>;

export function customerOrderPresentation(order: OrderState) {
  if (order.paymentStatus === 'REFUNDED') return {
    kind: 'refunded', tone: 'neutral', icon: 'payments', step: 2, stepStatus: 'error' as const, label: 'Đã hoàn tiền',
    title: 'Đơn đã được hoàn tiền',
    description: 'Liên hệ nhân viên nếu bạn cần hỗ trợ hoặc muốn đặt lại món.',
  };
  if (order.status === 'EXPIRED') return {
    kind: 'expired', tone: 'error', icon: 'schedule', step: 2, stepStatus: 'error' as const, label: 'Hết hạn',
    title: 'Đơn đã hết hạn thanh toán',
    description: 'Bạn có thể chọn lại món và tạo đơn mới khi sẵn sàng.',
  };
  if (order.status === 'COMPLETED') return {
    kind: 'completed', tone: 'success', icon: 'check', step: 3, stepStatus: 'finish' as const, label: 'Hoàn thành',
    title: 'Đơn hàng đã hoàn thành',
    description: 'Cảm ơn bạn đã dành thời gian tại L’Atelier Café.',
  };
  if (order.status === 'PREPARING') return {
    kind: 'preparing', tone: 'info', icon: 'coffee', step: 3, stepStatus: 'process' as const, label: 'Đang chuẩn bị',
    title: 'Quán đang chuẩn bị món',
    description: 'Món của bạn đang được chuẩn bị. Bạn có thể theo dõi đơn ngay tại đây.',
  };
  if (order.paymentStatus === 'PAID') return {
    kind: 'paid', tone: 'success', icon: 'check', step: 3, stepStatus: 'process' as const, label: 'Đã thanh toán',
    title: 'Đã xác nhận thanh toán',
    description: 'Quán đã ghi nhận thanh toán và sẽ tiếp tục xử lý đơn của bạn.',
  };
  return {
    kind: 'pending', tone: 'warning', icon: 'payments', step: 2, stepStatus: 'process' as const, label: 'Chờ thanh toán',
    title: 'Đơn đã gửi, chờ thanh toán',
    description: 'Cung cấp mã đơn cho nhân viên để thanh toán tiền mặt hoặc chuyển khoản.',
  };
}

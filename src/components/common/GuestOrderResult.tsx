import { useEffect, useState } from 'react';
import { useGuestSession } from '../../hooks/useGuestSession';
import { formatCurrency } from '../../utils/format';

export default function GuestOrderResult() {
  const { attempt, dismissAttempt, resolveUnknownOrder } = useGuestSession();
  const [resolution, setResolution] = useState<'created' | 'not-created' | null>(null);
  const [now, setNow] = useState(Date.now);
  const order = attempt?.order;
  useEffect(() => {
    if (!order) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [order]);
  if (!attempt) return null;
  if (attempt.state === 'sending') return <div role="status" className="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">Đang gửi đơn cho {attempt.tableName}… Vui lòng chờ kết quả.</div>;
  if (attempt.state === 'unknown') return <section role="alert" className="mb-6 rounded-2xl border border-error/30 bg-error-container/20 p-5 sm:p-6">
    <h2 className="text-lg font-bold text-primary">Chưa xác nhận được kết quả gửi đơn</h2>
    <p className="mt-2 text-sm leading-relaxed">Đơn cho {attempt.tableName} có thể đã được tạo lúc {new Date(attempt.startedAt).toLocaleTimeString('vi-VN')}. Bạn vui lòng nhờ nhân viên kiểm tra trước khi gửi tiếp để tránh trùng đơn. Giỏ hàng vẫn được giữ lại.</p>
    <fieldset className="mt-4 text-sm"><legend className="font-semibold">Kết quả kiểm tra với nhân viên</legend>
      <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3"><input type="radio" name="order-resolution" checked={resolution === 'not-created'} onChange={() => setResolution('not-created')} className="mt-1 h-5 w-5 shrink-0 accent-primary" /><span>Đơn chưa được tạo; giữ giỏ để gửi lại.</span></label>
      <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3"><input type="radio" name="order-resolution" checked={resolution === 'created'} onChange={() => setResolution('created')} className="mt-1 h-5 w-5 shrink-0 accent-primary" /><span>Đơn đã được tạo; xóa giỏ hiện tại để tránh gửi trùng.</span></label>
    </fieldset>
    <button disabled={!resolution} onClick={() => resolveUnknownOrder(resolution === 'created')} className="mt-3 min-h-11 rounded-xl border border-primary px-5 text-sm font-semibold text-primary disabled:opacity-40">Xác nhận kết quả kiểm tra</button>
  </section>;
  if (!order) return null;
  const remaining = Math.max(0, Math.ceil((Date.parse(order.paymentExpiresAt) - now) / 1000));
  const unpaid = order.paymentStatus === 'UNPAID';
  return <section aria-label="Kết quả đặt món" className="mb-6 rounded-2xl border border-secondary/30 bg-surface-container-lowest p-5 sm:p-6">
    <p role="status" className="text-sm font-semibold text-secondary">Đã tạo đơn thành công</p>
    <h2 className="mt-1 break-words text-xl font-bold text-primary">Đơn #{order.id} · {order.tableName}</h2>
    <ul className="mt-4 space-y-2 text-sm">{order.items.map(item => <li key={item.id} className="flex justify-between gap-4"><span>{item.quantity} × {item.productName}</span><span className="shrink-0">{formatCurrency(item.price * item.quantity)}</span></li>)}</ul>
    <p className="mt-4 flex justify-between gap-3 border-t border-outline-variant/30 pt-4 font-semibold text-primary"><span>Tổng tiền từ quán</span><span>{formatCurrency(order.totalAmount)}</span></p>
    <p className="mt-3 text-sm text-on-surface-variant">Trạng thái lúc tạo: {order.status === 'PENDING' ? 'Chờ xử lý' : order.status} · {unpaid ? 'Chưa thanh toán' : order.paymentStatus}</p>
    {unpaid && <div className="mt-4 rounded-xl bg-surface-container-low p-4 text-sm leading-relaxed">
      <p>Hạn thanh toán: <strong>{new Date(order.paymentExpiresAt).toLocaleString('vi-VN')}</strong></p>
      {remaining > 0 ? <p>Còn {Math.floor(remaining / 60)} phút {String(remaining % 60).padStart(2, '0')} giây theo giờ thiết bị. Vui lòng liên hệ nhân viên về thanh toán.</p>
        : <p>Đã qua hạn thanh toán ghi trên đơn. Vui lòng nhờ nhân viên kiểm tra tình trạng đơn trước khi đặt lại.</p>}
    </div>}
    <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">Đây là kết quả lúc gửi đơn, chưa cập nhật trạng thái thanh toán hay xử lý món sau đó.</p>
    <button onClick={dismissAttempt} className="mt-5 min-h-11 rounded-xl border border-primary px-5 text-sm font-semibold text-primary">Đã xem · Tiếp tục chọn món</button>
  </section>;
}

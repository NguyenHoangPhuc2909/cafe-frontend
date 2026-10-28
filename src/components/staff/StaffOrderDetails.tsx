import { useState } from 'react';
import type { CheckoutEvent, CheckoutOrder } from '../../utils/checkout';
import { formatCurrency } from '../../utils/format';
import { orderStatusLabel } from '../../utils/staffOrders';
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';
import { changePreview } from '../../services/previewOrders';
import { previewVersion } from '../../utils/previewOrders';

export default function StaffOrderDetails({ order }: { order: CheckoutOrder }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const countdown = usePaymentCountdown(order.expiresAt);
  const isPaid = order.paymentStatus === 'paid';
  const isVerifying = order.paymentStatus === 'verifying';
  const nextAction = order.preparationStatus === 'received' ? 'Bắt đầu pha chế'
    : order.preparationStatus === 'preparing' ? 'Đánh dấu đã pha xong' : 'Xác nhận đã phục vụ';

  const act = async (event: CheckoutEvent) => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await changePreview(order.code, event, previewVersion(order)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa cập nhật được đơn.'); }
    finally { setBusy(false); }
  };

  return <section aria-label={`Chi tiết đơn ${order.code}`} className="min-w-0 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-sm">
    <div className="border-b border-outline-variant/30 bg-surface-container-lowest p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{order.tableName}</p>
      <h2 className="mt-2 break-words text-xl font-bold text-primary">{order.code}</h2>
      <p className="mt-2 text-sm text-on-surface-variant">{new Date(order.createdAt).toLocaleTimeString('vi-VN')} · {order.method === 'counter' ? 'Tại quầy' : 'Chuyển khoản'}</p>
      <p className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${isPaid ? 'bg-green-100 text-green-800' : order.paymentStatus === 'expired' ? 'bg-error-container text-error' : 'bg-secondary-fixed text-on-secondary-container'}`}>{orderStatusLabel(order)}</p>
    </div>
    <div className="p-5">
      <ul className="space-y-4 text-sm">{order.items.map(item => <li key={item.id} className="flex items-start justify-between gap-4">
        <span className="min-w-0 break-words"><strong className="mr-2 text-primary">{item.quantity}×</strong>{item.name}</span>
        <span className="shrink-0 font-semibold">{formatCurrency(item.price * item.quantity)}</span>
      </li>)}</ul>
      {order.note && <p className="mt-5 break-words rounded-xl bg-secondary-fixed/40 p-3 text-sm"><strong>Ghi chú:</strong> {order.note}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-5"><span className="text-sm font-semibold">{isPaid ? 'Đã xác nhận nhận tiền' : 'Cần thanh toán'}</span><strong className="text-2xl text-primary">{formatCurrency(order.total)}</strong></div>
      {!isPaid && order.paymentStatus !== 'expired' && <p className="mt-3 text-sm text-on-surface-variant">Hạn nhận tiền còn <strong className="tabular-nums text-primary">{countdown}</strong>. Đơn chưa vào quầy pha chế.</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-error-container p-3 text-sm text-error">{error}</p>}
      {isVerifying && <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h3 className="font-semibold text-primary">Đối chiếu trước khi xác nhận</h3>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">Kiểm tra đúng mã đơn và số tiền. Xác nhận khi đã nhận tiền tại quầy hoặc đã đối chiếu giao dịch chuyển khoản.</p>
        <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={acknowledged} disabled={busy} onChange={event => setAcknowledged(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-primary" /><span>Tôi đã kiểm tra đúng đơn và nhận đủ <strong>{formatCurrency(order.total)}</strong>.</span></label>
        <button type="button" disabled={!acknowledged || busy} onClick={() => void act({ type: 'paid' })} className="mt-3 min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Đang xác nhận…' : 'Xác nhận đã nhận tiền'}</button>
        <button type="button" disabled={busy} onClick={() => void act({ type: 'failed' })} className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface-variant disabled:opacity-40">Chưa nhận được tiền · Yêu cầu kiểm tra lại</button>
      </div>}
      {order.paymentStatus === 'unpaid' && <p className="mt-5 rounded-xl bg-surface-container p-4 text-sm">Khách đang chọn phương thức thanh toán. Chờ khách gửi yêu cầu xác nhận.</p>}
      {order.paymentStatus === 'failed' && <p className="mt-5 rounded-xl bg-surface-container p-4 text-sm">Đang chờ khách kiểm tra và thử lại. Hạn thanh toán giữ nguyên.</p>}
      {order.paymentStatus === 'expired' && <p className="mt-5 rounded-xl bg-error-container/40 p-4 text-sm">Đơn đã hết hạn thanh toán. Không nhận đơn này vào quầy pha chế.</p>}
      {isPaid && order.preparationStatus !== 'served' && <button type="button" disabled={busy} onClick={() => void act({ type: 'advance' })} className="mt-5 min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary disabled:opacity-40">{busy ? 'Đang cập nhật…' : nextAction}</button>}
      {order.preparationStatus === 'served' && <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800">Đơn đã được phục vụ hoàn tất.</p>}
    </div>
  </section>;
}

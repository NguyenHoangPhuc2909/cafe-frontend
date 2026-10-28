import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCheckout } from '../../hooks/useCheckout';
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';
import CustomerFlowSteps from '../../components/common/CustomerFlowSteps';
import CheckoutSummary from '../../components/common/CheckoutSummary';
import { formatCurrency } from '../../utils/format';

export default function CheckoutPage() {
  const { order, dispatch, returnToCart, error } = useCheckout();
  const countdown = usePaymentCountdown(order?.expiresAt);
  const navigate = useNavigate();
  if (!order) return <Navigate to="/cart" replace />;
  if (order.paymentStatus === 'paid') return <Navigate to="/order-status" replace />;
  const status = order.paymentStatus;
  const canEdit = ['unpaid', 'failed', 'expired'].includes(status);
  const editCart = async () => { if (await returnToCart()) navigate('/cart', { replace: true }); };

  return <div className="mx-auto max-w-5xl animate-fade-up">
    <CustomerFlowSteps current={2} />
    <h1 className="text-2xl font-bold text-primary sm:text-3xl">{status === 'verifying' ? 'Chờ xác nhận thanh toán' : 'Thanh toán đơn hàng'}</h1>
    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">Quán bắt đầu chuẩn bị món sau khi xác nhận đã nhận tiền.</p>
    <p className="mt-4 rounded-xl border border-secondary/20 bg-surface-container-low p-3 text-xs text-on-surface-variant">Bản thử luồng đặt món · Không thu tiền hoặc tạo đơn trong hệ thống của quán.</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-error-container/30 p-4 text-sm text-error">{error}</p>}
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
      <CheckoutSummary order={order} />
      <section aria-label="Thanh toán" className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
        {status !== 'expired' && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4 text-sm">
          <span>Hoàn tất thanh toán trong</span><strong className="text-2xl tabular-nums text-primary" aria-label={`Thời gian còn lại ${countdown}`}>{countdown}</strong>
        </div>}
        {status === 'unpaid' && <>
          <h2 className="text-lg font-bold text-primary">Chọn phương thức thanh toán</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{(['transfer', 'counter'] as const).map(method => <button key={method} type="button"
            aria-pressed={order.method === method} onClick={() => dispatch({ type: 'method', method })}
            className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-semibold ${order.method === method ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40 text-primary'}`}>
            {method === 'transfer' ? 'Chuyển khoản' : 'Thanh toán tại quầy'}
          </button>)}</div>
          {order.method === 'transfer' ? <div className="mt-5 rounded-xl bg-surface-container-low p-5 text-center">
            <span aria-hidden="true" className="material-symbols-outlined text-6xl text-primary">qr_code_2</span>
            <p className="mt-2 font-semibold text-primary">Khu vực QR thanh toán mẫu</p>
            <p className="mt-2 text-sm text-on-surface-variant">QR minh họa, không chuyển tiền thật. Nhân viên sẽ xác nhận thanh toán trong bản thử.</p>
            <p className="mt-4 text-xl font-bold text-primary">{formatCurrency(order.total)}</p>
          </div> : <div className="mt-5 rounded-xl bg-surface-container-low p-5 text-sm leading-relaxed">
            <p className="font-semibold text-primary">Thanh toán trực tiếp với nhân viên</p>
            <p className="mt-2">Cung cấp mã <strong>{order.code}</strong> tại quầy và thanh toán <strong>{formatCurrency(order.total)}</strong>. Đơn sẽ chờ nhân viên xác nhận nhận tiền.</p>
          </div>}
          <button type="button" onClick={() => dispatch({ type: 'confirm' })} className="mt-5 min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary hover:bg-primary-container">
            {order.method === 'transfer' ? 'Tôi đã chuyển khoản' : 'Tiếp tục thanh toán tại quầy'}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">Thao tác này gửi yêu cầu xác nhận. Đơn vẫn chờ thanh toán cho đến khi nhận được kết quả.</p>
        </>}
        {status === 'verifying' && <div role="status" className="rounded-xl bg-surface-container-low p-5 text-center">
          <span aria-hidden="true" className="material-symbols-outlined text-5xl text-secondary">hourglass_top</span>
          <h2 className="mt-3 text-lg font-bold text-primary">Đang chờ xác nhận nhận tiền</h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{order.method === 'transfer' ? 'Yêu cầu xác nhận chuyển khoản đã được ghi nhận trong bản thử.' : 'Vui lòng đến quầy thanh toán và đợi nhân viên xác nhận.'} Đơn chưa chuyển sang pha chế.</p>
          <p className="mt-3 text-sm font-semibold text-primary">Bạn không cần gửi lại đơn hoặc thanh toán thêm lần nữa.</p>
        </div>}
        {status === 'failed' && <div role="alert" className="rounded-xl bg-error-container/20 p-5">
          <h2 className="text-lg font-bold text-primary">Thanh toán chưa thành công</h2>
          <p className="mt-2 text-sm leading-relaxed">Bản thử chưa ghi nhận nhận tiền. Đơn chưa được chuyển sang pha chế. Bạn có thể chọn lại phương thức trong thời gian còn lại.</p>
          <button type="button" onClick={() => dispatch({ type: 'retry' })} className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary">Thử thanh toán lại</button>
        </div>}
        {status === 'expired' && <div role="alert" className="rounded-xl bg-error-container/20 p-5">
          <h2 className="text-lg font-bold text-primary">Đã hết thời gian thanh toán</h2>
          <p className="mt-2 text-sm leading-relaxed">Lượt thanh toán này đã kết thúc. Giỏ hàng vẫn được giữ để bạn kiểm tra và bắt đầu lượt mới. Quán chưa nhận đơn để pha chế.</p>
          <button type="button" onClick={editCart} className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary">Quay lại giỏ hàng</button>
        </div>}
        {canEdit && status !== 'expired' && <button type="button" onClick={editCart} className="mt-4 min-h-11 text-sm font-semibold text-primary underline">Chỉnh sửa giỏ hàng</button>}
      </section>
    </div>
    {import.meta.env.DEV && <div className="mt-6 rounded-xl border border-dashed border-outline-variant p-4 text-sm">
      <p>Thử hai vai: giữ trang khách tại đây, mở màn hình Staff ở tab khác để xác nhận tiền.</p>
      <Link to="/staff/orders" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary underline">Mở màn hình Staff thử nghiệm</Link>
    </div>}
    <Link to="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary">Về thực đơn</Link>
  </div>;
}

import { Link, Navigate, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useCheckout } from '../../hooks/useCheckout';
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';
import CheckoutSummary from '../../components/common/CheckoutSummary';
import CustomerFlowSteps from '../../components/common/CustomerFlowSteps';
import { customerOrderPresentation } from '../../utils/customerOrderPresentation';

export default function CheckoutPage() {
  const { order, startNewOrder, error } = useCheckout();
  const navigate = useNavigate();
  const deadline = order ? Date.parse(order.paymentExpiresAt) : undefined;
  const { countdown, remainingSeconds } = usePaymentCountdown(deadline);
  if (!order) return <Navigate to="/cart" replace />;

  const view = customerOrderPresentation(order);
  const pending = view.kind === 'pending';
  const canChooseMore = order.paymentStatus === 'PAID' || order.status === 'EXPIRED';
  const chooseMore = () => { if (startNewOrder()) navigate('/'); };

  return <div className="customer-flow-page">
    <CustomerFlowSteps current={view.step} status={view.stepStatus} />
    <header className="customer-page-heading">
      <div><h1>Đơn hàng của bạn</h1><p>Đơn #{order.id}<span className="customer-meta-dot">·</span>{order.tableName}</p></div>
      <Link to="/" className="customer-text-link"><Icon name="arrow_back" />Về thực đơn</Link>
    </header>

    <section className={`customer-order-banner customer-order-banner--${view.tone}`} aria-live="polite">
      <span className="customer-order-banner__icon"><Icon name={view.icon} /></span>
      <div><h2>{view.title}</h2><p>{view.description}</p></div>
    </section>
    {error && <div role="alert" className="customer-notice customer-notice--error"><Icon name="cloud_off" /><div><p>{error}</p><small>Thông tin đang hiển thị là lần cập nhật gần nhất từ quán.</small></div></div>}

    <div className="customer-checkout-grid">
      <div className="customer-panel">
        <div className="customer-panel-heading"><h2>Chi tiết đơn hàng</h2><span>{order.items.reduce((count, item) => count + item.quantity, 0)} món</span></div>
        <CheckoutSummary embedded showHeading={false} order={order} />
      </div>
      <aside className="customer-panel customer-checkout-guide" aria-label={pending ? 'Hướng dẫn thanh toán' : 'Thông tin nhận món'}>
        <h2><Icon name={pending ? 'payments' : 'coffee'} />{pending ? 'Thanh toán tại quán' : 'Thông tin đơn hàng'}</h2>
        {pending ? <>
          <ol className="customer-payment-instructions">
            <li><span>1</span><div><strong>Cung cấp mã đơn cho nhân viên</strong><p>Mã đơn của bạn là <b>#{order.id}</b>, tại {order.tableName}.</p></div></li>
            <li><span>2</span><div><strong>Thanh toán và chờ xác nhận</strong><p>Thanh toán tiền mặt hoặc chuyển khoản theo thông tin nhân viên cung cấp.</p></div></li>
          </ol>
          <div className="customer-payment-timer"><Icon name="schedule" /><div><span>{remainingSeconds > 0 ? 'Thời gian thanh toán còn lại' : 'Đang kiểm tra thời hạn thanh toán'}</span>{remainingSeconds > 0 && <strong>{countdown}</strong>}</div></div>
          <p className="customer-help-text">Thời gian theo giờ thiết bị. Trạng thái đơn được xác nhận từ quán.</p>
        </> : <p className="customer-guide-copy">{view.kind === 'expired' ? 'Đơn này không còn hiệu lực để thanh toán. Chọn lại món để tạo một đơn mới.' : view.kind === 'refunded' ? 'Nhờ nhân viên hỗ trợ nếu bạn cần kiểm tra thông tin hoàn tiền.' : view.kind === 'completed' ? 'Bạn có thể gọi thêm món bất cứ khi nào muốn.' : `Giữ mã đơn #${order.id} để tiện trao đổi với nhân viên khi nhận món.`}</p>}
        <p className="customer-live-status"><span className={error ? 'customer-live-status__dot customer-live-status__dot--offline' : 'customer-live-status__dot'} />{error ? 'Đang chờ kết nối lại' : 'Trạng thái tự động cập nhật từ quán'}</p>
        {canChooseMore && <button type="button" onClick={chooseMore} className="ui-button ui-button--primary w-full"><Icon name="add" />{order.status === 'EXPIRED' ? 'Chọn món lại' : 'Gọi thêm món'}</button>}
        <Link to="/" className="ui-button mt-3 w-full">Xem thực đơn<Icon name="arrow_forward" /></Link>
      </aside>
    </div>
  </div>;
}

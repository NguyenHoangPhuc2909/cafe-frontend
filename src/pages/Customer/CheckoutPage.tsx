import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useCheckout } from '../../hooks/useCheckout';
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';
import CheckoutSummary from '../../components/common/CheckoutSummary';
import CustomerFlowSteps from '../../components/common/CustomerFlowSteps';
import { customerOrderPresentation } from '../../utils/customerOrderPresentation';
import { useGuestSession } from '../../hooks/useGuestSession';
import Pagination from '../../components/ui/Pagination';
import { formatCurrency } from '../../utils/format';
import { useState } from 'react';
import { Drawer, Grid } from 'antd';

export default function CheckoutPage() {
  const { order, orders, page, totalPages, setPage, selectOrder, isLoadingOrders,
    reloadOrders, startNewOrder, error } = useCheckout();
  const { isSubmitting, isChecking, attempt } = useGuestSession();
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const deadline = order ? Date.parse(order.paymentExpiresAt) : undefined;
  const { countdown, remainingSeconds } = usePaymentCountdown(deadline);
  if (!order) return <div className="customer-flow-page">
    <h1 className="text-2xl font-bold text-primary">Các đơn đã gọi</h1>
    {isLoadingOrders ? <p role="status" className="my-4">Đang tải đơn của phiên bàn…</p>
      : <p className="my-4">Chưa có đơn để hiển thị trong trang này.</p>}
    {error && <p role="alert" className="my-4 text-error">{error}</p>}
    <button type="button" onClick={reloadOrders} className="ui-button">Tải lại đơn</button>
    {totalPages > 1 && <Pagination page={page} totalPages={totalPages} disabled={isLoadingOrders} onPageChange={setPage} />}
    <Link to="/cart" className="ui-button mt-4">Về giỏ hàng</Link>
  </div>;

  const view = customerOrderPresentation(order);
  const pending = view.kind === 'pending';
  const canChooseMore = !isSubmitting && !isChecking &&
    (!attempt || attempt.state === 'success');
  const chooseMore = () => { if (startNewOrder()) navigate('/'); };

  return <div className="customer-flow-page">
    <CustomerFlowSteps current={view.step} status={view.stepStatus} />
    <header className="customer-page-heading">
      <div><h1>Đơn hàng của bạn</h1><p>Đơn #{order.id}<span className="customer-meta-dot">·</span>{order.tableName}</p></div>
      <div className="customer-checkout-actions">
        {(orders.length > 1 || totalPages > 1) && <button type="button"
          onClick={() => setHistoryOpen(true)} className="customer-orders-trigger">
          <Icon name="history" />Các đơn đã gọi
        </button>}
        <Link to="/" className="customer-text-link"><Icon name="arrow_back" />Về thực đơn</Link>
      </div>
    </header>

    <Drawer title="Các đơn đã gọi" open={historyOpen} onClose={() => setHistoryOpen(false)}
      placement={screens.md ? 'right' : 'bottom'} size={screens.md ? 400 : 'auto'}
      styles={{ wrapper: screens.md ? {} : { maxHeight: '85dvh' }, body: { padding: 20 } }}>
      <p className="customer-orders-hint">Chọn đơn để xem chi tiết và trạng thái.</p>
      <div className="customer-orders-list">
        {orders.map(value => {
          const status = customerOrderPresentation(value);
          const active = order.id === value.id;
          return <button type="button" key={value.id} aria-pressed={active}
            className="customer-order-choice" onClick={() => { selectOrder(value.id); setHistoryOpen(false); }}>
            <span className="customer-order-choice__top">
              <strong>Đơn #{value.id}</strong>
              <span className={`customer-order-choice__status customer-order-choice__status--${status.tone}`}>
                {status.label}
              </span>
            </span>
            <span className="customer-order-choice__bottom">
              <span>{value.items.reduce((count, item) => count + item.quantity, 0)} món</span>
              <strong>{formatCurrency(value.totalAmount)}</strong>
            </span>
            {active && <span className="customer-order-choice__selected"><Icon name="check" />Đang xem</span>}
          </button>;
        })}
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} disabled={isLoadingOrders} onPageChange={setPage} />}
    </Drawer>

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

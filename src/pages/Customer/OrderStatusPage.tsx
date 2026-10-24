import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCheckout } from '../../hooks/useCheckout';
import { preparationStates } from '../../utils/checkout';
import CustomerFlowSteps from '../../components/common/CustomerFlowSteps';
import CheckoutSummary from '../../components/common/CheckoutSummary';

const stages = {
  received: { title: 'Quán đã nhận đơn', detail: 'Thanh toán đã được xác nhận. Đơn của bạn đã vào hàng chờ pha chế.', icon: 'receipt_long' },
  preparing: { title: 'Quán đang pha chế', detail: 'Nhân viên đang chuẩn bị những món bạn đã chọn.', icon: 'local_cafe' },
  ready: { title: 'Món đã sẵn sàng', detail: 'Món của bạn đã chuẩn bị xong và đang chờ được phục vụ.', icon: 'room_service' },
  served: { title: 'Đã phục vụ', detail: 'Chúc bạn thưởng thức ngon miệng. Cảm ơn bạn đã ghé quán!', icon: 'check_circle' },
};

export default function OrderStatusPage() {
  const { order, dispatch, finishOrder } = useCheckout();
  const navigate = useNavigate();
  if (!order) return <Navigate to="/cart" replace />;
  if (order.paymentStatus !== 'paid' || !order.preparationStatus) return <Navigate to="/checkout" replace />;
  const current = preparationStates.indexOf(order.preparationStatus);
  const stage = stages[order.preparationStatus];
  const finish = () => { finishOrder(); navigate('/', { replace: true }); };
  const nextLabel = ['Bắt đầu pha chế', 'Đã pha xong', 'Đã phục vụ'][current];

  return <div className="mx-auto max-w-5xl animate-fade-up">
    <CustomerFlowSteps current={3} />
    <p className="mb-5 rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">Bản thử luồng đặt món · Trạng thái thanh toán và pha chế đang được mô phỏng.</p>
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <section aria-label="Tiến trình phục vụ" className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
        <div role="status" className="text-center">
          <span aria-hidden="true" className="material-symbols-outlined text-6xl text-secondary">{stage.icon}</span>
          <p className="mt-3 text-sm font-semibold text-secondary">Đã xác nhận thanh toán</p>
          <h1 className="mt-2 text-2xl font-bold text-primary">{stage.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{stage.detail}</p>
        </div>
        <ol className="mt-7 space-y-5">{preparationStates.map((status, index) => <li key={status} aria-current={index === current ? 'step' : undefined} className="flex items-start gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${index <= current ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>{index < current ? '✓' : index + 1}</span>
          <div><p className={`text-sm ${index <= current ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}>{stages[status].title}</p>
            {index === current && <p className="mt-1 text-xs text-secondary">{status === 'served' ? 'Hoàn tất' : 'Hiện tại'}</p>}</div>
        </li>)}</ol>
        {order.preparationStatus === 'served' ? <button type="button" onClick={finish} className="mt-7 min-h-12 w-full rounded-xl bg-primary px-5 font-semibold text-on-primary">Hoàn tất · Về thực đơn</button>
          : <Link to="/" className="mt-7 flex min-h-11 items-center justify-center rounded-xl border border-primary px-5 text-sm font-semibold text-primary">Về thực đơn trong lúc chờ</Link>}
      </section>
      <CheckoutSummary order={order} />
    </div>
    {import.meta.env.DEV && order.preparationStatus !== 'served' && <section className="mt-6 rounded-xl border border-dashed border-outline-variant p-4">
      <h2 className="text-sm font-semibold text-primary">Điều khiển thử nghiệm · Mô phỏng thao tác nhân viên</h2>
      <button type="button" onClick={() => dispatch({ type: 'advance' })} className="mt-3 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary">{nextLabel}</button>
    </section>}
  </div>;
}

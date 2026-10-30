import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCheckout } from '../../hooks/useCheckout';
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';
import CheckoutSummary from '../../components/common/CheckoutSummary';
import CustomerFlowSteps from '../../components/common/CustomerFlowSteps';

export default function CheckoutPage() {
  const {
    order,
    refreshOrder,
    startNewOrder,
    error,
  } = useCheckout();

  const navigate = useNavigate();
  const countdown = usePaymentCountdown(
    order ? Date.parse(order.paymentExpiresAt) : undefined,
  );

  if (!order) return <Navigate to="/cart" replace />;

  const paid = order.paymentStatus === 'PAID';
  const expired = order.status === 'EXPIRED';

  const chooseMore = () => {
    if (startNewOrder()) navigate('/');
  };

  return (
    <div className="mx-auto max-w-5xl">
      <CustomerFlowSteps current={2} />

      <h1 className="text-2xl font-bold text-primary">
        {paid
          ? 'Đã xác nhận thanh toán'
          : expired
            ? 'Đơn đã hết hạn'
            : 'Chờ thanh toán'}
      </h1>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-error-container/30 p-4 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
        <CheckoutSummary order={order} />

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
          {paid ? (
            <p>Nhân viên đã xác nhận nhận tiền cho đơn #{order.id}.</p>
          ) : expired ? (
            <p>Đơn đã hết hạn thanh toán. Bạn có thể chọn món để tạo đơn mới.</p>
          ) : (
            <>
              <p>
                Vui lòng cung cấp mã đơn <strong>#{order.id}</strong> cho
                nhân viên để thanh toán tiền mặt hoặc chuyển khoản.
              </p>
              <p className="mt-3">
                Thời gian còn lại theo giờ thiết bị:
                {' '}<strong>{countdown}</strong>.
              </p>
              <p className="mt-3 text-sm text-on-surface-variant">
                Trạng thái thanh toán được cập nhật từ quán.
              </p>
            </>
          )}

          <button
            type="button"
            onClick={refreshOrder}
            className="mt-5 min-h-11 rounded-xl border border-primary px-4 font-semibold text-primary"
          >
            Cập nhật trạng thái
          </button>

          {(paid || expired) && (
            <button
              type="button"
              onClick={chooseMore}
              className="mt-3 min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary"
            >
              {paid ? 'Gọi thêm món' : 'Chọn món lại'}
            </button>
          )}

          <Link to="/" className="mt-4 block py-3 text-sm font-semibold text-primary">
            Về thực đơn
          </Link>
        </section>
      </div>
    </div>
  );
}
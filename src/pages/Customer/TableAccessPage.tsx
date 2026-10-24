import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTable, guestErrorMessage } from '../../services/guest';
import { useGuestSession } from '../../hooks/useGuestSession';
import { useCustomerCart } from '../../hooks/useCustomerCart';
import type { CafeTableResponse } from '../../types/guest';
import { useCheckout } from '../../hooks/useCheckout';

function TableAccess({ qrCode }: { qrCode: string }) {
  const navigate = useNavigate();
  const { connectTable, isChecking, session, attempt } = useGuestSession();
  const { itemCount } = useCustomerCart();
  const { order, returnToCart } = useCheckout();
  const hasActiveOrder = order && order.paymentStatus !== 'expired';
  const [table, setTable] = useState<CafeTableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getTable(qrCode, controller.signal).then(value => {
      if (!controller.signal.aborted) setTable(value);
    }).catch(error => {
      if (!controller.signal.aborted) setError(guestErrorMessage(error));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [qrCode, version]);

  const connect = async () => {
    setConnecting(true); setError(null);
    try {
      await connectTable(qrCode);
      if (order?.paymentStatus === 'expired') returnToCart();
      navigate('/', { replace: true });
    }
    catch (error) { setError(guestErrorMessage(error)); }
    finally { setConnecting(false); }
  };

  return <section className="mx-auto max-w-lg rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 text-center sm:p-9" aria-busy={loading || connecting}>
    <span aria-hidden="true" className="material-symbols-outlined mb-4 text-5xl text-secondary">qr_code_2</span>
    <h1 className="font-headline-lg text-2xl font-bold text-primary">{loading ? 'Đang tìm bàn…' : table?.name ?? 'Xác nhận bàn'}</h1>
    {error && <p role="alert" className="mt-4 rounded-xl bg-error-container/30 p-4 text-sm text-error">{error}</p>}
    {!loading && table && <>
      <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{table.isActive ? 'Kiểm tra đúng bàn bạn đang ngồi rồi bắt đầu chọn món.' : 'Bàn đang ngừng sử dụng. Bạn vui lòng liên hệ nhân viên.'}</p>
      {session && itemCount > 0 && <p className="mt-4 text-sm text-on-surface-variant">Bạn đang chọn món cho {session.tableName}. Nếu chuyển sang bàn hoặc phiên phục vụ khác, giỏ hiện tại sẽ được xóa sau khi kết nối thành công.</p>}
      {hasActiveOrder ? <Link to={order.paymentStatus === 'paid' ? '/order-status' : '/checkout'} className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 font-semibold text-on-primary">Tiếp tục đơn của {order.tableName} trước khi chọn bàn</Link>
        : attempt ? <Link to="/cart" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 font-semibold text-on-primary">Xem kết quả đơn trước khi chọn bàn</Link>
        : <button onClick={() => void connect()} disabled={!table.isActive || connecting || isChecking} className="mt-6 min-h-12 w-full rounded-xl bg-primary px-6 font-semibold text-on-primary disabled:opacity-50">{connecting ? 'Đang vào bàn…' : `Bắt đầu đặt món · ${table.name}`}</button>}
    </>}
    {!loading && !table && <button onClick={() => { setLoading(true); setError(null); setVersion(value => value + 1); }} className="mt-5 min-h-11 rounded-xl border border-primary px-5 font-semibold text-primary">Thử lại</button>}
    <Link to="/" className="mt-5 block py-3 text-sm font-semibold text-primary">Xem thực đơn</Link>
  </section>;
}

export default function TableAccessPage() {
  const { qrCode } = useParams();
  return <TableAccess key={qrCode} qrCode={qrCode ?? ''} />;
}

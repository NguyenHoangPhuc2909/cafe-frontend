import { TableAccessSkeleton } from '../../components/ui/Skeleton';
import Icon from '../../components/ui/Icon';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTable, guestErrorMessage } from '../../services/guest';
import { useGuestSession } from '../../hooks/useGuestSession';
import { useCustomerCart } from '../../hooks/useCustomerCart';
import type { CafeTableResponse } from '../../types/guest';

function TableAccess({ qrCode }: { qrCode: string }) {
  const navigate = useNavigate();
  const { connectTable, isChecking, session, attempt } = useGuestSession();
  const { itemCount } = useCustomerCart();
  const [table, setTable] = useState<CafeTableResponse | null>(null);
  const canConnect = !attempt || attempt.state === 'success';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getTable(qrCode, controller.signal).then(value => {
      if (!controller.signal.aborted) setTable(value);
    }).catch(error => {
      if (!controller.signal.aborted) setError(guestErrorMessage(error));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [qrCode]);

  const connect = async () => {
    setConnecting(true); setError(null);
    try {
      await connectTable(qrCode);
      navigate('/', { replace: true });
    }
    catch (error) { setError(guestErrorMessage(error)); }
    finally { setConnecting(false); }
  };

  if (loading) return <section className="customer-panel customer-table-access" aria-busy="true">
    <h1 className="sr-only">Xác nhận bàn</h1><TableAccessSkeleton />
    <Link to="/" className="customer-text-link mt-4 justify-center">Xem thực đơn</Link>
  </section>;

  return <section className="customer-panel customer-table-access" aria-busy={loading || connecting}>
    <span aria-hidden="true" className="icon-slot mb-4 text-5xl text-secondary"><Icon name="qr_code_2" /></span>
    <h1 className="font-headline-lg text-2xl font-bold text-primary">{loading ? 'Đang tìm bàn…' : table?.name ?? 'Xác nhận bàn'}</h1>
    {error && <p role="alert" className="mt-4 rounded-xl bg-error-container/30 p-4 text-sm text-error">{error}</p>}
    {!loading && table && <>
      <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{table.isActive ? 'Kiểm tra đúng bàn bạn đang ngồi rồi bắt đầu chọn món.' : 'Bàn đang ngừng sử dụng. Bạn vui lòng liên hệ nhân viên.'}</p>
      {session && itemCount > 0 && <p className="mt-4 text-sm text-on-surface-variant">Bạn đang chọn món cho {session.tableName}. Nếu chuyển sang bàn hoặc phiên phục vụ khác, giỏ hiện tại sẽ được xóa sau khi kết nối thành công.</p>}
      {!canConnect ? (
  <Link
    to="/cart"
    className="ui-button ui-button--primary mt-6 w-full"
  >
    Kiểm tra kết quả gửi đơn trước khi chọn bàn
  </Link>
) : (
  <button
    onClick={() => void connect()}
    disabled={!table.isActive || connecting || isChecking}
    className="ui-button ui-button--primary mt-6 w-full"
  >
    {connecting
      ? 'Đang vào bàn…'
      : session?.tableId === table.id
        ? 'Tiếp tục đặt món'
        : `Bắt đầu đặt món · ${table.name}`}
  </button>
)}
    </>}
    <Link to="/" className="customer-text-link mt-4 justify-center">Xem thực đơn</Link>
  </section>;
}

export default function TableAccessPage() {
  const { qrCode } = useParams();
  return <TableAccess key={qrCode} qrCode={qrCode ?? ''} />;
}

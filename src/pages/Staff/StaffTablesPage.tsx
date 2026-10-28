import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { useStaffTables } from '../../hooks/useStaffTables';
import { usePreviewOrders } from '../../hooks/usePreviewOrders';
import { filterStaffTables, tableState } from '../../utils/staffTables';
import type { StaffTableFilter } from '../../types/staffApi';
import { openStaffTableSession, staffErrorMessage } from '../../services/staffApi';
import { formatCurrency } from '../../utils/format';

const states = {
  open: { title: 'Có phiên phục vụ', color: 'border-primary bg-primary/5', badge: 'bg-primary text-on-primary', icon: 'restaurant' },
  idle: { title: 'Chưa mở phiên', color: 'border-outline-variant/40 bg-surface', badge: 'bg-surface-container text-on-surface-variant', icon: 'table_restaurant' },
  inactive: { title: 'Ngừng sử dụng', color: 'border-error/20 bg-error-container/10', badge: 'bg-error-container text-error', icon: 'block' },
  unknown: { title: 'Chưa xác định phiên', color: 'border-secondary/40 bg-secondary-fixed/20', badge: 'bg-secondary-fixed text-on-secondary-container', icon: 'help' },
};

export default function StaffTablesPage() {
  const { session, signOut } = useStaffAuth();
  const { rows, error, accessDenied, isLoading, reload } = useStaffTables(session);
  const orders = usePreviewOrders();
  const [filter, setFilter] = useState<StaffTableFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const opening = useRef(false);
  const visible = filterStaffTables(rows, filter, query);
  const selected = visible.find(row => row.table.id === selectedId) ?? visible[0] ?? null;
  const selectedOrders = selected?.session ? orders.filter(order => order.sessionId === selected.session?.id) : [];
  const paidOrders = selectedOrders.filter(order => order.paymentStatus === 'paid');

  const open = async () => {
    if (!session || !selected || tableState(selected) !== 'idle' || opening.current || isLoading) return;
    opening.current = true; setIsOpening(true); setNotice('');
    try {
      const opened = await openStaffTableSession(session.accessToken, selected.table.id);
      setNotice(`Đã mở phiên #${opened.id} cho ${selected.table.name}. Khách có thể dùng QR của bàn.`);
    } catch (cause) { setNotice(staffErrorMessage(cause) + ' Sơ đồ sẽ được tải lại để đối chiếu kết quả.'); }
    finally { opening.current = false; setIsOpening(false); reload(); }
  };

  return <div className="h-full min-w-0 overflow-y-auto bg-[#F6F2EE] p-4 sm:p-6"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-secondary">L'Atelier · Không gian phục vụ</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Sơ đồ bàn</h1><p className="mt-2 text-sm text-on-surface-variant">Tra cứu bàn, phiên đang mở và các đơn trong phiên.</p></div>
      {session && <button type="button" onClick={reload} disabled={isLoading || isOpening} className="min-h-11 rounded-xl border border-primary px-4 text-sm font-semibold text-primary disabled:opacity-40">{isLoading ? 'Đang tải…' : 'Tải lại sơ đồ'}</button>}
    </div>
    <>
      <p className="mt-5 rounded-xl border border-secondary/20 bg-secondary-fixed/20 p-3 text-xs leading-relaxed">Bàn và phiên lấy từ DB qua API Staff. Số món, tiền và tiến độ đơn bên dưới thuộc bản thử FE; chưa phải số liệu đơn thật của BE.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">{(['all', 'open', 'idle', 'inactive', 'unknown'] as StaffTableFilter[]).map(state => <button type="button" key={state} aria-pressed={filter === state} onClick={() => { setFilter(state); setSelectedId(null); }} className={`rounded-2xl border p-4 text-left ${filter === state ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40 bg-surface text-primary'}`}><strong className="block text-2xl">{state === 'all' ? rows.length : rows.filter(row => tableState(row) === state).length}</strong><span className="mt-1 block text-xs font-semibold">{state === 'all' ? 'Tất cả bàn' : states[state].title}</span></button>)}</div>
      <label className="mt-5 block sm:max-w-sm"><span className="sr-only">Tìm tên hoặc ID bàn</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên hoặc ID bàn…" className="min-h-12 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 text-base outline-none focus:border-primary sm:text-sm" /></label>
      {notice && <p role="status" className="mt-4 rounded-xl bg-surface-container p-4 text-sm">{notice}</p>}
      {error && <div role="alert" className="mt-5 rounded-xl bg-error-container/30 p-4 text-sm text-error"><p>{error}</p>{accessDenied ? <button type="button" onClick={signOut} className="mt-3 min-h-11 rounded-lg border border-primary px-4 font-semibold text-primary">Đăng nhập lại</button> : <button type="button" onClick={reload} disabled={isLoading} className="mt-3 min-h-11 rounded-lg border border-primary px-4 font-semibold text-primary disabled:opacity-40">Thử lại</button>}</div>}
      {isLoading ? <p role="status" className="mt-7 p-8 text-center text-sm text-on-surface-variant">Đang tải bàn và kiểm tra phiên phục vụ…</p> : !error && <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <section aria-label="Các bàn trong quán" className="min-w-0"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3">{visible.map(row => {
          const state = tableState(row); const style = states[state];
          const ready = row.session ? orders.filter(order => order.sessionId === row.session?.id && order.paymentStatus === 'paid' && order.preparationStatus === 'ready').length : 0;
          return <button type="button" key={row.table.id} disabled={isOpening} onClick={() => setSelectedId(row.table.id)} aria-pressed={selected?.table.id === row.table.id} className={`relative min-w-0 rounded-2xl border p-4 text-center shadow-sm transition-colors disabled:opacity-60 ${style.color} ${selected?.table.id === row.table.id ? 'ring-2 ring-primary' : ''}`}>
            <span aria-hidden="true" className="material-symbols-outlined text-4xl text-primary">{style.icon}</span><h2 className="mt-3 break-words text-base font-bold text-primary">{row.table.name}</h2><span className={`mt-3 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${style.badge}`}>{style.title}</span><p className="mt-2 text-xs text-on-surface-variant">{row.session ? `Phiên #${row.session.id}` : `ID bàn ${row.table.id}`}</p>{ready > 0 && <p className="mt-2 text-xs font-semibold text-secondary">{ready} đơn mẫu chờ phục vụ</p>}
          </button>;
        })}</div>{visible.length === 0 && <p className="rounded-2xl border border-dashed border-outline-variant bg-surface p-9 text-center text-sm text-on-surface-variant">{rows.length ? 'Không có bàn khớp bộ lọc.' : 'Chưa có bàn trong database. Có thể tạo bàn bằng API Staff hiện có.'}</p>}</section>
        {selected && <aside aria-label="Chi tiết bàn" className="min-w-0 rounded-2xl border border-outline-variant/40 bg-surface p-5 xl:sticky xl:top-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Chi tiết bàn</p><h2 className="mt-2 break-words text-2xl font-bold text-primary">{selected.table.name}</h2><p className="mt-2 text-sm text-on-surface-variant">{states[tableState(selected)].title}</p>
          {selected.sessionError && <p role="alert" className="mt-4 rounded-xl bg-error-container/30 p-3 text-sm text-error">{selected.sessionError} Chưa thể kết luận bàn không có phiên.</p>}
          {selected.session && <><p className="mt-4 text-sm">Phiên đang mở: <strong>#{selected.session.id}</strong></p><dl className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4 text-sm"><div className="flex justify-between gap-3"><dt>Đơn thử trong phiên</dt><dd className="font-semibold">{selectedOrders.length}</dd></div><div className="flex flex-wrap justify-between gap-3"><dt>Giá trị đã xác nhận (mẫu)</dt><dd className="font-semibold">{formatCurrency(paidOrders.reduce((sum, order) => sum + order.total, 0))}</dd></div></dl><Link to={`/staff/orders?session=${selected.session.id}`} className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary">Xem đơn trong phiên</Link><Link to={`/staff/history?session=${selected.session.id}`} className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-primary px-4 text-sm font-semibold text-primary">Lịch sử phiên hiện tại</Link></>}
          {tableState(selected) === 'idle' && <div className="mt-5"><p className="text-sm leading-relaxed text-on-surface-variant">Mở phiên phục vụ để khách tại bàn có thể nhận token QR và bắt đầu đặt món.</p><button type="button" disabled={isOpening || isLoading} onClick={() => void open()} className="mt-4 min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary disabled:opacity-40">{isOpening ? 'Đang mở phiên…' : 'Mở phiên phục vụ'}</button><p className="mt-2 text-xs text-on-surface-variant">Thao tác này mở phiên thật trong DB.</p></div>}
          {selected.table.isActive && <Link to={`/table/${encodeURIComponent(selected.table.qrCode)}`} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold text-primary"><span aria-hidden="true" className="material-symbols-outlined text-xl">qr_code_2</span>Mở trang QR của bàn</Link>}
          <p className="mt-4 text-xs leading-relaxed text-on-surface-variant">BE chưa có API đóng phiên. Đơn mẫu phục vụ xong không tự làm phiên thật của bàn đóng lại.</p>
        </aside>}
      </div>}
    </>
  </div></div>;
}

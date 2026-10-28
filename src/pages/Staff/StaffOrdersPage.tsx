import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePreviewOrders } from '../../hooks/usePreviewOrders';
import { belongsToStaffFilter, matchesStaffSearch, orderStatusLabel } from '../../utils/staffOrders';
import type { StaffOrderFilter } from '../../utils/staffOrders';
import { formatCurrency } from '../../utils/format';
import { seedStaffDemoOrders } from '../../services/staffDemo';
import StaffOrderDetails from '../../components/staff/StaffOrderDetails';

const filters: { key: StaffOrderFilter; title: string; icon: string }[] = [
  { key: 'payment', title: 'Chờ thanh toán', icon: 'payments' },
  { key: 'kitchen', title: 'Đang chuẩn bị', icon: 'local_cafe' },
  { key: 'ready', title: 'Chờ phục vụ', icon: 'room_service' },
  { key: 'history', title: 'Lịch sử', icon: 'history' },
];

export default function StaffOrdersPage({ kitchen = false }: { kitchen?: boolean }) {
  const allOrders = usePreviewOrders();
  const [params, setParams] = useSearchParams();
  const sessionValue = Number(params.get('session'));
  const sessionId = Number.isSafeInteger(sessionValue) && sessionValue > 0 ? sessionValue : null;
  const orders = sessionId === null ? allOrders : allOrders.filter(order => order.sessionId === sessionId);
  const [selectedFilter, setFilter] = useState<StaffOrderFilter>(kitchen ? 'kitchen' : 'payment');
  const filter = kitchen && !['kitchen', 'ready'].includes(selectedFilter) ? 'kitchen' : selectedFilter;
  const [query, setQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const visibleFilters = kitchen ? filters.filter(item => ['kitchen', 'ready'].includes(item.key)) : filters;
  const visible = orders.filter(order => belongsToStaffFilter(order, filter) && matchesStaffSearch(order, query));
  const selected = visible.find(order => order.code === selectedCode) ?? visible[0] ?? null;

  const seed = () => {
    try { const count = seedStaffDemoOrders(); setNotice(count ? `Đã thêm ${count} đơn mẫu để thử giao diện.` : 'Bộ 8 đơn mẫu đã có; giữ nguyên tiến trình đã thử.'); }
    catch { setNotice('Trình duyệt chưa cho phép lưu dữ liệu mẫu.'); }
  };

  return <div className="h-full min-w-0 overflow-y-auto bg-[#F6F2EE] p-4 sm:p-6">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">L'Atelier · Vận hành</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">{kitchen ? 'Quầy pha chế' : 'Quản lý đơn hàng'}</h1><p className="mt-2 text-sm text-on-surface-variant">{kitchen ? 'Chỉ hiển thị đơn đã được xác nhận nhận tiền.' : 'Đối chiếu thanh toán, nhận đơn và theo dõi tiến độ phục vụ.'}</p></div>
        <Link to={kitchen ? '/staff/orders' : '/staff/kds'} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-semibold text-primary"><span aria-hidden="true" className="material-symbols-outlined text-xl">{kitchen ? 'receipt_long' : 'local_cafe'}</span>{kitchen ? 'Về thu ngân' : 'Mở quầy pha chế'}</Link>
      </div>
      <p className="mt-5 rounded-xl border border-secondary/20 bg-secondary-fixed/30 p-3 text-xs leading-relaxed text-on-surface-variant">Bản thử UI · Đơn đồng bộ giữa các tab trên cùng trình duyệt và cùng địa chỉ web. Các xác nhận tại đây chưa ghi vào BE hoặc xử lý tiền thật.</p>
      {sessionId !== null && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container p-3 text-sm"><span>Đang xem đơn của phiên <strong>#{sessionId}</strong></span><button type="button" onClick={() => { const next = new URLSearchParams(params); next.delete('session'); setParams(next); }} className="min-h-11 font-semibold text-primary underline">Xem tất cả phiên</button></div>}
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">{visibleFilters.map(item => <button type="button" key={item.key} onClick={() => { setFilter(item.key); setSelectedCode(null); }} aria-pressed={filter === item.key} className={`min-w-0 rounded-2xl border p-4 text-left transition-colors ${filter === item.key ? 'border-primary bg-primary text-on-primary shadow-md' : 'border-outline-variant/40 bg-surface text-primary hover:border-primary/50'}`}>
        <span aria-hidden="true" className="material-symbols-outlined text-2xl">{item.icon}</span><strong className="mt-2 block text-3xl tabular-nums">{orders.filter(order => belongsToStaffFilter(order, item.key)).length}</strong><span className="mt-1 block text-xs font-semibold sm:text-sm">{item.title}</span>
      </button>)}</div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full sm:max-w-sm"><span className="sr-only">Tìm mã đơn, bàn hoặc món</span><span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-3 text-outline">search</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm mã đơn, bàn hoặc tên món…" className="min-h-12 w-full rounded-xl border border-outline-variant/40 bg-surface pl-11 pr-4 text-base outline-none focus:border-primary sm:text-sm" /></label>
        {import.meta.env.DEV && <button type="button" onClick={seed} className="min-h-11 rounded-xl border border-outline-variant px-4 text-sm font-semibold text-primary">Tạo 8 đơn mẫu thử UI</button>}
      </div>
      {notice && <p role="status" className="mt-3 rounded-xl bg-surface-container p-3 text-sm">{notice}</p>}
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <section aria-label="Danh sách đơn" className="min-w-0 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{visible.length} đơn · {visibleFilters.find(item => item.key === filter)?.title}</p>
          {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-outline-variant bg-surface p-9 text-center"><span aria-hidden="true" className="material-symbols-outlined text-5xl text-outline">receipt_long</span><h2 className="mt-3 font-semibold text-primary">Chưa có đơn trong mục này</h2><p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{query ? 'Thử tìm mã đơn hoặc tên bàn khác.' : kitchen ? 'Đơn sẽ xuất hiện sau khi thu ngân xác nhận đã nhận tiền.' : 'Mở trang khách ở tab khác để đặt món, hoặc tạo bộ đơn mẫu để thử giao diện.'}</p></div>
            : visible.map(order => <button type="button" key={order.code} onClick={() => setSelectedCode(order.code)} aria-pressed={selected?.code === order.code} className={`w-full min-w-0 rounded-2xl border bg-surface p-4 text-left shadow-sm transition-colors ${selected?.code === order.code ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/40 hover:border-primary/40'}`}>
              <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold text-secondary">{order.tableName}</p><h2 className="mt-1 break-words text-sm font-bold text-primary">{order.code}</h2></div><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'expired' ? 'bg-error-container text-error' : 'bg-secondary-fixed text-on-secondary-container'}`}>{orderStatusLabel(order)}</span></div>
              <p className="mt-3 truncate text-sm text-on-surface-variant">{order.items.map(item => `${item.quantity}× ${item.name}`).join(' · ')}</p>
              <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-outline-variant/20 pt-3"><span className="text-xs text-on-surface-variant">{new Date(order.createdAt).toLocaleTimeString('vi-VN')} · {order.method === 'transfer' ? 'Chuyển khoản' : 'Tại quầy'}</span><strong className="text-sm text-primary">{formatCurrency(order.total)}</strong></div>
            </button>)}
        </section>
        <div className="min-w-0 xl:sticky xl:top-0">{selected ? <StaffOrderDetails key={selected.code + ':' + selected.paymentStatus + ':' + selected.preparationStatus} order={selected} /> : <div className="hidden rounded-2xl border border-outline-variant/30 bg-surface p-8 text-center text-sm text-on-surface-variant xl:block">Chọn một đơn để xem món, ghi chú và thao tác phù hợp.</div>}</div>
      </div>
    </div>
  </div>;
}

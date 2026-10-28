import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePreviewOrders } from '../../hooks/usePreviewOrders';
import { filterOrderHistory, historyDateError } from '../../utils/orderHistory';
import type { HistoryFilters } from '../../utils/orderHistory';
import { orderStatusLabel } from '../../utils/staffOrders';
import { formatCurrency } from '../../utils/format';
import CheckoutSummary from '../../components/common/CheckoutSummary';

const PAGE_SIZE = 12;
const initial = { query: '', status: 'all', method: 'all', source: 'all', from: '', to: '' } as const;

export default function OrderHistoryPage() {
  const orders = usePreviewOrders();
  const [params, setParams] = useSearchParams();
  const sessionValue = Number(params.get('session'));
  const sessionId = Number.isSafeInteger(sessionValue) && sessionValue > 0 ? sessionValue : null;
  const [filters, setFilters] = useState<Omit<HistoryFilters, 'sessionId'>>(initial);
  const [page, setPage] = useState(1);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const dateError = historyDateError(filters.from, filters.to);
  const filtered = filterOrderHistory(orders, { ...filters, sessionId });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = visible.find(order => order.code === selectedCode) ?? visible[0] ?? null;
  const update = <K extends keyof typeof filters>(key: K, value: typeof filters[K]) => {
    setFilters(current => ({ ...current, [key]: value })); setPage(1); setSelectedCode(null);
  };
  const removeSession = () => { const next = new URLSearchParams(params); next.delete('session'); setParams(next); setPage(1); };

  return <div className="h-full min-w-0 overflow-y-auto bg-[#F6F2EE] p-4 sm:p-6"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-secondary">L'Atelier · Tra cứu</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Lịch sử đơn hàng</h1><p className="mt-2 text-sm text-on-surface-variant">Tra cứu mã đơn, thời điểm tạo, bàn và trạng thái phục vụ.</p></div><Link to="/staff/orders" className="inline-flex min-h-11 items-center rounded-xl border border-primary px-4 text-sm font-semibold text-primary">Về xử lý đơn</Link></div>
    <p className="mt-5 rounded-xl border border-secondary/20 bg-secondary-fixed/20 p-3 text-xs leading-relaxed">Bản thử UI · Danh sách lấy từ đơn FE đang lưu trong trình duyệt, gồm đơn khách thử và đơn mẫu. BE chưa có API danh sách lịch sử đơn; đây chưa phải lịch sử hoặc doanh thu thật trong DB.</p>
    {sessionId !== null && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container p-3 text-sm"><span>Đang lọc phiên phục vụ <strong>#{sessionId}</strong></span><button type="button" onClick={removeSession} className="min-h-11 font-semibold text-primary underline">Bỏ lọc phiên</button></div>}
    <div className="mt-5 grid grid-cols-3 gap-3">{[
      ['Đơn tìm thấy', filtered.length], ['Đã phục vụ', filtered.filter(order => order.preparationStatus === 'served').length], ['Hết hạn', filtered.filter(order => order.paymentStatus === 'expired').length],
    ].map(([label, count]) => <div key={label} className="rounded-2xl border border-outline-variant/40 bg-surface p-4"><strong className="block text-2xl text-primary">{count}</strong><span className="mt-1 block text-xs font-semibold text-on-surface-variant">{label}</span></div>)}</div>
    <section aria-label="Bộ lọc lịch sử đơn" className="mt-5 grid gap-3 rounded-2xl border border-outline-variant/40 bg-surface p-4 sm:grid-cols-2 xl:grid-cols-3">
      <label className="block text-xs font-semibold">Mã đơn, bàn hoặc tên món<input value={filters.query} onChange={event => update('query', event.target.value)} placeholder="Tìm kiếm có hoặc không dấu…" className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 text-base font-normal outline-none focus:border-primary sm:text-sm" /></label>
      <label className="block text-xs font-semibold">Trạng thái<select value={filters.status} onChange={event => update('status', event.target.value as HistoryFilters['status'])} className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm font-normal"><option value="all">Tất cả trạng thái</option><option value="unpaid">Chờ khách thanh toán</option><option value="verifying">Chờ xác nhận nhận tiền</option><option value="paid">Đã thanh toán</option><option value="served">Đã phục vụ</option><option value="failed">Chưa nhận được tiền</option><option value="expired">Hết hạn</option></select></label>
      <label className="block text-xs font-semibold">Phương thức<select value={filters.method} onChange={event => update('method', event.target.value as HistoryFilters['method'])} className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm font-normal"><option value="all">Tất cả phương thức</option><option value="transfer">Chuyển khoản</option><option value="counter">Tại quầy</option></select></label>
      <label className="block text-xs font-semibold">Ngày tạo từ<input type="date" value={filters.from} onChange={event => update('from', event.target.value)} className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 text-base font-normal sm:text-sm" /></label>
      <label className="block text-xs font-semibold">Đến hết ngày<input type="date" value={filters.to} onChange={event => update('to', event.target.value)} className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 text-base font-normal sm:text-sm" /></label>
      <label className="block text-xs font-semibold">Nguồn dữ liệu<select value={filters.source} onChange={event => update('source', event.target.value as HistoryFilters['source'])} className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm font-normal"><option value="all">Tất cả đơn thử</option><option value="customer">Khách QR thử nghiệm</option><option value="samples">Bộ đơn mẫu UI</option></select></label>
      <button type="button" onClick={() => { setFilters(initial); setPage(1); setSelectedCode(null); }} className="min-h-11 justify-self-start text-sm font-semibold text-primary underline">Xóa bộ lọc</button>
    </section>
    {dateError && <p role="alert" className="mt-4 rounded-xl bg-error-container/30 p-3 text-sm text-error">{dateError}</p>}
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
      <section aria-label="Danh sách lịch sử" className="min-w-0 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface">
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><caption className="sr-only">Đơn thử nghiệm, thời điểm tạo và trạng thái</caption><thead className="border-b border-outline-variant/30 bg-surface-container-low text-xs text-on-surface-variant"><tr><th className="p-4">Mã đơn / bàn</th><th className="p-4">Thời điểm tạo</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Tổng tiền</th></tr></thead><tbody>{visible.map(order => <tr key={order.code} className={`border-b border-outline-variant/20 ${selected?.code === order.code ? 'bg-primary/5' : ''}`}><td className="p-4"><button type="button" onClick={() => setSelectedCode(order.code)} aria-label={`Xem chi tiết ${order.code}`} className="min-h-11 text-left font-semibold text-primary underline decoration-primary/30"><span className="block">{order.code}</span><span className="mt-1 block text-xs font-normal text-on-surface-variant">{order.tableName}</span></button></td><td className="p-4"><span className="block text-xs">{new Date(order.createdAt).toLocaleString('vi-VN')}</span><span className="mt-1 block text-xs text-on-surface-variant">{order.method === 'counter' ? 'Tại quầy' : 'Chuyển khoản'}</span></td><td className="p-4"><span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'expired' ? 'bg-error-container text-error' : 'bg-secondary-fixed text-on-secondary-container'}`}>{orderStatusLabel(order)}</span></td><td className="p-4 text-right font-semibold text-primary">{formatCurrency(order.total)}</td></tr>)}</tbody></table></div>
        {visible.length === 0 && <p role="status" className="p-9 text-center text-sm text-on-surface-variant">{orders.length ? 'Không có đơn khớp các điều kiện đã chọn.' : 'Chưa có đơn được lưu. Tạo đơn từ trang khách hoặc dùng bộ đơn mẫu ở màn hình Đơn hàng.'}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-on-surface-variant"><span>{filtered.length} đơn · Trang {currentPage}/{pageCount}</span><div className="flex gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => { setPage(currentPage - 1); setSelectedCode(null); }} className="min-h-11 rounded-lg border border-outline-variant px-3 font-semibold text-primary disabled:opacity-40">Trang trước</button><button type="button" disabled={currentPage >= pageCount} onClick={() => { setPage(currentPage + 1); setSelectedCode(null); }} className="min-h-11 rounded-lg border border-outline-variant px-3 font-semibold text-primary disabled:opacity-40">Trang sau</button></div></div>
      </section>
      {selected && <aside aria-label="Chi tiết đơn lịch sử" className="min-w-0 xl:sticky xl:top-0"><p className="mb-3 text-sm font-semibold text-primary">{orderStatusLabel(selected)} · Phiên #{selected.sessionId}</p><CheckoutSummary order={selected} /><p className="mt-3 text-xs leading-relaxed text-on-surface-variant">Đây là bản ghi đã lưu trên FE. Xem chi tiết không đổi trạng thái đơn.</p></aside>}
    </div>
  </div></div>;
}

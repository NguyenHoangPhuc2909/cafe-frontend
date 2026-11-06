import { Drawer, Grid } from 'antd';
import SelectField from '../../components/ui/SelectField';
import Pagination from '../../components/ui/Pagination';
import Icon from '../../components/ui/Icon';
import { OrderListSkeleton, OrderDetailSkeleton } from "../../components/ui/Skeleton";
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import { useStaffOrders } from "../../hooks/useStaffOrders";
import type { OrderResponse } from "../../types/order";
import type { StaffOrderQuery } from "../../types/staffApi";
import StaffPaymentPanel from "../../components/staff/StaffPaymentPanel";
import { formatCurrency } from "../../utils/format";
import { formatDrinkOptions } from '../../utils/drinkOptions';
import CheckoutSummary from "../../components/common/CheckoutSummary";
import CompleteOrderButton from "../../components/staff/CompleteOrderButton";

type Filter = "all" | "unpaid" | "paid" | "expired";
type ViewMode = "orders" | "kitchen" | "history";

function paymentLabel(order: OrderResponse) {
  if (order.status === "EXPIRED") return "Hết hạn";
  if (order.paymentStatus === "PAID") return "Đã thanh toán";
  if (order.paymentStatus === "REFUNDED") return "Đã hoàn tiền";
  return "Chưa thanh toán";
}

function orderStatusLabel(order: OrderResponse) {
  switch (order.status) {
    case "PENDING":
      return "Chờ thanh toán";
    case "PREPARING":
      return "Đang làm";
    case "COMPLETED":
      return "Đã hoàn thành";
    case "EXPIRED":
      return "Hết hạn";
  }
}

export default function StaffOrdersPage({
  mode = "orders",
}: {
  mode?: ViewMode;
}) {
  const screens = Grid.useBreakpoint();
  const desktop = !!screens.lg;
  const [detailOpen, setDetailOpen] = useState(false);
  const kitchen = mode === "kitchen";
  const history = mode === "history";
  const { session } = useStaffAuth();
  const [params, setParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;

  const rawSession = Number(params.get("session"));
  const sessionId =
    Number.isSafeInteger(rawSession) && rawSession > 0 ? rawSession : undefined;

  const rawFilter = params.get("filter");
  const filter: Filter = kitchen
    ? "paid"
    : rawFilter === "all" ||
        rawFilter === "paid" ||
        rawFilter === "expired" ||
        rawFilter === "unpaid"
      ? rawFilter
      : history
        ? "all"
        : "unpaid";

  const query: StaffOrderQuery = { page, size: 20, sessionId };

  if (filter === "unpaid") {
    query.status = "PENDING";
    query.paymentStatus = "UNPAID";
  } else if (filter === "paid") {
    query.paymentStatus = "PAID";
  } else if (filter === "expired") {
    query.status = "EXPIRED";
  }

  if (kitchen) {
    query.status = "PREPARING";
    query.paymentStatus = "PAID";
  }

  const { data, pagination, isLoading, error, reload } = useStaffOrders(session, query);
  const paymentChanged = (message: string, success: boolean) => {
    setNotice({ message, success });
    reload();
  };

  const orders = data?.content ?? [];
  const selected =
    orders.find((order) => order.id === selectedId) ?? orders[0] ?? null;

  const changeFilter = (value: string) => {
    const next = new URLSearchParams(params);
    next.set("filter", value);
    next.delete("page");
    setSelectedId(null);
    setParams(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const changePage = (value: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(value));
    setSelectedId(null);
    setParams(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const clearSession = () => {
    const next = new URLSearchParams(params);
    next.delete("session");
    next.delete("page");
    setSelectedId(null);
    setParams(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const title = history ? 'Lịch sử đơn hàng' : kitchen ? 'Đơn đang làm' : 'Quản lý đơn hàng';
  const description = history ? 'Tra cứu và xem lại các đơn đã nhận.' : kitchen ? 'Theo dõi các đơn đã thanh toán và đang được chuẩn bị.' : 'Theo dõi đơn tại bàn và xác nhận thanh toán.';
  const emptyDescription = kitchen ? 'Đơn đã thanh toán sẽ xuất hiện ở đây khi được chuyển đến quầy pha chế.' : history ? 'Các đơn hàng của quán sẽ được lưu và hiển thị tại đây.' : 'Đơn khách gửi từ thực đơn tại bàn sẽ xuất hiện tại đây.';
  const loadingFirstPage = isLoading && !data;

  return <div className="staff-orders-page">
    <div ref={scrollRef} className="staff-page-scroll">
      <div className="staff-page-content">
        <header className="staff-page-heading">
          <div><h1>{title}</h1><p>{description}</p></div>
          <Link to={mode === 'orders' ? '/staff/kds' : '/staff/orders'} className="staff-text-link">
            <Icon name={mode === 'orders' ? 'coffee' : 'arrow_back'} />
            {mode === 'orders' ? 'Xem pha chế' : 'Về quản lý đơn'}
          </Link>
        </header>

        <div className="staff-list-toolbar">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {!kitchen && <SelectField label="Lọc trạng thái đơn" value={filter} onChange={changeFilter} prefix={<Icon name="filter" />} className="w-48 max-w-full"
              options={[{ value: 'unpaid', label: 'Chờ thanh toán' }, { value: 'paid', label: 'Đã thanh toán' }, { value: 'expired', label: 'Hết hạn' }, { value: 'all', label: 'Tất cả trạng thái' }]} />}
            {sessionId !== undefined && <button type="button" onClick={clearSession} className="ui-button" aria-label={`Bỏ lọc phiên ${sessionId}`}>Phiên #{sessionId}<Icon name="close" /></button>}
          </div>
          <p className="staff-result-count" role="status">{pagination ? `${pagination.totalElements} đơn hàng` : loadingFirstPage ? 'Đang tải đơn hàng…' : ''}</p>
        </div>

        {notice && <p role={notice.success ? 'status' : 'alert'} className={`staff-notice ${notice.success ? 'staff-notice--success' : ''}`}>{notice.message}</p>}
        {error && <p role="alert" className="staff-notice staff-notice--error">{error}</p>}

        {!loadingFirstPage && !error && orders.length === 0 ? <section className="staff-empty-state" aria-label="Chưa có đơn hàng">
          <span className="staff-empty-state__icon"><Icon name={kitchen ? 'coffee' : 'receipt_long'} /></span>
          <h2>{kitchen ? 'Quầy pha chế đang trống' : 'Chưa có đơn trong mục này'}</h2><p>{emptyDescription}</p>
        </section> : (loadingFirstPage || orders.length > 0) && <div className="staff-order-grid">
          <section aria-label="Danh sách đơn" className="order-collection">
            {loadingFirstPage ? <OrderListSkeleton /> : <>
              <div className="order-collection__heading"><h2>Danh sách đơn</h2><span>{orders.length} đơn trên trang</span></div>
              <div>{orders.map(order => <button type="button" key={order.id} onClick={() => { setSelectedId(order.id); if (!desktop) setDetailOpen(true); }} aria-pressed={selected?.id === order.id} className="order-row">
                <div className="order-row__main"><strong>#{order.id}</strong><span className="order-row__table"><Icon name="table_restaurant" />{order.tableName ?? 'Tại quầy'}</span></div>
                <span className={`order-status order-status--${order.status.toLowerCase()}`}>{orderStatusLabel(order)}</span>
                <p className="order-row__items">{order.items.map(item => `${item.quantity} × ${item.productName}${item.size ? ` (${item.size})` : ''}${formatDrinkOptions(item) ? ` — ${formatDrinkOptions(item)}` : ''}`).join(' · ') || 'Chưa có món'}</p>
                <strong className="order-row__amount">{formatCurrency(order.totalAmount)}</strong>
                <span className="order-row__payment">{paymentLabel(order)}</span>
                <span className="order-row__arrow"><Icon name="chevron_right" /></span>
              </button>)}</div>
            </>}
          </section>
          {desktop && <aside aria-label="Chi tiết đơn" className="order-detail"><div className="order-detail__content">
            {loadingFirstPage ? <OrderDetailSkeleton /> : selected && (mode === 'orders' ? <StaffPaymentPanel embedded key={selected.id} order={selected} onChanged={paymentChanged} /> : <CheckoutSummary embedded order={selected} />)}
            {kitchen && selected && <CompleteOrderButton embedded key={selected.id} order={selected} onChanged={paymentChanged} />}
          </div></aside>}
        </div>}
      </div>
    </div>
    {!desktop && <Drawer title={selected ? `Chi tiết đơn #${selected.id}` : 'Chi tiết đơn'} placement="bottom" size="auto" open={detailOpen && !!selected} onClose={() => setDetailOpen(false)} styles={{ wrapper: { maxHeight: '85dvh' }, section: { maxHeight: '85dvh', minHeight: 240 }, body: { padding: 0 } }}>
      <div className="order-detail__content mobile-order-detail">{selected && (mode === 'orders' ? <StaffPaymentPanel embedded key={selected.id} order={selected} onChanged={paymentChanged} /> : <CheckoutSummary embedded order={selected} />)}
        {kitchen && selected && <CompleteOrderButton embedded key={selected.id} order={selected} onChanged={paymentChanged} />}
      </div>
    </Drawer>}
    <footer className="staff-page-footer"><div className="staff-page-content staff-page-footer__inner">
      <span className="hidden text-xs text-on-surface-variant sm:block">Trang {page + 1} / {Math.max(1, pagination?.totalPages ?? page + 1)}</span>
      <Pagination page={page} totalPages={pagination?.totalPages ?? page + 1} disabled={isLoading || !data} onPageChange={changePage} />
    </div></footer>
  </div>;
}

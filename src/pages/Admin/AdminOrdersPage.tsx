import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, Drawer, Grid, Space, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import Icon from '../../components/ui/Icon';
import Pagination from '../../components/ui/Pagination';
import { OrderDetailSkeleton, OrderListSkeleton } from '../../components/ui/Skeleton';
import CheckoutSummary from '../../components/common/CheckoutSummary';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { getAdminCompletedOrders } from '../../services/adminOrders';
import { staffErrorMessage } from '../../services/staffApi';
import type { PageResponse } from '../../types/api';
import type { OrderResponse } from '../../types/order';
import { formatCurrency } from '../../utils/format';
import { formatDrinkOptions } from '../../utils/drinkOptions';
import {
  formatOrderCreatedAt,
  getVietnamToday,
  isIsoDate,
  shiftIsoDate,
} from '../../utils/adminOrderDates';

const PAGE_SIZE = 20;

interface LoadResult {
  token: string;
  key: string;
  version: number;
  data?: PageResponse<OrderResponse>;
  error?: string;
}

export default function AdminOrdersPage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const screens = Grid.useBreakpoint();
  const desktop = !!screens.lg;
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<LoadResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = getVietnamToday();

  const rawPage = Number(params.get('page') ?? 0);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;

  const rawSession = Number(params.get('session'));
  const sessionId =
    Number.isSafeInteger(rawSession) && rawSession > 0 ? rawSession : undefined;

  const isAllRange = params.get('range') === 'all';
  const paramFrom = params.get('fromDate');
  const paramTo = params.get('toDate');
  const hasExplicitDates = isIsoDate(paramFrom) || isIsoDate(paramTo);

  const fromDate = hasExplicitDates
    ? isIsoDate(paramFrom)
      ? paramFrom
      : undefined
    : isAllRange || sessionId !== undefined
      ? undefined
      : today;

  const toDate = hasExplicitDates
    ? isIsoDate(paramTo)
      ? paramTo
      : undefined
    : isAllRange || sessionId !== undefined
      ? undefined
      : today;

  const invalidUrlRange = Boolean(fromDate && toDate && fromDate > toDate);
  const queryKey = JSON.stringify([fromDate ?? null, toDate ?? null, sessionId ?? null, page]);

  useEffect(() => {
    if (!token || invalidUrlRange) return;
    const controller = new AbortController();

    getAdminCompletedOrders(
      token,
      { fromDate, toDate, sessionId, page, size: PAGE_SIZE },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ token, key: queryKey, version, data });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({ token, key: queryKey, version, error: staffErrorMessage(cause) });
        }
      });

    return () => controller.abort();
  }, [token, fromDate, toDate, sessionId, page, queryKey, version, invalidUrlRange]);

  const current =
    result && result.token === token && result.key === queryKey && result.version === version
      ? result
      : null;

  const data = current?.data ?? null;
  const error = invalidUrlRange
    ? 'Ngày bắt đầu không được lớn hơn ngày kết thúc.'
    : (current?.error ?? null);
  const loadingFirstPage = Boolean(token) && !invalidUrlRange && !current;
  const orders = data?.content ?? [];
  const selected = orders.find((order) => order.id === selectedId) ?? orders[0] ?? null;

  const applyRange = (nextFrom?: string, nextTo?: string, all = false) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    if (all) {
      next.set('range', 'all');
      next.delete('fromDate');
      next.delete('toDate');
    } else {
      next.delete('range');
      if (nextFrom) next.set('fromDate', nextFrom);
      else next.delete('fromDate');
      if (nextTo) next.set('toDate', nextTo);
      else next.delete('toDate');
    }
    setFormError(null);
    setSelectedId(null);
    setParams(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextFrom = String(form.get('fromDate') || '');
    const nextTo = String(form.get('toDate') || '');

    if (nextFrom && nextTo && nextFrom > nextTo) {
      setFormError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    if (!nextFrom && !nextTo) {
      applyRange(undefined, undefined, true);
      return;
    }

    applyRange(nextFrom || undefined, nextTo || undefined, false);
  };

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setSelectedId(null);
    setParams(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const clearSession = () => {
    const next = new URLSearchParams(params);
    next.delete('session');
    next.delete('page');
    setSelectedId(null);
    setParams(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const reload = () => setVersion((v) => v + 1);
  const formKey = `${fromDate ?? ''}:${toDate ?? ''}:${isAllRange ? 'all' : 'date'}`;
  const isTodayActive = !isAllRange && fromDate === today && toDate === today;
  const sevenDaysStart = shiftIsoDate(today, -6);
  const isSevenDaysActive = !isAllRange && fromDate === sevenDaysStart && toDate === today;
  const thirtyDaysStart = shiftIsoDate(today, -29);
  const isThirtyDaysActive = !isAllRange && fromDate === thirtyDaysStart && toDate === today;

  const detailContent = selected ? (
    <div>
      <p className="mb-3 text-xs text-on-surface-variant">
        Tạo lúc: <strong>{formatOrderCreatedAt(selected.createdAt)}</strong> · Trạng thái:{' '}
        <Tag color="success" className="mr-0">
          Đã hoàn thành
        </Tag>
      </p>
      <CheckoutSummary embedded order={selected} />
    </div>
  ) : null;

  return (
    <div className="staff-orders-page">
      <div ref={scrollRef} className="staff-page-scroll">
        <div className="staff-page-content">
          <header className="staff-page-heading">
            <div>
              <h1>Lịch sử đơn hàng</h1>
            </div>
            <Space wrap>
              <Button icon={<ReloadOutlined />} disabled={loadingFirstPage} onClick={reload}>
                Làm mới
              </Button>
            </Space>
          </header>

          <form
            key={formKey}
            onSubmit={handleFilterSubmit}
            className="mb-4 space-y-3 rounded-2xl border border-outline-variant/40 bg-surface p-4"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Từ ngày
                <input
                  type="date"
                  name="fromDate"
                  defaultValue={fromDate ?? ''}
                  className="min-h-control rounded-lg border border-control-border bg-white px-3"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Đến ngày
                <input
                  type="date"
                  name="toDate"
                  defaultValue={toDate ?? ''}
                  className="min-h-control rounded-lg border border-control-border bg-white px-3"
                />
              </label>

              <Button type="primary" htmlType="submit">
                Lọc
              </Button>

              <Space wrap size="small">
                <Button
                  type={isTodayActive ? 'primary' : 'default'}
                  ghost={isTodayActive}
                  onClick={() => applyRange(today, today, false)}
                >
                  Hôm nay
                </Button>
                <Button
                  type={isSevenDaysActive ? 'primary' : 'default'}
                  ghost={isSevenDaysActive}
                  onClick={() => applyRange(sevenDaysStart, today, false)}
                >
                  7 ngày qua
                </Button>
                <Button
                  type={isThirtyDaysActive ? 'primary' : 'default'}
                  ghost={isThirtyDaysActive}
                  onClick={() => applyRange(thirtyDaysStart, today, false)}
                >
                  30 ngày qua
                </Button>
                <Button
                  type={isAllRange ? 'primary' : 'default'}
                  ghost={isAllRange}
                  onClick={() => applyRange(undefined, undefined, true)}
                >
                  Tất cả ngày
                </Button>
              </Space>

              {sessionId !== undefined && (
                <button
                  type="button"
                  onClick={clearSession}
                  className="ui-button"
                  aria-label={`Bỏ lọc phiên ${sessionId}`}
                >
                  Phiên #{sessionId}
                  <Icon name="close" />
                </button>
              )}
            </div>

            {formError && <Alert type="error" showIcon title={formError} />}
          </form>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-on-surface-variant">
            <span>
              {fromDate || toDate
                ? `${fromDate ?? '…'} → ${toDate ?? '…'}`
                : 'Tất cả ngày'}
            </span>
            <p className="staff-result-count" role="status">
              {data ? `${data.totalElements} đơn hoàn thành` : loadingFirstPage ? 'Đang tải…' : ''}
            </p>
          </div>

          {error && (
            <Alert
              className="mb-4"
              type="error"
              showIcon
              title={error}
              action={!invalidUrlRange ? <Button onClick={reload}>Thử lại</Button> : undefined}
            />
          )}

          {!loadingFirstPage && !error && orders.length === 0 ? (
            <section className="staff-empty-state" aria-label="Không có đơn hoàn thành">
              <span className="staff-empty-state__icon">
                <Icon name="receipt_long" />
              </span>
              <h2>Không có đơn trong khoảng thời gian này</h2>
            </section>
          ) : (
            (loadingFirstPage || orders.length > 0) && (
              <div className="staff-order-grid">
                <section aria-label="Danh sách đơn hoàn thành" className="order-collection">
                  {loadingFirstPage ? (
                    <OrderListSkeleton />
                  ) : (
                    <>
                      <div className="order-collection__heading">
                        <h2>Danh sách đơn hoàn thành</h2>
                        <span>{orders.length} đơn trên trang</span>
                      </div>
                      <div>
                        {orders.map((order) => (
                          <button
                            type="button"
                            key={order.id}
                            onClick={() => {
                              setSelectedId(order.id);
                              if (!desktop) setDetailOpen(true);
                            }}
                            aria-pressed={selected?.id === order.id}
                            className="order-row"
                          >
                            <div className="order-row__main">
                              <strong>#{order.id}</strong>
                              <span className="order-row__table">
                                <Icon name={order.tableName ? 'table_restaurant' : 'receipt_long'} />
                                {order.tableName ?? 'Tại quầy'}
                                {order.orderType &&
                                  ` · ${order.orderType === 'TAKEAWAY' ? 'Mang đi' : 'Tại quán'}`}
                              </span>
                            </div>
                            <span className="order-status order-status--completed">Đã hoàn thành</span>
                            <p className="order-row__items">
                              {order.items
                                .map(
                                  (item) =>
                                    `${item.quantity} × ${item.productName}${item.size ? ` (${item.size})` : ''}${formatDrinkOptions(item) ? ` — ${formatDrinkOptions(item)}` : ''}`,
                                )
                                .join(' · ') || 'Chưa có món'}
                            </p>
                            <strong className="order-row__amount">
                              {formatCurrency(order.totalAmount)}
                            </strong>
                            <span className="order-row__payment">
                              {formatOrderCreatedAt(order.createdAt)}
                            </span>
                            <span className="order-row__arrow">
                              <Icon name="chevron_right" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                {desktop && (
                  <aside aria-label="Chi tiết đơn" className="order-detail">
                    <div className="order-detail__content">
                      {loadingFirstPage ? <OrderDetailSkeleton /> : detailContent}
                    </div>
                  </aside>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {!desktop && (
        <Drawer
          title={selected ? `Chi tiết đơn #${selected.id}` : 'Chi tiết đơn'}
          placement="bottom"
          size="auto"
          open={detailOpen && !!selected}
          onClose={() => setDetailOpen(false)}
          styles={{
            wrapper: { maxHeight: '85dvh' },
            section: { maxHeight: '85dvh', minHeight: 240 },
            body: { padding: 0 },
          }}
        >
          <div className="order-detail__content mobile-order-detail">{detailContent}</div>
        </Drawer>
      )}

      <footer className="staff-page-footer">
        <div className="staff-page-content staff-page-footer__inner">
          <span className="hidden text-xs text-on-surface-variant sm:block">
            Trang {page + 1} / {Math.max(1, data?.totalPages ?? page + 1)}
          </span>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? page + 1}
            disabled={loadingFirstPage || !data}
            onPageChange={changePage}
          />
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, Segmented, Space, Switch, Table } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { getAdminRevenueReport } from '../../services/adminReports';
import { staffErrorMessage } from '../../services/staffApi';
import type { AdminRevenueReport, TopProductItem } from '../../types/adminReport';
import { formatCurrency } from '../../utils/format';
import {
  getVietnamToday,
  isIsoDate,
  shiftIsoDate,
} from '../../utils/adminOrderDates';
import {
  defaultGranularity,
  formatShortDate,
  groupDailyRevenue,
  type GroupedRevenuePoint,
  type RevenueGranularity,
} from '../../utils/adminReportGrouping';

interface LoadResult {
  token: string;
  key: string;
  version: number;
  data?: AdminRevenueReport;
  error?: string;
}

function formatAxisCurrency(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}tr`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return String(Math.round(value));
}

function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: GroupedRevenuePoint }>;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-outline-variant/60 bg-white p-3 text-xs shadow-md">
      <p className="mb-1.5 font-semibold text-primary">{point.fullLabel}</p>
      <div className="space-y-1 text-on-surface">
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant">Tổng doanh thu:</span>
          <strong>{formatCurrency(point.revenue)}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant">Tiền mặt:</span>
          <span>{formatCurrency(point.cashRevenue)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant">Chuyển khoản:</span>
          <span>{formatCurrency(point.bankTransferRevenue)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant">Đơn hoàn thành:</span>
          <span>{point.paymentCount}</span>
        </div>
      </div>
    </div>
  );
}

function TopProductTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: TopProductItem }>;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-outline-variant/60 bg-white p-3 text-xs shadow-md">
      <p className="mb-1.5 font-semibold text-primary">{item.productName}</p>
      <div className="space-y-1 text-on-surface">
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant">Số lượng bán:</span>
          <strong>{item.quantitySold.toLocaleString('vi-VN')}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant">Doanh thu:</span>
          <strong>{formatCurrency(item.revenue)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const [params, setParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [granularityChoice, setGranularityChoice] = useState<{
    key: string;
    value: RevenueGranularity;
  } | null>(null);
  const [hideZero, setHideZero] = useState(false);

  const today = getVietnamToday();
  const paramFrom = params.get('fromDate');
  const paramTo = params.get('toDate');
  const fromDate = isIsoDate(paramFrom) ? paramFrom : today;
  const toDate = isIsoDate(paramTo) ? paramTo : today;

  const invalidRange = fromDate > toDate;
  const queryKey = `${fromDate}:${toDate}`;

  useEffect(() => {
    if (!token || invalidRange) return;
    const controller = new AbortController();

    getAdminRevenueReport(token, { fromDate, toDate, topLimit: 10 }, controller.signal)
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
  }, [token, fromDate, toDate, queryKey, version, invalidRange]);

  const current =
    result && result.token === token && result.key === queryKey && result.version === version
      ? result
      : null;

  const report = current?.data ?? null;
  const error = invalidRange
    ? 'Ngày bắt đầu không được lớn hơn ngày kết thúc.'
    : (current?.error ?? null);
  const loading = Boolean(token) && !invalidRange && !current;

  const applyRange = (nextFrom: string, nextTo: string) => {
    const next = new URLSearchParams(params);
    next.set('fromDate', nextFrom);
    next.set('toDate', nextTo);
    setFormError(null);
    setParams(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextFrom = String(form.get('fromDate') || '');
    const nextTo = String(form.get('toDate') || '');

    if (!isIsoDate(nextFrom) || !isIsoDate(nextTo)) {
      setFormError('Vui lòng chọn đầy đủ từ ngày và đến ngày hợp lệ.');
      return;
    }
    if (nextFrom > nextTo) {
      setFormError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    applyRange(nextFrom, nextTo);
  };

  const reload = () => setVersion((v) => v + 1);
  const sevenDaysStart = shiftIsoDate(today, -6);
  const thirtyDaysStart = shiftIsoDate(today, -29);
  const monthStart = `${today.slice(0, 7)}-01`;

  const cashSummary = report?.methods.find((m) => m.method === 'CASH');
  const bankSummary = report?.methods.find((m) => m.method === 'BANK_TRANSFER');
  const topChartData = report?.topProducts.slice(0, 8) ?? [];

  const activeGranularity: RevenueGranularity =
    granularityChoice && granularityChoice.key === queryKey
      ? granularityChoice.value
      : defaultGranularity(report?.daily.length ?? 1);

  const groupedSeries = report
    ? groupDailyRevenue(report.daily, activeGranularity, hideZero)
    : [];

  const periodHeading =
    activeGranularity === 'week'
      ? 'Doanh thu theo tuần'
      : activeGranularity === 'month'
        ? 'Doanh thu theo tháng'
        : 'Doanh thu theo ngày';

  const periodColTitle =
    activeGranularity === 'week' ? 'Tuần' : activeGranularity === 'month' ? 'Tháng' : 'Ngày';

  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <div>
          <h1>Báo cáo doanh thu</h1>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} disabled={loading} onClick={reload}>
            Làm mới
          </Button>
        </Space>
      </header>

      <form
        key={queryKey}
        onSubmit={handleSubmit}
        className="mb-5 space-y-3 rounded-2xl border border-outline-variant/40 bg-surface p-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Từ ngày
            <input
              type="date"
              name="fromDate"
              defaultValue={fromDate}
              className="min-h-control rounded-lg border border-control-border bg-white px-3"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Đến ngày
            <input
              type="date"
              name="toDate"
              defaultValue={toDate}
              className="min-h-control rounded-lg border border-control-border bg-white px-3"
            />
          </label>

          <Button type="primary" htmlType="submit">
            Xem báo cáo
          </Button>

          <Space wrap size="small">
            <Button
              type={fromDate === today && toDate === today ? 'primary' : 'default'}
              ghost={fromDate === today && toDate === today}
              onClick={() => applyRange(today, today)}
            >
              Hôm nay
            </Button>
            <Button
              type={fromDate === sevenDaysStart && toDate === today ? 'primary' : 'default'}
              ghost={fromDate === sevenDaysStart && toDate === today}
              onClick={() => applyRange(sevenDaysStart, today)}
            >
              7 ngày qua
            </Button>
            <Button
              type={fromDate === thirtyDaysStart && toDate === today ? 'primary' : 'default'}
              ghost={fromDate === thirtyDaysStart && toDate === today}
              onClick={() => applyRange(thirtyDaysStart, today)}
            >
              30 ngày qua
            </Button>
            <Button
              type={fromDate === monthStart && toDate === today ? 'primary' : 'default'}
              ghost={fromDate === monthStart && toDate === today}
              onClick={() => applyRange(monthStart, today)}
            >
              Tháng này
            </Button>
          </Space>
        </div>

        {formError && <Alert type="error" showIcon title={formError} />}
      </form>

      {error && (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          title={error}
          action={!invalidRange ? <Button onClick={reload}>Thử lại</Button> : undefined}
        />
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Tổng doanh thu
          </span>
          <strong className="mt-2 block text-2xl font-bold text-primary">
            {loading ? '…' : formatCurrency(report?.totalRevenue ?? 0)}
          </strong>
          <span className="mt-1 block text-xs text-on-surface-variant">
            {fromDate === toDate
              ? `Ngày ${formatShortDate(fromDate)}`
              : `${formatShortDate(fromDate)} → ${formatShortDate(toDate)}`}
          </span>
        </article>

        <article className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Tiền mặt
          </span>
          <strong className="mt-2 block text-2xl font-bold text-primary">
            {loading ? '…' : formatCurrency(cashSummary?.amount ?? 0)}
          </strong>
          <span className="mt-1 block text-xs text-on-surface-variant">
            {cashSummary?.paymentCount ?? 0} đơn hoàn thành
          </span>
        </article>

        <article className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Chuyển khoản
          </span>
          <strong className="mt-2 block text-2xl font-bold text-primary">
            {loading ? '…' : formatCurrency(bankSummary?.amount ?? 0)}
          </strong>
          <span className="mt-1 block text-xs text-on-surface-variant">
            {bankSummary?.paymentCount ?? 0} đơn hoàn thành
          </span>
        </article>

        <article className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Đơn hoàn thành
          </span>
          <strong className="mt-2 block text-2xl font-bold text-primary">
            {loading ? '…' : (report?.paymentCount ?? 0).toLocaleString('vi-VN')}
          </strong>
          <span className="mt-1 block text-xs text-on-surface-variant">
            TB: {formatCurrency(report?.averageOrderValue ?? 0)} / đơn
          </span>
        </article>
      </div>

      <div className="mb-5 rounded-2xl border border-outline-variant/40 bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-primary">{periodHeading}</h2>
            {report && (
              <span className="text-xs text-on-surface-variant">
                Cập nhật lúc{' '}
                {new Date(report.generatedAt).toLocaleTimeString('vi-VN', {
                  timeZone: 'Asia/Ho_Chi_Minh',
                })}
              </span>
            )}
          </div>
          <Space wrap size="middle">
            <Segmented<RevenueGranularity>
              size="small"
              value={activeGranularity}
              onChange={(value) => setGranularityChoice({ key: queryKey, value })}
              options={[
                { value: 'day', label: 'Ngày' },
                { value: 'week', label: 'Tuần' },
                { value: 'month', label: 'Tháng' },
              ]}
            />
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-on-surface-variant">
              <Switch size="small" checked={hideZero} onChange={setHideZero} />
              <span>Ẩn mục 0 đ</span>
            </label>
          </Space>
        </div>

        {!loading && report && (report.paymentCount === 0 || groupedSeries.length === 0) ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">
            Chưa có đơn hoàn thành trong khoảng ngày đã chọn.
          </p>
        ) : (
          report && (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groupedSeries}
                  margin={{ top: 10, right: 16, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7ddd3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#7c685c' }}
                    axisLine={{ stroke: '#d8c8b8' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatAxisCurrency}
                    tick={{ fontSize: 12, fill: '#7c685c' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <RechartsTooltip
                    content={<RevenueTooltip />}
                    cursor={{ fill: 'rgba(200, 138, 75, 0.12)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="cashRevenue"
                    name="Tiền mặt"
                    stackId="revenue"
                    fill="#5c3d2e"
                    maxBarSize={42}
                  />
                  <Bar
                    dataKey="bankTransferRevenue"
                    name="Chuyển khoản"
                    stackId="revenue"
                    fill="#c88a4b"
                    maxBarSize={42}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        )}

        <div className="mt-4">
          <Table<GroupedRevenuePoint>
            rowKey="key"
            size="small"
            loading={loading}
            dataSource={[...groupedSeries].reverse()}
            scroll={{ x: 640 }}
            pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
            locale={{ emptyText: 'Chưa có dữ liệu doanh thu.' }}
            columns={[
              {
                title: periodColTitle,
                dataIndex: 'fullLabel',
              },
              {
                title: 'Số đơn',
                dataIndex: 'paymentCount',
                align: 'right',
                render: (v: number) => v.toLocaleString('vi-VN'),
              },
              {
                title: 'Tiền mặt',
                dataIndex: 'cashRevenue',
                align: 'right',
                render: (v: number) => formatCurrency(v),
              },
              {
                title: 'Chuyển khoản',
                dataIndex: 'bankTransferRevenue',
                align: 'right',
                render: (v: number) => formatCurrency(v),
              },
              {
                title: 'Tổng doanh thu',
                dataIndex: 'revenue',
                align: 'right',
                render: (v: number) => <strong>{formatCurrency(v)}</strong>,
              },
            ]}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
        <h2 className="mb-4 text-base font-bold text-primary">Top món bán chạy</h2>

        {topChartData.length > 0 && (
          <div
            className="mb-5 w-full"
            style={{ height: Math.max(180, topChartData.length * 40 + 36) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topChartData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 12, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ddd3" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#7c685c' }}
                  axisLine={{ stroke: '#d8c8b8' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  width={150}
                  tick={{ fontSize: 12, fill: '#3f281d' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  content={<TopProductTooltip />}
                  cursor={{ fill: 'rgba(200, 138, 75, 0.12)' }}
                />
                <Bar
                  dataKey="quantitySold"
                  name="Số lượng bán"
                  fill="#c88a4b"
                  barSize={22}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <Table<TopProductItem>
          rowKey="productId"
          size="small"
          loading={loading}
          dataSource={report?.topProducts ?? []}
          scroll={{ x: 560 }}
          pagination={false}
          locale={{ emptyText: 'Chưa có món bán ra trong khoảng ngày này.' }}
          columns={[
            {
              title: '#',
              key: 'rank',
              width: 56,
              render: (_, __, index) => index + 1,
            },
            {
              title: 'Tên món',
              dataIndex: 'productName',
              render: (name: string) => <span className="font-medium">{name}</span>,
            },
            {
              title: 'Số lượng bán',
              dataIndex: 'quantitySold',
              align: 'right',
              render: (v: number) => v.toLocaleString('vi-VN'),
            },
            {
              title: 'Doanh thu',
              dataIndex: 'revenue',
              align: 'right',
              render: (v: number) => <strong>{formatCurrency(v)}</strong>,
            },
          ]}
        />
      </div>
    </section>
  );
}

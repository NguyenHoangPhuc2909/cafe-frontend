import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Space, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Icon from '../../components/ui/Icon';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { getAdminDashboardSummary } from '../../services/adminDashboard';
import { staffErrorMessage } from '../../services/staffApi';
import type {
  AdminDashboardSummary,
  DashboardTrendPoint,
} from '../../types/adminDashboard';
import { formatCurrency } from '../../utils/format';
import { formatFullDate, formatShortDate } from '../../utils/adminReportGrouping';

interface LoadResult {
  token: string;
  version: number;
  data?: AdminDashboardSummary;
  error?: string;
}

const PAYMENT_COLORS = ['#5c3d2e', '#c88a4b'];

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

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: DashboardTrendPoint }>;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-outline-variant/60 bg-white p-3 text-xs shadow-md">
      <p className="mb-1 font-semibold text-primary">{formatFullDate(point.date)}</p>
      <p className="text-on-surface">
        Doanh thu: <strong>{formatCurrency(point.revenue)}</strong>
      </p>
      <p className="text-on-surface-variant">Đơn hoàn thành: {point.paymentCount}</p>
    </div>
  );
}

function MethodTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number }>;
}) {
  if (!active || !payload?.length || typeof payload[0]?.value !== 'number') return null;
  return (
    <div className="rounded-xl border border-outline-variant/60 bg-white px-3 py-2 text-xs shadow-md">
      <strong className="text-primary">{payload[0].name}:</strong>{' '}
      <span>{formatCurrency(payload[0].value)}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    getAdminDashboardSummary(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ token, version, data });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({ token, version, error: staffErrorMessage(cause) });
        }
      });

    return () => controller.abort();
  }, [token, version]);

  const current = result && result.token === token && result.version === version ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;
  const loading = Boolean(token) && !current;
  const reload = () => setVersion((v) => v + 1);

  const methodPieData = data
    ? [
        { name: 'Tiền mặt', value: data.todayRevenue.cashRevenue },
        { name: 'Chuyển khoản', value: data.todayRevenue.bankTransferRevenue },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <div>
          <h1>Tổng quan</h1>
          {data && (
            <p className="text-xs text-on-surface-variant">
              Ngày {formatFullDate(data.businessDate)} · Cập nhật lúc{' '}
              {new Date(data.generatedAt).toLocaleTimeString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
              })}
            </p>
          )}
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} disabled={loading} onClick={reload}>
            Làm mới
          </Button>
        </Space>
      </header>

      {error && (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          title={error}
          action={<Button onClick={reload}>Thử lại</Button>}
        />
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          to="/admin/reports"
          className="block rounded-2xl border border-outline-variant/40 bg-surface p-5 transition hover:border-primary/40"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            <span>Doanh thu hôm nay</span>
            <Icon name="chart" />
          </div>
          <strong className="mt-2 block text-2xl font-bold text-primary">
            {loading ? '…' : formatCurrency(data?.todayRevenue.totalRevenue ?? 0)}
          </strong>
          <span className="mt-1 block text-xs text-on-surface-variant">
            {data
              ? `${data.todayRevenue.completedPaymentCount} đơn hoàn thành`
              : 'Xem báo cáo chi tiết'}
          </span>
        </Link>

        <Link
          to="/admin/orders"
          className="block rounded-2xl border border-outline-variant/40 bg-surface p-5 transition hover:border-primary/40"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            <span>Đơn hôm nay</span>
            <Icon name="history" />
          </div>
          <strong className="mt-2 block text-2xl font-bold text-primary">
            {loading ? '…' : (data?.todayOrders.total ?? 0).toLocaleString('vi-VN')}
          </strong>
          <span className="mt-1 block text-xs text-on-surface-variant">
            {data
              ? `Hoàn thành ${data.todayOrders.completed} · Đang xử lý ${data.todayOrders.pending + data.todayOrders.preparing}`
              : 'Xem lịch sử đơn'}
          </span>
        </Link>

        <Link
          to="/admin/tables"
          className="block rounded-2xl border border-outline-variant/40 bg-surface p-5 transition hover:border-primary/40"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            <span>Bàn đang phục vụ</span>
            <Icon name="table_restaurant" />
          </div>
          <strong className="mt-2 block text-2xl font-bold text-primary">
            {loading ? '…' : `${data?.tables.openCount ?? 0} / ${data?.tables.activeTotal ?? 0}`}
          </strong>
          <span className="mt-1 block text-xs text-on-surface-variant">
            {data
              ? `Trống ${data.tables.idleCount} · Ngừng dùng ${data.tables.inactiveCount}`
              : 'Quản lý bàn'}
          </span>
        </Link>

        <Link
          to="/admin/inventory"
          className="block rounded-2xl border border-outline-variant/40 bg-surface p-5 transition hover:border-primary/40"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            <span>Cảnh báo kho</span>
            <Icon name="inventory_2" />
          </div>
          <strong
            className={`mt-2 block text-2xl font-bold ${
              (data?.lowStock.totalAlerts ?? 0) > 0 ? 'text-error' : 'text-primary'
            }`}
          >
            {loading ? '…' : (data?.lowStock.totalAlerts ?? 0).toLocaleString('vi-VN')}
          </strong>
          <span className="mt-1 block text-xs text-on-surface-variant">
            {data
              ? `Hết hàng ${data.lowStock.outOfStockIngredientCount + data.lowStock.outOfStockPackagedCount} · Sắp hết ${data.lowStock.lowIngredientCount}`
              : 'Kiểm tra kho'}
          </span>
        </Link>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-primary">Xu hướng doanh thu 7 ngày</h2>
            <Link to="/admin/reports" className="text-xs font-semibold text-primary hover:underline">
              Xem báo cáo →
            </Link>
          </div>
          {data && (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.recentRevenue}
                  margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c88a4b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#c88a4b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7ddd3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 12, fill: '#7c685c' }}
                    axisLine={{ stroke: '#d8c8b8' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatAxisCurrency}
                    tick={{ fontSize: 12, fill: '#7c685c' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <RechartsTooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#5c3d2e"
                    strokeWidth={2.5}
                    fill="url(#dashboardRevenueFill)"
                    activeDot={{ r: 5, fill: '#c88a4b' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
          <h2 className="mb-4 text-base font-bold text-primary">Thanh toán hôm nay</h2>
          {methodPieData.length === 0 ? (
            <p className="py-16 text-center text-sm text-on-surface-variant">
              Chưa có giao dịch hoàn thành hôm nay.
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {methodPieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<MethodTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-primary">Đơn hàng hôm nay</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-primary hover:underline">
              Lịch sử đơn →
            </Link>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <Tag color="gold">Chờ thanh toán</Tag>
              <strong>{data?.todayOrders.pending ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <Tag color="processing">Đang pha chế</Tag>
              <strong>{data?.todayOrders.preparing ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <Tag color="success">Đã hoàn thành</Tag>
              <strong>{data?.todayOrders.completed ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <Tag color="default">Hết hạn</Tag>
              <strong>{data?.todayOrders.expired ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-primary">Cảnh báo tồn kho</h2>
            <Link to="/admin/inventory" className="text-xs font-semibold text-primary hover:underline">
              Mở kho →
            </Link>
          </div>
          {!loading && data && data.lowStock.items.length === 0 ? (
            <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
              Tồn kho nguyên liệu và hàng đóng gói đang ở mức an toàn.
            </p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {(data?.lowStock.items ?? []).slice(0, 6).map((item) => (
                <li
                  key={`${item.itemType}-${item.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-4 py-2.5"
                >
                  <div>
                    <span className="font-medium text-on-surface">{item.name}</span>
                    <span className="ml-2 text-xs text-on-surface-variant">
                      {item.stockQuantity.toLocaleString('vi-VN')}
                      {item.unit ? ` ${item.unit}` : ''}
                      {item.minThreshold !== null
                        ? ` / ngưỡng ${item.minThreshold.toLocaleString('vi-VN')}`
                        : ''}
                    </span>
                  </div>
                  <Tag color={item.outOfStock ? 'error' : 'warning'}>
                    {item.outOfStock ? 'Hết hàng' : 'Sắp hết'}
                  </Tag>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

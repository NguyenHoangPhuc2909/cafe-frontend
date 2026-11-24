import type { ApiResponse } from '../types/api.ts';
import type {
  AdminDashboardSummary,
  DashboardTrendPoint,
  LowStockAlertItem,
} from '../types/adminDashboard.ts';
import { isIsoDate } from '../utils/adminOrderDates.ts';
import { http } from './http.ts';

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function parseAlertItem(raw: unknown): LowStockAlertItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu dashboard từ máy chủ chưa hợp lệ.');
  }
  const item = raw as Record<string, unknown>;
  if (
    (item.itemType !== 'INGREDIENT' && item.itemType !== 'PACKAGED') ||
    !isNonNegativeInt(item.id) ||
    item.id <= 0 ||
    typeof item.name !== 'string' ||
    !item.name.trim() ||
    (item.unit !== null && typeof item.unit !== 'string') ||
    !isNonNegativeNumber(item.stockQuantity) ||
    (item.minThreshold !== null && !isNonNegativeNumber(item.minThreshold)) ||
    typeof item.outOfStock !== 'boolean'
  ) {
    throw new Error('Dữ liệu dashboard từ máy chủ chưa hợp lệ.');
  }
  return {
    itemType: item.itemType,
    id: item.id,
    name: item.name,
    unit: item.unit as string | null,
    stockQuantity: item.stockQuantity,
    minThreshold: item.minThreshold as number | null,
    outOfStock: item.outOfStock,
  };
}

function parseTrendPoint(raw: unknown): DashboardTrendPoint {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu dashboard từ máy chủ chưa hợp lệ.');
  }
  const item = raw as Record<string, unknown>;
  if (
    !isIsoDate(typeof item.date === 'string' ? item.date : null) ||
    !isNonNegativeNumber(item.revenue) ||
    !isNonNegativeInt(item.paymentCount)
  ) {
    throw new Error('Dữ liệu dashboard từ máy chủ chưa hợp lệ.');
  }
  return {
    date: item.date as string,
    revenue: item.revenue,
    paymentCount: item.paymentCount,
  };
}

export async function getAdminDashboardSummary(
  token: string,
  signal?: AbortSignal,
): Promise<AdminDashboardSummary> {
  const { data } = await http.get<ApiResponse<AdminDashboardSummary>>(
    '/admin/dashboard',
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );

  if (!data?.success || !data.data || typeof data.data !== 'object') {
    throw new Error(data?.message || 'Chưa tải được dữ liệu tổng quan.');
  }

  const raw = data.data as unknown as Record<string, unknown>;
  const rev = raw.todayRevenue as Record<string, unknown> | undefined;
  const ord = raw.todayOrders as Record<string, unknown> | undefined;
  const tbl = raw.tables as Record<string, unknown> | undefined;
  const stock = raw.lowStock as Record<string, unknown> | undefined;

  if (
    !isIsoDate(typeof raw.businessDate === 'string' ? raw.businessDate : null) ||
    typeof raw.timeZone !== 'string' ||
    typeof raw.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(raw.generatedAt)) ||
    !rev ||
    !isNonNegativeNumber(rev.totalRevenue) ||
    !isNonNegativeInt(rev.completedPaymentCount) ||
    !isNonNegativeNumber(rev.cashRevenue) ||
    !isNonNegativeNumber(rev.bankTransferRevenue) ||
    !ord ||
    !isNonNegativeInt(ord.total) ||
    !isNonNegativeInt(ord.pending) ||
    !isNonNegativeInt(ord.preparing) ||
    !isNonNegativeInt(ord.completed) ||
    !isNonNegativeInt(ord.expired) ||
    !tbl ||
    !isNonNegativeInt(tbl.total) ||
    !isNonNegativeInt(tbl.activeTotal) ||
    !isNonNegativeInt(tbl.openCount) ||
    !isNonNegativeInt(tbl.idleCount) ||
    !isNonNegativeInt(tbl.inactiveCount) ||
    !stock ||
    !isNonNegativeInt(stock.lowIngredientCount) ||
    !isNonNegativeInt(stock.outOfStockIngredientCount) ||
    !isNonNegativeInt(stock.outOfStockPackagedCount) ||
    !isNonNegativeInt(stock.totalAlerts) ||
    !Array.isArray(stock.items) ||
    !Array.isArray(raw.recentRevenue)
  ) {
    throw new Error('Dữ liệu dashboard từ máy chủ chưa hợp lệ.');
  }

  return {
    businessDate: raw.businessDate as string,
    timeZone: raw.timeZone,
    generatedAt: raw.generatedAt,
    todayRevenue: {
      totalRevenue: rev.totalRevenue,
      completedPaymentCount: rev.completedPaymentCount,
      cashRevenue: rev.cashRevenue,
      bankTransferRevenue: rev.bankTransferRevenue,
    },
    todayOrders: {
      total: ord.total,
      pending: ord.pending,
      preparing: ord.preparing,
      completed: ord.completed,
      expired: ord.expired,
    },
    tables: {
      total: tbl.total,
      activeTotal: tbl.activeTotal,
      openCount: tbl.openCount,
      idleCount: tbl.idleCount,
      inactiveCount: tbl.inactiveCount,
    },
    lowStock: {
      lowIngredientCount: stock.lowIngredientCount,
      outOfStockIngredientCount: stock.outOfStockIngredientCount,
      outOfStockPackagedCount: stock.outOfStockPackagedCount,
      totalAlerts: stock.totalAlerts,
      items: stock.items.map(parseAlertItem),
    },
    recentRevenue: raw.recentRevenue.map(parseTrendPoint),
  };
}

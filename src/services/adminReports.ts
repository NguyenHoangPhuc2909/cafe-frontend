import type { ApiResponse } from '../types/api.ts';
import type {
  AdminMethodBreakdown,
  AdminRevenueReport,
  AdminRevenueReportQuery,
  DailyRevenuePoint,
  TopProductItem,
} from '../types/adminReport.ts';
import { isIsoDate } from '../utils/adminOrderDates.ts';
import { http } from './http.ts';

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function parseMethod(raw: unknown): AdminMethodBreakdown {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu báo cáo doanh thu từ máy chủ chưa hợp lệ.');
  }
  const item = raw as Record<string, unknown>;
  if (
    (item.method !== 'CASH' && item.method !== 'BANK_TRANSFER') ||
    !isNonNegativeNumber(item.amount) ||
    !isNonNegativeInt(item.paymentCount)
  ) {
    throw new Error('Dữ liệu báo cáo doanh thu từ máy chủ chưa hợp lệ.');
  }
  return {
    method: item.method,
    amount: item.amount,
    paymentCount: item.paymentCount,
  };
}

function parseDaily(raw: unknown): DailyRevenuePoint {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu báo cáo doanh thu từ máy chủ chưa hợp lệ.');
  }
  const item = raw as Record<string, unknown>;
  if (
    !isIsoDate(typeof item.date === 'string' ? item.date : null) ||
    !isNonNegativeNumber(item.revenue) ||
    !isNonNegativeNumber(item.cashRevenue) ||
    !isNonNegativeNumber(item.bankTransferRevenue) ||
    !isNonNegativeInt(item.paymentCount)
  ) {
    throw new Error('Dữ liệu báo cáo doanh thu từ máy chủ chưa hợp lệ.');
  }
  return {
    date: item.date as string,
    revenue: item.revenue,
    cashRevenue: item.cashRevenue,
    bankTransferRevenue: item.bankTransferRevenue,
    paymentCount: item.paymentCount,
  };
}

function parseTopProduct(raw: unknown): TopProductItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu báo cáo doanh thu từ máy chủ chưa hợp lệ.');
  }
  const item = raw as Record<string, unknown>;
  if (
    !isNonNegativeInt(item.productId) ||
    item.productId <= 0 ||
    typeof item.productName !== 'string' ||
    !item.productName.trim() ||
    !isNonNegativeInt(item.quantitySold) ||
    !isNonNegativeNumber(item.revenue)
  ) {
    throw new Error('Dữ liệu báo cáo doanh thu từ máy chủ chưa hợp lệ.');
  }
  return {
    productId: item.productId,
    productName: item.productName,
    quantitySold: item.quantitySold,
    revenue: item.revenue,
  };
}

export async function getAdminRevenueReport(
  token: string,
  query: AdminRevenueReportQuery = {},
  signal?: AbortSignal,
): Promise<AdminRevenueReport> {
  const { data } = await http.get<ApiResponse<AdminRevenueReport>>(
    '/admin/reports/revenue',
    {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        fromDate: query.fromDate || undefined,
        toDate: query.toDate || undefined,
        topLimit: query.topLimit ?? 10,
      },
      signal,
    },
  );

  if (!data?.success || !data.data || typeof data.data !== 'object') {
    throw new Error(data?.message || 'Chưa tải được báo cáo doanh thu.');
  }

  const raw = data.data as unknown as Record<string, unknown>;
  if (
    !isIsoDate(typeof raw.fromDate === 'string' ? raw.fromDate : null) ||
    !isIsoDate(typeof raw.toDate === 'string' ? raw.toDate : null) ||
    typeof raw.timeZone !== 'string' ||
    typeof raw.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(raw.generatedAt)) ||
    !isNonNegativeNumber(raw.totalRevenue) ||
    !isNonNegativeInt(raw.paymentCount) ||
    !isNonNegativeNumber(raw.averageOrderValue) ||
    !Array.isArray(raw.methods) ||
    !Array.isArray(raw.daily) ||
    !Array.isArray(raw.topProducts)
  ) {
    throw new Error('Dữ liệu báo cáo doanh thu từ máy chủ chưa hợp lệ.');
  }

  return {
    fromDate: raw.fromDate as string,
    toDate: raw.toDate as string,
    timeZone: raw.timeZone,
    generatedAt: raw.generatedAt,
    totalRevenue: raw.totalRevenue,
    paymentCount: raw.paymentCount,
    averageOrderValue: raw.averageOrderValue,
    methods: raw.methods.map(parseMethod),
    daily: raw.daily.map(parseDaily),
    topProducts: raw.topProducts.map(parseTopProduct),
  };
}

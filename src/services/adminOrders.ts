import type { ApiResponse, PageResponse } from '../types/api.ts';
import type { OrderResponse } from '../types/order.ts';
import { http } from './http.ts';

export interface AdminOrderQuery {
  fromDate?: string;
  toDate?: string;
  sessionId?: number;
  page?: number;
  size?: number;
}

function isValidCompletedOrder(raw: unknown): raw is OrderResponse {
  if (!raw || typeof raw !== 'object') return false;
  const order = raw as Record<string, unknown>;
  return (
    typeof order.id === 'number' &&
    Number.isSafeInteger(order.id) &&
    order.id > 0 &&
    order.status === 'COMPLETED' &&
    typeof order.totalAmount === 'number' &&
    Number.isFinite(order.totalAmount) &&
    order.totalAmount >= 0 &&
    typeof order.createdAt === 'string' &&
    order.createdAt.trim().length > 0 &&
    Array.isArray(order.items)
  );
}

export async function getAdminCompletedOrders(
  token: string,
  query: AdminOrderQuery = {},
  signal?: AbortSignal,
): Promise<PageResponse<OrderResponse>> {
  const { data } = await http.get<ApiResponse<PageResponse<OrderResponse>>>(
    '/admin/orders',
    {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        fromDate: query.fromDate || undefined,
        toDate: query.toDate || undefined,
        sessionId: query.sessionId,
        page: query.page ?? 0,
        size: query.size ?? 20,
      },
      signal,
    },
  );

  if (!data?.success || !data.data) {
    throw new Error(data?.message || 'Chưa tải được lịch sử đơn hàng.');
  }

  const result = data.data;
  if (
    !Array.isArray(result.content) ||
    !Number.isSafeInteger(result.page) ||
    result.page < 0 ||
    !Number.isSafeInteger(result.size) ||
    result.size < 1 ||
    !Number.isSafeInteger(result.totalElements) ||
    result.totalElements < 0 ||
    !Number.isSafeInteger(result.totalPages) ||
    result.totalPages < 0 ||
    typeof result.last !== 'boolean' ||
    !result.content.every(isValidCompletedOrder)
  ) {
    throw new Error('Dữ liệu lịch sử đơn hàng từ máy chủ chưa hợp lệ.');
  }

  return result;
}

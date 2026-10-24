import axios from 'axios';
import type { ApiResponse } from '../types/api.ts';
import type { CafeTableResponse, GuestOrderRequest, GuestOrderResponse, TableAccess, TableSessionResponse } from '../types/guest.ts';
import { isGuestOrder, isTableAccess } from '../utils/guest.ts';
import { http } from './http.ts';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) throw new Error(response.message || 'Phản hồi từ quán chưa hợp lệ.');
  return response.data;
}

export async function getTable(qrCode: string, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<CafeTableResponse & { active?: boolean }>>(`/public/tables/${encodeURIComponent(qrCode)}`, { signal });
  const table = unwrap(data);
  // Lombok's primitive boolean isActive getter is serialized as "active" by Jackson.
  const isActive = table.active ?? table.isActive;
  if (!Number.isSafeInteger(table.id) || table.id < 1 || typeof table.name !== 'string'
    || typeof table.qrCode !== 'string' || typeof isActive !== 'boolean') {
    throw new Error('Thông tin bàn chưa hợp lệ. Vui lòng liên hệ nhân viên.');
  }
  return { ...table, isActive };
}

export async function grantTableAccess(qrCode: string) {
  const { data } = await http.post<ApiResponse<TableAccess>>(`/public/tables/${encodeURIComponent(qrCode)}/access`);
  const access = unwrap(data);
  if (!isTableAccess(access)) throw new Error('Chưa nhận được phiên bàn hợp lệ. Vui lòng thử lại.');
  return access;
}

export async function getGuestSession(access: TableAccess, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<TableSessionResponse>>('/guest/session', {
    headers: { 'X-Table-Session-Token': access.accessToken }, signal,
  });
  const session = unwrap(data);
  if (session.id !== access.sessionId || session.tableId !== access.tableId || session.status !== 'OPEN') {
    throw new Error('Phiên bàn không còn hợp lệ. Vui lòng quét lại QR tại bàn.');
  }
  return session;
}

export async function createGuestOrder(access: TableAccess, request: GuestOrderRequest) {
  const { data } = await http.post<ApiResponse<GuestOrderResponse>>('/guest/orders', request, {
    headers: { 'X-Table-Session-Token': access.accessToken },
  });
  const order = unwrap(data);
  if (!isGuestOrder(order) || order.sessionId !== access.sessionId || order.tableId !== access.tableId) {
    throw new Error('Chưa xác nhận được kết quả gửi đơn.');
  }
  return order;
}

export function guestErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.message;
    if (typeof message === 'string' && message.length < 500) return message;
    return 'Chưa kết nối được với quán. Vui lòng kiểm tra kết nối.';
  }
  return error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export function isSessionRejected(error: unknown) {
  return axios.isAxiosError(error) && [401, 404, 409].includes(error.response?.status ?? 0);
}

export function isTokenRejected(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function isOrderDefinitelyRejected(error: unknown) {
  // A timeout, server error or unreadable success may follow a committed order.
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status !== undefined && status >= 400 && status < 500 && status !== 408;
}

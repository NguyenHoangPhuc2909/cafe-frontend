import type { ApiResponse, PageResponse } from '../types/api.ts';
import type { CashDay, CashMovement, CashMovementRequest, CashReconciliation, CashReconciliationRequest } from '../types/cash.ts';
import { http } from './http.ts';

const path = '/staff/cash';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data == null) throw new Error(response.message || 'Chưa xác nhận được thông tin quỹ tiền mặt.');
  return response.data;
}
export async function getCashDay(token: string, page: number, signal?: AbortSignal): Promise<CashDay> {
  const { data } = await http.get<ApiResponse<CashDay>>(`${path}/today`, { headers: headers(token), params: { page, size: 10 }, signal });
  const day = unwrap(data);
  if (!Array.isArray(day.movements?.content) || !/^\d{4}-\d{2}-\d{2}$/.test(day.businessDate)
      || ![day.openingAmount, day.cashSales, day.topUps, day.payouts, day.expectedAmount].every(Number.isFinite)
      || ![day.revision, day.cashPaymentCount, day.lastPaymentId].every(value => Number.isSafeInteger(value) && value >= 0))
    throw new Error('Số liệu quỹ tiền mặt chưa hợp lệ.');
  return day;
}
export async function recordCashMovement(token: string, request: CashMovementRequest): Promise<CashMovement> {
  const { data } = await http.post<ApiResponse<CashMovement>>(`${path}/movements`, request, { headers: headers(token) });
  const result = unwrap(data);
  if (!Number.isSafeInteger(result.id) || result.id <= 0 || result.businessDate !== request.businessDate
      || result.type !== request.type || result.amount !== request.amount || result.note !== request.note.trim())
    throw new Error('Chưa xác nhận được khoản thu chi. Giữ nguyên yêu cầu để gửi lại.');
  return result;
}
export async function reconcileCash(token: string, request: CashReconciliationRequest): Promise<CashReconciliation> {
  const { data } = await http.post<ApiResponse<CashReconciliation>>(`${path}/reconciliations`, request, { headers: headers(token) });
  const result = unwrap(data);
  if (!Number.isSafeInteger(result.id) || result.id <= 0 || result.businessDate !== request.businessDate
      || result.actualAmount !== request.actualAmount || !Number.isFinite(result.expectedAmount) || !Number.isFinite(result.difference)
      || result.revision !== request.expectedRevision || result.cashPaymentCount !== request.expectedPaymentCount
      || result.lastPaymentId !== request.expectedLastPaymentId)
    throw new Error('Chưa xác nhận được phiếu đối chiếu. Giữ nguyên yêu cầu để gửi lại.');
  return result;
}
export async function getCashReconciliations(token: string, page: number, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<PageResponse<CashReconciliation>>>(`${path}/reconciliations`, {
    headers: headers(token), params: { page, size: 10 }, signal,
  });
  const result = unwrap(data);
  if (!Array.isArray(result.content)) throw new Error('Chưa tải được lịch sử đối chiếu.');
  return result;
}

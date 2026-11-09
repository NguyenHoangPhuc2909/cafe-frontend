import type { ApiResponse, PageResponse } from '../types/api.ts';
import type { StocktakeItem, StocktakeReport, StocktakeRequest } from '../types/stocktake.ts';
import { http } from './http.ts';

const path = '/staff/inventory/stocktakes';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data == null) throw new Error(response.message || 'Chưa tải được phiếu kiểm kho.');
  return response.data;
}
export async function getStocktakePreview(token: string, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<StocktakeItem[]>>(`${path}/preview`, { headers: headers(token), signal });
  const items = unwrap(data);
  if (!Array.isArray(items)) throw new Error('Danh sách kiểm kho chưa hợp lệ.');
  return items;
}
export async function saveStocktake(token: string, request: StocktakeRequest) {
  const { data } = await http.post<ApiResponse<StocktakeReport>>(path, request, { headers: headers(token) });
  const report = unwrap(data);
  if (!Number.isSafeInteger(report.id) || report.id <= 0 || !Array.isArray(report.items))
    throw new Error('Chưa xác nhận được kết quả lưu phiếu. Gửi lại cùng phiếu để kiểm tra.');
  return report;
}
export async function getStocktakes(token: string, page: number, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<PageResponse<StocktakeReport>>>(path, {
    headers: headers(token), params: { page, size: 10 }, signal,
  });
  return unwrap(data);
}
export async function getStocktake(token: string, id: number, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<StocktakeReport>>(`${path}/${id}`, { headers: headers(token), signal });
  return unwrap(data);
}

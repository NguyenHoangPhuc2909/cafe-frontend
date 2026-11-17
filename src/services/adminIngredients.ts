import type { ApiResponse } from '../types/api.ts';
import type { AdminIngredient, SaveAdminIngredient } from '../types/adminIngredient.ts';
import { http } from './http.ts';

function isIngredient(value: unknown): value is AdminIngredient {
  if (!value || typeof value !== 'object') return false;
  const item = value as AdminIngredient;
  return Number.isSafeInteger(item.id) && item.id > 0 && typeof item.name === 'string' && !!item.name.trim()
    && typeof item.unit === 'string' && !!item.unit.trim() && Number.isFinite(item.stockQuantity) && item.stockQuantity >= 0
    && Number.isFinite(item.minThreshold) && item.minThreshold >= 0
    && typeof item.systemManaged === 'boolean' && typeof item.unitEditable === 'boolean' && typeof item.deletable === 'boolean';
}

export async function getAdminIngredients(token: string, signal?: AbortSignal): Promise<AdminIngredient[]> {
  const { data } = await http.get<ApiResponse<AdminIngredient[]>>('/admin/ingredients/management', {
    headers: { Authorization: `Bearer ${token}` }, signal,
  });
  if (!data.success || !Array.isArray(data.data) || !data.data.every(isIngredient))
    throw new Error(data.message || 'Chưa tải được danh sách nguyên liệu hợp lệ.');
  return data.data;
}

export async function saveAdminIngredient(token: string, request: SaveAdminIngredient, id?: number): Promise<AdminIngredient> {
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const body = { name: request.name.trim(), unit: request.unit.trim(), minThreshold: request.minThreshold };
  const { data } = id === undefined
    ? await http.post<ApiResponse<AdminIngredient>>('/admin/ingredients', body, options)
    : await http.put<ApiResponse<AdminIngredient>>(`/admin/ingredients/${id}`, body, options);
  if (!data.success || !isIngredient(data.data) || (id !== undefined && data.data.id !== id))
    throw new Error(data.message || 'Chưa xác nhận được kết quả lưu. Hãy tải lại danh sách trước khi gửi lại.');
  return data.data;
}

export async function deleteAdminIngredient(token: string, id: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<null>>(`/admin/ingredients/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!data.success) throw new Error(data.message || 'Không xóa được nguyên liệu.');
}

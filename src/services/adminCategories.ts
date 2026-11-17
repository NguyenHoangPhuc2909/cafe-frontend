import type { ApiResponse } from '../types/api';
import type { CategoryResponse } from '../types/adminProduct';
import { http } from './http.ts';

export async function saveAdminCategory(token: string, name: string, id?: number): Promise<CategoryResponse> {
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const body = { name: name.trim() };
  const { data } = id === undefined
    ? await http.post<ApiResponse<CategoryResponse>>('/admin/categories', body, options)
    : await http.put<ApiResponse<CategoryResponse>>(`/admin/categories/${id}`, body, options);
  if (!data.success || !data.data || !Number.isSafeInteger(data.data.id) || data.data.id <= 0
      || typeof data.data.name !== 'string' || !data.data.name.trim()) {
    throw new Error(data.message || 'Chưa xác nhận được kết quả lưu danh mục. Hãy tải lại danh sách trước khi thử lại.');
  }
  return data.data;
}

export async function deleteAdminCategory(token: string, id: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<null>>(`/admin/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!data.success) throw new Error(data.message || 'Không xóa được danh mục.');
}

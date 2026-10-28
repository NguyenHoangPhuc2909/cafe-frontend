import type { ApiResponse, ProductResponse } from '../types/api';
import { toProduct } from '../utils/products.ts';
import { http } from './http.ts';

export async function getPublicMenu(signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<ProductResponse[]>>('/products', { signal });
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Không thể tải thực đơn. Vui lòng thử lại.');
  }
  return data.data.map(toProduct);
}

import type { ApiResponse } from '../types/api.ts';
import type { PersonalRevenue } from '../types/revenue.ts';
import { http } from './http.ts';

export async function getPersonalRevenue(token: string, page: number, signal?: AbortSignal): Promise<PersonalRevenue> {
  const { data } = await http.get<ApiResponse<PersonalRevenue>>('/staff/revenue/today', {
    headers: { Authorization: `Bearer ${token}` }, params: { page, size: 20 }, signal,
  });
  if (!data.success || !data.data || !Array.isArray(data.data.payments?.content)
      || !Array.isArray(data.data.methods) || !Number.isFinite(data.data.totalAmount))
    throw new Error(data.message || 'Chưa tải được doanh thu hôm nay.');
  return data.data;
}

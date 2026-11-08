import type { ApiResponse } from '../types/api.ts';
import { http } from './http.ts';

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stockQuantity: number;
  minThreshold: number;
}

export interface PackagedStock {
  id: number;
  name: string;
  stockQuantity: number | null;
  isActive: boolean | null;
}

export async function getStaffPackagedStock(
  token: string,
  signal?: AbortSignal,
): Promise<PackagedStock[]> {
  const { data } = await http.get<ApiResponse<PackagedStock[]>>(
    '/staff/inventory/packaged',
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Chưa tải được kho hàng đóng gói.');
  }

  return data.data;
}

export async function getStaffIngredients(
  token: string,
  signal?: AbortSignal,
): Promise<Ingredient[]> {
  const { data } = await http.get<ApiResponse<Ingredient[]>>(
    '/staff/ingredients',
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Chưa tải được kho nguyên liệu.');
  }

  return data.data;
}
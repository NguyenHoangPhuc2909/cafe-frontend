import type { ApiResponse } from "../types/api.ts";
import { http } from "./http.ts";
import type {
  StockMovementResponse,
  StockReceiptRequest,
} from "../types/inventory.ts";

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
    "/staff/inventory/packaged",
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || "Chưa tải được kho hàng đóng gói.");
  }

  return data.data;
}

export async function getStaffIngredients(
  token: string,
  signal?: AbortSignal,
): Promise<Ingredient[]> {
  const { data } = await http.get<ApiResponse<Ingredient[]>>(
    "/staff/ingredients",
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || "Chưa tải được kho nguyên liệu.");
  }

  return data.data;
}

export async function receiveStaffStock(
  token: string,
  request: StockReceiptRequest,
): Promise<StockMovementResponse> {
  const { data } = await http.post<ApiResponse<StockMovementResponse>>(
    "/staff/inventory/receipts",
    request,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || "Chưa xác nhận được kết quả nhập kho.");
  }

  const movement = data.data;

  if (
    !Number.isSafeInteger(movement.id) ||
    movement.id <= 0 ||
    movement.type !== "RECEIPT" ||
    movement.ingredientId !== (request.ingredientId ?? null) ||
    movement.productId !== (request.productId ?? null) ||
    movement.quantityDelta !== request.quantity ||
    !Number.isFinite(movement.availableBefore) ||
    movement.availableBefore < 0 ||
    !Number.isFinite(movement.availableAfter) ||
    movement.availableAfter < movement.availableBefore
  ) {
    throw new Error(
      "Phản hồi nhập kho chưa hợp lệ. Giữ nguyên mã phiếu khi gửi lại.",
    );
  }

  return movement;
}

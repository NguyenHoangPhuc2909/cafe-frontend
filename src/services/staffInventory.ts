import type { ApiResponse, PageResponse } from "../types/api.ts";
import { http } from "./http.ts";
import type {
  StockMovementResponse,
  StockReceiptRequest,
  StockReceiptHistoryFilters
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
  unit: string;
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

function isValidStockMovement(movement: StockMovementResponse): boolean {
  const hasIngredient = movement.ingredientId !== null;
  const hasProduct = movement.productId !== null;

  return (
    Number.isSafeInteger(movement.id) &&
    movement.id > 0 &&
    movement.type === "RECEIPT" &&
    hasIngredient !== hasProduct &&
    (movement.ingredientId === null ||
      (Number.isSafeInteger(movement.ingredientId) && movement.ingredientId > 0)) &&
    (movement.productId === null ||
      (Number.isSafeInteger(movement.productId) && movement.productId > 0)) &&
    typeof movement.itemName === "string" &&
    movement.itemName.trim().length > 0 &&
    (movement.unit === null || typeof movement.unit === "string") &&
    typeof movement.quantityDelta === "number" &&
    Number.isFinite(movement.quantityDelta) &&
    movement.quantityDelta > 0 &&
    typeof movement.availableBefore === "number" &&
    Number.isFinite(movement.availableBefore) &&
    movement.availableBefore >= 0 &&
    typeof movement.availableAfter === "number" &&
    Number.isFinite(movement.availableAfter) &&
    movement.availableAfter >= movement.availableBefore &&
    Number.isSafeInteger(movement.performedById) &&
    movement.performedById > 0 &&
    typeof movement.performedByName === "string" &&
    movement.performedByName.trim().length > 0 &&
    typeof movement.note === "string" &&
    typeof movement.createdAt === "string" &&
    Number.isFinite(Date.parse(movement.createdAt))
  );
}

export async function getStaffReceiptHistory(
  token: string,
  page = 0,
  size = 20,
  signal?: AbortSignal,
  filters: StockReceiptHistoryFilters = {}
): Promise<PageResponse<StockMovementResponse>> {
  const { data } = await http.get<
    ApiResponse<PageResponse<StockMovementResponse>>
  >("/staff/inventory/receipts", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page,
      size,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      ingredientId: filters.ingredientId,
      productId: filters.productId,
      performedById: filters.performedById,
    },
    signal,
  });

  if (!data.success || !data.data || !Array.isArray(data.data.content)) {
    throw new Error(data.message || "Chưa tải được lịch sử nhập kho.");
  }

  if (
    !Number.isSafeInteger(data.data.totalElements) ||
    data.data.totalElements < 0 ||
    !data.data.content.every(isValidStockMovement)
  ) {
    throw new Error("Dữ liệu lịch sử nhập kho từ máy chủ chưa hợp lệ.");
  }

  return data.data;
}
import type { CartItem } from "../types/cart.ts";
import type {
  GuestOrderRequest,
  GuestOrderResponse,
  OrderAttempt,
  TableAccess,
} from "../types/guest.ts";

const positiveId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const validDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";

export function isTableAccess(value: unknown): value is TableAccess {
  return (
    object(value) &&
    positiveId(value.sessionId) &&
    positiveId(value.tableId) &&
    typeof value.tableName === "string" &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    validDate(value.expiresAt)
  );
}

export function isGuestOrder(value: unknown): value is GuestOrderResponse {
  return (
    object(value) &&
    positiveId(value.id) &&
    positiveId(value.sessionId) &&
    positiveId(value.tableId) &&
    typeof value.tableName === "string" &&
    typeof value.totalAmount === "number" &&
    Number.isFinite(value.totalAmount) &&
    value.totalAmount >= 0 &&
    typeof value.status === "string" &&
    typeof value.paymentStatus === "string" &&
    ['UNPAID', 'PAID', 'REFUNDED'].includes(value.paymentStatus) &&
    validDate(value.paymentExpiresAt) &&
    validDate(value.createdAt) &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(
      (item) =>
        object(item) &&
        positiveId(item.id) &&
        typeof item.productName === "string" &&
        positiveId(item.quantity) &&
        typeof item.price === "number" &&
        Number.isFinite(item.price) &&
        item.price >= 0,
    )
  );
}

export function buildGuestOrder(
  items: CartItem[],
  note: string,
): GuestOrderRequest {
  if (!items.length) throw new Error("Bạn chưa chọn món.");
  const quantities = new Map<number, number>();
  for (const item of items) {
    if (
      !positiveId(item.productId) ||
      !positiveId(item.quantity) ||
      item.isAvailable === false ||
      item.options
    ) {
      throw new Error(
        "Giỏ có món không hợp lệ hoặc ngừng bán. Vui lòng kiểm tra lại.",
      );
    }
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity) || quantity > 2147483647)
      throw new Error("Số lượng món vượt giới hạn.");
    quantities.set(item.productId, quantity);
  }
  return {
    items: [...quantities].map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
    note: note.trim().slice(0, 500),
  };
}

export function restoreTableAccess(raw: string | null): TableAccess | null {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    return isTableAccess(value) ? value : null;
  } catch {
    return null;
  }
}

export function restoreOrderAttempt(raw: string | null): OrderAttempt | null {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (
      !object(value) ||
      !positiveId(value.sessionId) ||
      typeof value.tableName !== "string" ||
      !validDate(value.startedAt)
    )
      return null;
    if (
      value.state === "success" &&
      isGuestOrder(value.order) &&
      value.order.sessionId === value.sessionId
    ) {
      return {
        state: "success",
        tableName: value.tableName,
        sessionId: value.sessionId,
        startedAt: value.startedAt,
        order: value.order,
      };
    }
    if (value.state === "sending" || value.state === "unknown") {
      return {
        state: "unknown",
        tableName: value.tableName,
        sessionId: value.sessionId,
        startedAt: value.startedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Subtract only the sent quantities; keep any dishes added while the request was running.
export function subtractSubmittedItems(
  current: CartItem[],
  submitted: CartItem[],
) {
  const quantities = new Map(submitted.map((item) => [item.id, item.quantity]));
  return current
    .map((item) => ({
      ...item,
      quantity: item.quantity - (quantities.get(item.id) ?? 0),
    }))
    .filter((item) => item.quantity > 0);
}

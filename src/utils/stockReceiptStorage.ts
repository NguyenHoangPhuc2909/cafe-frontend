import type { StockReceiptRequest } from "../types/inventory";

interface PendingReceiptResult {
  request: StockReceiptRequest | null;
  error: string | null;
}

const storageKey = (username: string) =>
  `cafe.stock-receipt.v1.${encodeURIComponent(username)}`;

const validId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

function isValidRequest(value: unknown): value is StockReceiptRequest {
  if (!value || typeof value !== "object") return false;

  const request = value as Record<string, unknown>;

  if (
    typeof request.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      request.requestId,
    ) ||
    typeof request.quantity !== "number" ||
    !Number.isFinite(request.quantity) ||
    request.quantity <= 0 ||
    typeof request.note !== "string" ||
    !request.note.trim() ||
    request.note.length > 500
  ) {
    return false;
  }

  const hasIngredient = request.ingredientId !== undefined;
  const hasProduct = request.productId !== undefined;

  if (hasIngredient === hasProduct) return false;

  if (hasIngredient) {
    return validId(request.ingredientId);
  }

  return (
    validId(request.productId) &&
    Number.isInteger(request.quantity) &&
    request.quantity <= 2_147_483_647
  );
}

export function readPendingStockReceipt(
  username: string,
): PendingReceiptResult {
  try {
    const raw = sessionStorage.getItem(storageKey(username));

    if (raw === null) {
      return { request: null, error: null };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isValidRequest(parsed)) {
      return {
        request: null,
        error:
          "Phiếu nhập đang chờ có dữ liệu không hợp lệ. " +
          "Cần đối chiếu trước khi tạo phiếu mới.",
      };
    }

    return { request: parsed, error: null };
  } catch {
    return {
      request: null,
      error: "Chưa đọc được phiếu nhập đang chờ. Vui lòng thử tải lại trang.",
    };
  }
}

export function savePendingStockReceipt(
  username: string,
  request: StockReceiptRequest,
): void {
  if (!isValidRequest(request)) {
    throw new Error("Dữ liệu phiếu nhập chưa hợp lệ.");
  }

  sessionStorage.setItem(storageKey(username), JSON.stringify(request));
}

export function clearPendingStockReceipt(
  username: string,
  requestId: string,
): void {
  const current = readPendingStockReceipt(username);

  if (current.error) {
    throw new Error(current.error);
  }

  if (current.request?.requestId === requestId) {
    sessionStorage.removeItem(storageKey(username));
  }
}

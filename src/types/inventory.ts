type StockReceiptTarget =
  | { ingredientId: number; productId?: never }
  | { productId: number; ingredientId?: never };

export type StockReceiptDraft = StockReceiptTarget & {
  quantity: number;
  note: string;
};

export type StockReceiptRequest = StockReceiptDraft & {
  requestId: string;
};

export interface StockMovementResponse {
  id: number;
  type: 'RECEIPT' | 'STOCKTAKE_ADJUSTMENT';
  ingredientId: number | null;
  productId: number | null;
  quantityDelta: number;
  availableBefore: number;
  availableAfter: number;
  performedById: number;
  note: string;
  createdAt: string;
}


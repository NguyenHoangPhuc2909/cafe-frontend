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
  itemName: string;
  unit: string;
  quantityDelta: number;
  availableBefore: number;
  availableAfter: number;
  performedById: number;
  performedByName: string;
  note: string;
  createdAt: string;
}

export interface StockReceiptHistoryFilters {
  fromDate?: string;
  toDate?: string;
  ingredientId?: number;
  productId?: number;
}

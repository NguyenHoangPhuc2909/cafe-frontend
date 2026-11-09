export interface StocktakeItem {
  ingredientId: number | null;
  productId: number | null;
  itemName: string;
  unit: string | null;
  expectedQuantity: number;
  actualQuantity: number | null;
  difference: number | null;
  note: string;
}

export interface StocktakeRequest {
  requestId: string;
  note: string;
  items: Pick<StocktakeItem, 'ingredientId' | 'productId' | 'expectedQuantity' | 'actualQuantity' | 'note'>[];
}

export interface StocktakeReport {
  id: number;
  performedById: number;
  performedByName: string;
  createdAt: string;
  note: string;
  totalItems: number;
  checkedItems: number;
  differenceItems: number;
  items: StocktakeItem[] | null;
}

export interface StocktakeDraft {
  items: (StocktakeItem & { input: string })[];
  note: string;
  startedAt: string;
  pending: StocktakeRequest | null;
}

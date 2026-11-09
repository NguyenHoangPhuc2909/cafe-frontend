import type { StocktakeDraft, StocktakeItem, StocktakeRequest } from '../types/stocktake.ts';

export const stocktakeKey = (item: Pick<StocktakeItem, 'ingredientId' | 'productId'>) =>
  item.ingredientId == null ? `p:${item.productId}` : `i:${item.ingredientId}`;
const storageKey = (username: string) => `cafe:stocktake:v1:${username}`;

export function actualQuantity(input: string, packaged: boolean): number | null {
  if (input.trim() === '') return null;
  const value = Number(input);
  if (!Number.isFinite(value) || value < 0 || (packaged && (!Number.isInteger(value) || value > 2_147_483_647)))
    throw new Error('Số thực tế phải từ 0 trở lên; hàng đóng gói phải là số nguyên hợp lệ.');
  return value;
}
export function stocktakeDifference(actual: number, expected: number) {
  // Avoid displaying floating-point noise (e.g. 0.3 - 0.2).
  return Number((actual - expected).toPrecision(12));
}
export function stocktakeRequest(draft: StocktakeDraft, requestId: string): StocktakeRequest {
  const items = draft.items.map(item => ({
    ingredientId: item.ingredientId, productId: item.productId, expectedQuantity: item.expectedQuantity,
    actualQuantity: actualQuantity(item.input, item.productId != null), note: item.note.trim(),
  }));
  if (!items.some(item => item.actualQuantity != null)) throw new Error('Vui lòng kiểm ít nhất một mặt hàng.');
  return { requestId, note: draft.note.trim(), items };
}
export function newStocktakeDraft(items: StocktakeItem[], previous?: StocktakeDraft | null): StocktakeDraft {
  const prior = new Map(previous?.items.map(item => [stocktakeKey(item), item]));
  return {
    items: items.map(item => ({ ...item, input: prior.get(stocktakeKey(item))?.input ?? '', note: prior.get(stocktakeKey(item))?.note ?? '' })),
    note: previous?.note ?? '', startedAt: new Date().toISOString(), pending: null,
  };
}
export function readStocktakeDraft(username: string): StocktakeDraft | null {
  const raw = localStorage.getItem(storageKey(username));
  if (!raw) return null;
  const draft: StocktakeDraft = JSON.parse(raw);
  if (!draft || !Array.isArray(draft.items) || typeof draft.note !== 'string' || typeof draft.startedAt !== 'string'
      || !draft.items.every(item => item && typeof item.input === 'string' && typeof item.note === 'string'
        && typeof item.itemName === 'string' && Number.isFinite(item.expectedQuantity)
        && (item.ingredientId == null) !== (item.productId == null)))
    throw new Error('Bản nháp kiểm kho không đọc được.');
  if (draft.pending && (typeof draft.pending.requestId !== 'string' || !Array.isArray(draft.pending.items)))
    throw new Error('Phiếu chờ kiểm kho không đọc được.');
  return draft;
}
export function writeStocktakeDraft(username: string, draft: StocktakeDraft) {
  localStorage.setItem(storageKey(username), JSON.stringify(draft));
}
export function clearStocktakeDraft(username: string) { localStorage.removeItem(storageKey(username)); }

export function matchesStocktakeSearch(name: string, query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  return normalize(name).includes(normalize(query.trim()));
}

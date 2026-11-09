import test from 'node:test';
import assert from 'node:assert/strict';
import type { StocktakeItem } from '../src/types/stocktake.ts';
import { actualQuantity, clearStocktakeDraft, matchesStocktakeSearch, newStocktakeDraft,
  readStocktakeDraft, stocktakeDifference, stocktakeRequest, writeStocktakeDraft } from '../src/utils/stocktakeDraft.ts';

const items: StocktakeItem[] = [
  { ingredientId: 1, productId: null, itemName: 'Cà phê', unit: 'g', expectedQuantity: 10, actualQuantity: null, difference: null, note: '' },
  { ingredientId: null, productId: 2, itemName: 'Nước đóng chai', unit: 'chai', expectedQuantity: 5, actualQuantity: null, difference: null, note: '' },
];

test('blank means unchecked while zero is a recorded count; fractional packaged counts are rejected', () => {
  assert.equal(actualQuantity('', false), null); assert.equal(actualQuantity('  ', true), null);
  assert.equal(actualQuantity('0', true), 0); assert.equal(actualQuantity('0.25', false), 0.25);
  for (const value of ['-1', 'Infinity', 'NaN']) assert.throws(() => actualQuantity(value, false));
  assert.throws(() => actualQuantity('1.5', true)); assert.throws(() => actualQuantity('2147483648', true));
  assert.equal(stocktakeDifference(0.3, 0.2), 0.1);
});

test('request retains unchecked rows, excludes display fields and rejects an entirely unchecked report', () => {
  const draft = newStocktakeDraft(items);
  assert.throws(() => stocktakeRequest(draft, 'request'));
  draft.items[0].input = '0'; draft.items[0].note = ' Hết hàng '; draft.note = ' Cuối buổi ';
  const request = stocktakeRequest(draft, 'request');
  assert.deepEqual(request, { requestId: 'request', note: 'Cuối buổi', items: [
    { ingredientId: 1, productId: null, expectedQuantity: 10, actualQuantity: 0, note: 'Hết hàng' },
    { ingredientId: null, productId: 2, expectedQuantity: 5, actualQuantity: null, note: '' },
  ] });
});

test('refresh preserves entered counts by target identity and uses fresh server quantities', () => {
  const draft = newStocktakeDraft(items); draft.items[0].input = '9.5'; draft.items[0].note = 'Hao hụt';
  const next = newStocktakeDraft([{ ...items[0], expectedQuantity: 11 }, items[1]], draft);
  assert.equal(next.items[0].input, '9.5'); assert.equal(next.items[0].note, 'Hao hụt');
  assert.equal(next.items[0].expectedQuantity, 11); assert.equal(next.pending, null);
  assert.equal(matchesStocktakeSearch('Nước Đóng Chai', 'nuoc dong'), true);
});

test('draft and unresolved request survive reopening, remain account-specific, and storage errors surface', t => {
  const values = new Map<string, string>();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else Reflect.deleteProperty(globalThis, 'localStorage'); });
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  const draft = newStocktakeDraft(items); draft.items[0].input = '0';
  draft.pending = stocktakeRequest(draft, 'original-request');
  writeStocktakeDraft('alice', draft);
  assert.deepEqual(readStocktakeDraft('alice'), draft); assert.equal(readStocktakeDraft('bob'), null);
  clearStocktakeDraft('alice'); assert.equal(readStocktakeDraft('alice'), null);
  storage.setItem = () => { throw new Error('Storage unavailable'); };
  assert.throws(() => writeStocktakeDraft('alice', draft), /Storage unavailable/);
});

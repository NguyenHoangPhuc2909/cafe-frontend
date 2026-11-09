import test from 'node:test';
import assert from 'node:assert/strict';
import { cashDifference, cashStatus, clearCashPending, parseCashAmount, readCashPending, writeCashPending } from '../src/utils/cash.ts';
import { getCashDay, reconcileCash, recordCashMovement } from '../src/services/staffCash.ts';
import { http } from '../src/services/http.ts';

test('cash count distinguishes zero from an empty value and rejects invalid physical cash amounts', () => {
  assert.equal(parseCashAmount('0'), 0); assert.equal(parseCashAmount('500000'), 500000);
  for (const value of ['', ' ', '-1', '1.5', 'NaN', 'Infinity', '1000000000000']) assert.throws(() => parseCashAmount(value));
  assert.throws(() => parseCashAmount('0', true)); assert.equal(parseCashAmount('100000', true), 100000);
  assert.equal(cashDifference(1200000, 1200000), 0); assert.equal(cashStatus(-10000), 'Thiếu tiền');
  assert.equal(cashStatus(0), 'Khớp quỹ'); assert.equal(cashStatus(10000), 'Thừa tiền');
  assert.equal(cashDifference(100, 99.9), 0.1);
});

test('unresolved cash requests survive reopening and remain separated by account and operation', t => {
  const values = new Map<string, string>();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else Reflect.deleteProperty(globalThis, 'localStorage'); });
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  const request = { requestId: 'original', businessDate: '2026-11-09', type: 'PAYOUT', amount: 100000, note: 'Mua ly' };
  writeCashPending('alice', 'movement', request);
  assert.deepEqual(readCashPending('alice', 'movement'), request);
  assert.equal(readCashPending('bob', 'movement'), null); assert.equal(readCashPending('alice', 'reconciliation'), null);
  clearCashPending('alice', 'movement'); assert.equal(readCashPending('alice', 'movement'), null);
  storage.setItem = () => { throw new Error('Storage unavailable'); };
  assert.throws(() => writeCashPending('alice', 'movement', request), /Storage unavailable/);
});

test('shared cash query uses the authenticated endpoint without a personal staff filter', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  http.defaults.adapter = async config => {
    assert.equal(config.url, '/staff/cash/today'); assert.equal(config.headers.get('Authorization'), 'Bearer staff');
    assert.deepEqual(config.params, { page: 2, size: 10 });
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: {
      businessDate: '2026-11-09', openingAmount: 500000, cashSales: 800000, cashPaymentCount: 5, lastPaymentId: 100,
      revision: 2, topUps: 0, payouts: 100000, expectedAmount: 1200000, movements: { content: [] },
    } } };
  };
  const day = await getCashDay('staff', 2);
  assert.equal(day.expectedAmount, 1200000); assert.equal(day.cashSales, 800000);
});

test('movement POST preserves the request identifier and rejects a mismatched successful response', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const request = { requestId: 'original', businessDate: '2026-11-09', type: 'PAYOUT' as const, amount: 100000, note: 'Mua ly' };
  let malformed = false;
  http.defaults.adapter = async config => {
    assert.equal(config.url, '/staff/cash/movements'); assert.equal(config.headers.get('Authorization'), 'Bearer staff');
    assert.deepEqual(JSON.parse(config.data), request);
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: { ...request, id: 1, amount: malformed ? 999 : request.amount } } };
  };
  assert.equal((await recordCashMovement('staff', request)).id, 1);
  malformed = true;
  await assert.rejects(recordCashMovement('staff', request), /Chưa xác nhận/);
});

test('reconciliation sends the actual count and preview fingerprint, never a browser-computed expected amount', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const request = { requestId: 'original', businessDate: '2026-11-09', expectedRevision: 2, expectedPaymentCount: 5,
    expectedLastPaymentId: 100, actualAmount: 1190000, note: 'Thiếu 10k' };
  http.defaults.adapter = async config => {
    assert.equal(config.url, '/staff/cash/reconciliations'); assert.deepEqual(JSON.parse(config.data), request);
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: {
      id: 1, businessDate: request.businessDate, revision: 2, cashPaymentCount: 5, lastPaymentId: 100,
      actualAmount: 1190000, expectedAmount: 1200000, difference: -10000,
    } } };
  };
  const result = await reconcileCash('staff', request);
  assert.equal(result.expectedAmount, 1200000); assert.equal(result.difference, -10000);
});

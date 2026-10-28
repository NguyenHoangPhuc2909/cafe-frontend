import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout, transitionCheckout } from '../src/utils/checkout.ts';
import { filterOrderHistory, historyDateError } from '../src/utils/orderHistory.ts';
import type { HistoryFilters } from '../src/utils/orderHistory.ts';

const filters: HistoryFilters = { query: '', status: 'all', method: 'all', source: 'all', from: '', to: '', sessionId: null };
function draft(code: string, time: string, sessionId = 7) {
  return createCheckout([{ id: '1', productId: 1, name: 'Cà phê sữa đá', quantity: 1, price: 30000 }], '', { id: sessionId, tableName: 'Bàn 03' }, code, new Date(time).getTime());
}

test('history date filtering includes the entire selected local day without including the next day', () => {
  const before = draft('DEMO-BEFORE', '2026-10-24T23:59:59');
  const first = draft('DEMO-FIRST', '2026-10-25T00:00:00');
  const last = draft('DEMO-LAST', '2026-10-25T23:59:59');
  const next = draft('DEMO-NEXT', '2026-10-26T00:00:00');
  assert.deepEqual(filterOrderHistory([before, first, last, next], { ...filters, from: '2026-10-25', to: '2026-10-25' }).map(order => order.code), ['DEMO-LAST', 'DEMO-FIRST']);
});

test('invalid or reversed date ranges are reported and return no misleading results', () => {
  assert.ok(historyDateError('2026-10-26', '2026-10-25'));
  assert.ok(historyDateError('2026-02-30', ''));
  assert.equal(historyDateError('2026-10-25', '2026-10-25'), null);
  assert.deepEqual(filterOrderHistory([draft('DEMO-01', '2026-10-25T10:00:00')], { ...filters, from: 'not-a-date' }), []);
});

test('paid, served and expired are distinguished, and reading history never mutates an order', () => {
  const unpaid = draft('DEMO-01', '2026-10-25T10:00:00');
  const now = unpaid.createdAt;
  let served = transitionCheckout(transitionCheckout({ ...unpaid, code: 'DEMO-02' }, { type: 'confirm' }, now), { type: 'paid' }, now);
  for (let index = 0; index < 3; index++) served = transitionCheckout(served, { type: 'advance' }, now);
  const paid = { ...served, code: 'DEMO-03', preparationStatus: 'received' as const };
  const expired = transitionCheckout({ ...unpaid, code: 'DEMO-04' }, { type: 'tick' }, now + 180000);
  const orders = [unpaid, served, paid, expired];
  const original = JSON.stringify(orders);
  assert.equal(filterOrderHistory(orders, { ...filters, status: 'paid' }).length, 2);
  assert.equal(filterOrderHistory(orders, { ...filters, status: 'served' })[0].code, 'DEMO-02');
  assert.equal(filterOrderHistory(orders, { ...filters, status: 'expired' })[0].code, 'DEMO-04');
  assert.equal(JSON.stringify(orders), original);
});

test('session, method, source and unaccented search combine correctly', () => {
  const customer = draft('DEMO-CUSTOMER', '2026-10-25T10:00:00');
  const sample = { ...draft('DEMO-SAMPLE-01', '2026-10-25T11:00:00', 90001), method: 'counter' as const };
  assert.equal(filterOrderHistory([customer, sample], { ...filters, query: 'ca phe', sessionId: 7, method: 'transfer', source: 'customer' })[0].code, customer.code);
  assert.equal(filterOrderHistory([customer, sample], { ...filters, source: 'samples' })[0].code, sample.code);
  assert.deepEqual(filterOrderHistory([customer, sample], { ...filters, sessionId: 7, method: 'counter' }), []);
});

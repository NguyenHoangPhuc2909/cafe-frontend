import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout, restoreCheckout, transitionCheckout, PAYMENT_WINDOW_MS } from '../src/utils/checkout.ts';
import type { CartItem } from '../src/types/cart.ts';

const now = 1792828800000;
const items: CartItem[] = [{ id: '11', productId: 11, name: 'Nước chai', quantity: 2, price: 15000, isAvailable: true }];
const draft = () => createCheckout(items, 'Ít đá', { id: 7, tableName: 'TEST01' }, 'DEMO-TEST', now);

test('checkout takes a snapshot of the actual cart, note and table without sharing mutable rows', () => {
  const order = draft();
  assert.equal(order.total, 30000);
  assert.equal(order.note, 'Ít đá');
  assert.equal(order.tableName, 'TEST01');
  assert.equal(order.expiresAt, now + PAYMENT_WINDOW_MS);
  assert.equal(PAYMENT_WINDOW_MS, 180000);
  assert.notEqual(order.items[0], items[0]);
  assert.throws(() => createCheckout([], '', { id: 7, tableName: 'TEST01' }, 'DEMO-X', now));
  assert.throws(() => createCheckout([{ ...items[0], isAvailable: false }], '', { id: 7, tableName: 'TEST01' }, 'DEMO-X', now));
});

test('customer confirmation never marks payment received or sends the order to preparation', () => {
  const order = draft();
  assert.equal(transitionCheckout(order, { type: 'paid' }, now), order);
  assert.equal(transitionCheckout(order, { type: 'advance' }, now), order);
  const waiting = transitionCheckout(order, { type: 'confirm' }, now + 1000);
  assert.equal(waiting.paymentStatus, 'verifying');
  assert.equal(waiting.preparationStatus, null);
  assert.equal(transitionCheckout(waiting, { type: 'advance' }, now + 1000), waiting);
  const paid = transitionCheckout(waiting, { type: 'paid' }, now + 2000);
  assert.equal(paid.paymentStatus, 'paid');
  assert.equal(paid.preparationStatus, 'received');
  assert.equal(transitionCheckout(paid, { type: 'paid' }, now + 2000), paid);
});

test('failure permits an explicit retry with the same deadline and no preparation', () => {
  const waiting = transitionCheckout(draft(), { type: 'confirm' }, now);
  const failed = transitionCheckout(waiting, { type: 'failed' }, now + 1000);
  assert.equal(failed.paymentStatus, 'failed');
  assert.equal(failed.preparationStatus, null);
  const retried = transitionCheckout(failed, { type: 'retry' }, now + 2000);
  assert.equal(retried.paymentStatus, 'unpaid');
  assert.equal(retried.expiresAt, draft().expiresAt);
});

test('late payment is rejected at the deadline; paid orders never expire afterward', () => {
  const waiting = transitionCheckout(draft(), { type: 'confirm' }, now);
  const expired = transitionCheckout(waiting, { type: 'paid' }, now + PAYMENT_WINDOW_MS);
  assert.equal(expired.paymentStatus, 'expired');
  assert.equal(expired.preparationStatus, null);
  assert.equal(transitionCheckout(expired, { type: 'retry' }, now + PAYMENT_WINDOW_MS), expired);
  const paid = transitionCheckout(waiting, { type: 'paid' }, now + 1000);
  assert.equal(transitionCheckout(paid, { type: 'tick' }, now + PAYMENT_WINDOW_MS * 2), paid);
  assert.equal(transitionCheckout(paid, { type: 'expire' }, now + PAYMENT_WINDOW_MS * 2), paid);
});

test('reload preserves pending/paid states and original deadline, including when the tab was idle', () => {
  const waiting = transitionCheckout(draft(), { type: 'confirm' }, now);
  const restored = restoreCheckout(JSON.stringify(waiting), now + 1000);
  assert.equal(restored?.paymentStatus, 'verifying');
  assert.equal(restored?.expiresAt, waiting.expiresAt);
  assert.equal(restoreCheckout(JSON.stringify(waiting), now + PAYMENT_WINDOW_MS)?.paymentStatus, 'expired');
  const paid = transitionCheckout(waiting, { type: 'paid' }, now + 1000);
  assert.equal(restoreCheckout(JSON.stringify(paid), now + PAYMENT_WINDOW_MS * 2)?.paymentStatus, 'paid');
  assert.equal(restoreCheckout('broken', now), null);
  assert.equal(restoreCheckout(JSON.stringify({ ...waiting, preparationStatus: 'ready' }), now), null);
});

test('preparation follows received, preparing, ready and served only after paid', () => {
  let order = transitionCheckout(transitionCheckout(draft(), { type: 'confirm' }, now), { type: 'paid' }, now);
  for (const status of ['preparing', 'ready', 'served']) {
    order = transitionCheckout(order, { type: 'advance' }, now + 1000);
    assert.equal(order.preparationStatus, status);
    assert.equal(order.paymentStatus, 'paid');
  }
  assert.equal(transitionCheckout(order, { type: 'advance' }, now + 1000), order);
});

test('pending previews saved with a 5-minute window are shortened to 3 minutes from creation', () => {
  const oldOrder = { ...draft(), expiresAt: now + 5 * 60 * 1000 };
  const restored = restoreCheckout(JSON.stringify(oldOrder), now + 120000);
  assert.equal(restored?.expiresAt, now + 180000);
  assert.equal(restored?.paymentStatus, 'unpaid');
  assert.equal(transitionCheckout(oldOrder, { type: 'tick' }, now + 180000).paymentStatus, 'expired');
  assert.equal(transitionCheckout(oldOrder, { type: 'tick' }, now + 120000).expiresAt, now + 180000);
  const waiting = transitionCheckout(draft(), { type: 'confirm' }, now);
  const paid = { ...transitionCheckout(waiting, { type: 'paid' }, now + 1000), expiresAt: now + 300000 };
  assert.equal(transitionCheckout(paid, { type: 'tick' }, now + 240000), paid);
});

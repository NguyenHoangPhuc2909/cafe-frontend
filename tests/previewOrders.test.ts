import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout } from '../src/utils/checkout.ts';
import { consumePreviewOnce, insertPreviewOrder, PREVIEW_ORDER_PREFIX, previewVersion, readPreviewOrders, removeEditablePreview, updatePreviewOrder } from '../src/utils/previewOrders.ts';
import type { PreviewStorage } from '../src/utils/previewOrders.ts';
import { belongsToStaffFilter, matchesStaffSearch } from '../src/utils/staffOrders.ts';

class MemoryStorage implements PreviewStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const now = 1792828800000;
const draft = (code = 'DEMO-01') => createCheckout([{ id: '1', productId: 1, name: 'Cà phê sữa đá', quantity: 2, price: 30000 }], 'Ít đá', { id: 7, tableName: 'Bàn 03' }, code, now);

test('two readers share the same draft, customer confirmation, Staff payment and preparation', () => {
  const storage = new MemoryStorage();
  insertPreviewOrder(storage, draft());
  const customer = readPreviewOrders(storage, now)[0];
  assert.equal(readPreviewOrders(storage, now)[0].code, customer.code);
  updatePreviewOrder(storage, customer.code, { type: 'confirm' }, now + 1000, previewVersion(customer));
  const staff = readPreviewOrders(storage, now + 1000)[0];
  assert.equal(staff.paymentStatus, 'verifying');
  assert.equal(belongsToStaffFilter(staff, 'kitchen'), false);
  updatePreviewOrder(storage, staff.code, { type: 'paid' }, now + 2000, previewVersion(staff));
  const paid = readPreviewOrders(storage, now + 2000)[0];
  assert.equal(paid.paymentStatus, 'paid');
  assert.equal(belongsToStaffFilter(paid, 'kitchen'), true);
  assert.equal(belongsToStaffFilter(paid, 'payment'), false);
  updatePreviewOrder(storage, paid.code, { type: 'advance' }, now + 3000, previewVersion(paid));
  assert.equal(readPreviewOrders(storage, now + 3000)[0].preparationStatus, 'preparing');
});

test('publishing a second customer does not overwrite existing orders or reset their state', () => {
  const storage = new MemoryStorage();
  assert.equal(insertPreviewOrder(storage, draft()), true);
  updatePreviewOrder(storage, 'DEMO-01', { type: 'confirm' }, now);
  assert.equal(insertPreviewOrder(storage, draft('DEMO-02')), true);
  assert.equal(insertPreviewOrder(storage, draft()), false);
  assert.equal(readPreviewOrders(storage, now).length, 2);
  assert.equal(readPreviewOrders(storage, now).find(order => order.code === 'DEMO-01')?.paymentStatus, 'verifying');
});

test('a stale or repeated preparation action cannot skip a stage', () => {
  const storage = new MemoryStorage();
  insertPreviewOrder(storage, draft());
  updatePreviewOrder(storage, 'DEMO-01', { type: 'confirm' }, now);
  const paid = updatePreviewOrder(storage, 'DEMO-01', { type: 'paid' }, now);
  const version = previewVersion(paid);
  updatePreviewOrder(storage, paid.code, { type: 'advance' }, now + 1000, version);
  assert.throws(() => updatePreviewOrder(storage, paid.code, { type: 'advance' }, now + 1000, version));
  assert.equal(readPreviewOrders(storage, now + 1000)[0].preparationStatus, 'preparing');
});

test('a payment confirmation at the 3-minute deadline persists expiry instead of marking paid', () => {
  const storage = new MemoryStorage();
  insertPreviewOrder(storage, draft());
  const waiting = updatePreviewOrder(storage, 'DEMO-01', { type: 'confirm' }, now);
  assert.throws(() => updatePreviewOrder(storage, waiting.code, { type: 'paid' }, now + 180000, previewVersion(waiting)));
  const expired = readPreviewOrders(storage, now + 180000)[0];
  assert.equal(expired.paymentStatus, 'expired');
  assert.equal(belongsToStaffFilter(expired, 'kitchen'), false);
  assert.equal(belongsToStaffFilter(expired, 'history'), true);
});

test('waiting or paid orders cannot be discarded by editing the customer cart', () => {
  const storage = new MemoryStorage();
  insertPreviewOrder(storage, draft());
  updatePreviewOrder(storage, 'DEMO-01', { type: 'confirm' }, now);
  assert.equal(removeEditablePreview(storage, 'DEMO-01', now), false);
  updatePreviewOrder(storage, 'DEMO-01', { type: 'paid' }, now);
  assert.equal(removeEditablePreview(storage, 'DEMO-01', now), false);
  assert.equal(readPreviewOrders(storage, now).length, 1);
});

test('cart quantities are consumed once even after repeated Staff events or reload', () => {
  const storage = new MemoryStorage();
  let quantity = 4;
  assert.equal(consumePreviewOnce(storage, 'DEMO-01', () => { quantity -= 2; }), true);
  assert.equal(consumePreviewOnce(storage, 'DEMO-01', () => { quantity -= 2; }), false);
  assert.equal(quantity, 2);
  let calls = 0;
  assert.throws(() => consumePreviewOnce(storage, 'DEMO-02', () => { throw new Error('failed'); }));
  assert.equal(consumePreviewOnce(storage, 'DEMO-02', () => { calls++; }), true);
  assert.equal(calls, 1);
});

test('corrupt rows or another storage key cannot become a Staff order', () => {
  const storage = new MemoryStorage();
  storage.setItem(PREVIEW_ORDER_PREFIX + 'bad', 'broken');
  storage.setItem('some-other-feature', JSON.stringify(draft()));
  storage.setItem(PREVIEW_ORDER_PREFIX + 'DEMO-wrong-code', JSON.stringify(draft()));
  assert.deepEqual(readPreviewOrders(storage, now), []);
});

test('Staff search handles Vietnamese names with or without accents', () => {
  const order = draft();
  assert.equal(matchesStaffSearch(order, 'ca phe sua da'), true);
  assert.equal(matchesStaffSearch(order, 'ban 03'), true);
  assert.equal(matchesStaffSearch(order, 'DEMO-01'), true);
  assert.equal(matchesStaffSearch(order, 'khong co mon nay'), false);
});

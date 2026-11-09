import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product } from '../src/types/product.ts';
import { addCartItem, cartTotals, reconcileCart, restoreCustomerCart } from '../src/utils/cart.ts';
import { buildGuestOrder, subtractSubmittedItems, isGuestOrder } from '../src/utils/guest.ts';
import { formatDrinkOptions } from '../src/utils/drinkOptions.ts';

const product: Product = { id: 12, name: 'Trà sữa', price: 30000, description: '', imageUrl: '', category: 'Trà sữa', sizes: [{ size: 'M', price: 30000 }, { size: 'L', price: 40000 }] };

test('different drink preferences stay separate while default choices merge with quick add', () => {
  let cart = addCartItem([], product);
  cart = addCartItem(cart, product, 1, 'M', { iceLevel: 'DEFAULT', sweetnessLevel: 'DEFAULT' });
  cart = addCartItem(cart, product, 1, 'M', { iceLevel: 'LESS', sweetnessLevel: 'NONE' });
  assert.deepEqual(cart.map(item => item.quantity), [2, 1]);
  assert.equal(cartTotals(cart).total, 90000);
  assert.equal(formatDrinkOptions(cart[0]), '');
  assert.equal(formatDrinkOptions(cart[1]), 'Ít đá · Không đường');
  assert.equal(subtractSubmittedItems(cart, [cart[0]])[0].sweetnessLevel, 'NONE');
});

test('reload and menu refresh keep per-item preferences and identities', () => {
  const cart = addCartItem([], product, 2, 'L', { iceLevel: 'NONE', sweetnessLevel: 'LESS' });
  const restored = restoreCustomerCart(JSON.stringify({ items: cart, note: '' })).items;
  assert.equal(restored[0].id, cart[0].id);
  assert.equal(restored[0].iceLevel, 'NONE');
  const refreshed = reconcileCart(restored, [product]);
  assert.equal(refreshed[0].sweetnessLevel, 'LESS');
  assert.equal(reconcileCart(restored, [{ ...product, sizes: [] }])[0].isAvailable, false);
});

test('payload includes per-item preferences without browser prices or duplicate default values', () => {
  let cart = addCartItem([], product);
  cart = addCartItem(cart, product, 2, 'M', { iceLevel: 'LESS', sweetnessLevel: 'NONE' });
  assert.deepEqual(buildGuestOrder(cart, ''), { note: '', items: [
    { productId: 12, quantity: 1, size: 'M' },
    { productId: 12, quantity: 2, size: 'M', iceLevel: 'LESS', sweetnessLevel: 'NONE' },
  ] });
  assert.deepEqual(addCartItem([], { ...product, sizes: [] }, 1, undefined, { iceLevel: 'LESS' }), []);
});

test('invalid preferences in storage and order responses are rejected', () => {
  const cart = addCartItem([], product);
  assert.equal(restoreCustomerCart(JSON.stringify({ items: [{ ...cart[0], iceLevel: 'MORE' }] })).items.length, 0);
  assert.throws(() => buildGuestOrder([{ ...cart[0], sweetnessLevel: 'INVALID' as never }], ''));
  const order = { id: 1, sessionId: 1, tableId: 1, tableName: 'Bàn 1', totalAmount: 30000, status: 'PENDING', paymentStatus: 'UNPAID', paymentExpiresAt: '2026-11-06T10:00:00Z', createdAt: '2026-11-06T09:00:00Z', items: [{ id: 1, productName: 'Trà sữa', quantity: 1, price: 30000, iceLevel: 'LESS', sweetnessLevel: 'NONE' }] };
  assert.equal(isGuestOrder(order), true);
  assert.equal(isGuestOrder({ ...order, items: [{ ...order.items[0], iceLevel: 'MORE' }] }), false);
});

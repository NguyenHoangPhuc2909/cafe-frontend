import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product } from '../src/types/product.ts';
import { addCartItem, cartTotals, reconcileCart, restoreCustomerCart } from '../src/utils/cart.ts';
import { buildGuestOrder, isGuestOrder, subtractSubmittedItems } from '../src/utils/guest.ts';
import { toProduct } from '../src/utils/products.ts';

const product: Product = { id: 12, name: 'Cà phê', price: 30000, description: '', imageUrl: '', category: 'Cà phê',
  sizes: [{ size: 'M', price: 30000 }, { size: 'L', price: 40000 }] };

test('M and L keep distinct quantities, server-provided prices and persisted identities', () => {
  let cart = addCartItem([], product);
  cart = addCartItem(cart, product, 2, 'L');
  cart = addCartItem(cart, product, 1, 'M');
  assert.deepEqual(cart.map(item => [item.size, item.price, item.quantity]), [['M', 30000, 2], ['L', 40000, 2]]);
  assert.equal(cartTotals(cart).total, 140000);
  assert.deepEqual(restoreCustomerCart(JSON.stringify({ items: cart, note: '' })).items.map(item => [item.id, item.size, item.quantity]), cart.map(item => [item.id, item.size, item.quantity]));
  assert.deepEqual(subtractSubmittedItems(cart, [cart[0]]).map(item => item.size), ['L']);
});

test('refresh reprices the selected size and blocks removed sizes or disabled products', () => {
  const cart = addCartItem([], product, 2, 'L');
  const refreshed = reconcileCart(cart, [{ ...product, sizes: [{ size: 'M', price: 35000 }, { size: 'L', price: 45000 }] }]);
  assert.equal(cartTotals(refreshed).total, 90000);
  assert.equal(reconcileCart(cart, [{ ...product, sizes: [] }])[0].isAvailable, false);
  assert.equal(reconcileCart(cart, [{ ...product, isActive: false }])[0].isAvailable, false);
  const legacy = reconcileCart([{ ...cart[0], id: '12', size: undefined }], [product]);
  assert.equal(legacy[0].size, 'M');
  assert.equal(legacy[0].price, 30000);
});

test('request separates sizes, merges matching lines and never sends client prices', () => {
  const m = addCartItem([], product, 1, 'M')[0];
  const l = addCartItem([], product, 2, 'L')[0];
  assert.deepEqual(buildGuestOrder([m, l, { ...l, id: 'extra', quantity: 1, price: 1 }], ''), {
    items: [{ productId: 12, quantity: 1, size: 'M' }, { productId: 12, quantity: 3, size: 'L' }], note: '',
  });
  assert.deepEqual(addCartItem([], { ...product, sizes: undefined }, 1, 'L'), []);
});

test('malformed sizes from storage, menu or order responses are rejected', () => {
  const cart = addCartItem([], product, 1, 'L');
  assert.equal(restoreCustomerCart(JSON.stringify({ items: [{ ...cart[0], size: 'XL' }] })).items.length, 0);
  const dto = { id: 12, name: 'Cà phê', price: 30000, description: null, imageUrl: null, isActive: true, categoryId: 1, categoryName: 'Cà phê' };
  assert.equal(toProduct({ ...dto, sizes: product.sizes }).sizes?.[1].price, 40000);
  assert.throws(() => toProduct({ ...dto, sizes: [{ size: 'M', price: -1 }] }));
  assert.throws(() => toProduct({ ...dto, sizes: [{ size: 'L', price: 40000 }] }));
  const order = { id: 1, sessionId: 1, tableId: 1, tableName: 'Bàn 1', totalAmount: 40000, status: 'PENDING', paymentStatus: 'UNPAID', paymentExpiresAt: '2026-11-05T10:00:00Z', createdAt: '2026-11-05T09:00:00Z', items: [{ id: 1, productName: 'Cà phê', quantity: 1, price: 40000, size: 'L' }] };
  assert.equal(isGuestOrder(order), true);
  assert.equal(isGuestOrder({ ...order, items: [{ ...order.items[0], size: 'XL' }] }), false);
});

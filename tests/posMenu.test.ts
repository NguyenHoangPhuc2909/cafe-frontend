import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPosMenu, posMenuCategories } from '../src/utils/posMenu.ts';
import { getPublicMenu } from '../src/services/products.ts';
import { http } from '../src/services/http.ts';
import { addCartItem, cartTotals, reconcileCart } from '../src/utils/cart.ts';
import type { Product } from '../src/types/product.ts';

const products: Product[] = [
  { id: 5, name: 'Cà phê sữa đá', description: 'Pha phin', price: 30000, imageUrl: '', category: 'TEST26 - Cà phê', isActive: true },
  { id: 8, name: 'Trà đào cam sả', description: 'Trà trái cây', price: 40000, imageUrl: '', category: 'TEST26 - Trà trái cây', isActive: true },
  { id: 18, name: 'Nước suối', description: '', price: 15000, imageUrl: '', category: 'TEST26 - Đóng chai', isActive: true },
  { id: 25, name: 'Món tạm ngừng', description: '', price: 25000, imageUrl: '', category: 'TEST26 - Đóng chai', isActive: false },
];

test('POS categories and counts come from exact category names returned by BE', () => {
  assert.deepEqual(posMenuCategories(products).map(category => [category.label, category.count]), [
    ['TEST26 - Cà phê', 1], ['TEST26 - Trà trái cây', 1], ['TEST26 - Đóng chai', 1],
  ]);
  assert.deepEqual(filterPosMenu(products, 'TEST26 - Cà phê', '').map(product => product.id), [5]);
  assert.equal(filterPosMenu(products, null, '').length, 3);
  assert.deepEqual(posMenuCategories([]), []);
});

test('POS search handles Vietnamese accents and respects the selected category', () => {
  assert.deepEqual(filterPosMenu(products, null, 'ca phe sua da').map(product => product.id), [5]);
  assert.deepEqual(filterPosMenu(products, null, 'TRA DAO').map(product => product.id), [8]);
  assert.deepEqual(filterPosMenu(products, 'TEST26 - Cà phê', 'tra dao'), []);
  assert.deepEqual(filterPosMenu(products, null, 'tam ngung'), []);
});

test('a DB-priced basket totals 100000 VND and refresh updates price or disables missing dishes', () => {
  let cart = addCartItem([], products[0]);
  cart = addCartItem(cart, products[1]);
  cart = addCartItem(cart, products[2], 2);
  assert.equal(cartTotals(cart).total, 100000);
  const refreshed = reconcileCart(cart, [{ ...products[0], price: 35000 }, products[2]]);
  assert.equal(refreshed.find(item => item.productId === 5)?.price, 35000);
  assert.equal(refreshed.find(item => item.productId === 8)?.isAvailable, false);
  assert.equal(refreshed.find(item => item.productId === 18)?.quantity, 2);
});

test('public menu integration preserves database IDs/prices and normalizes nullable fields', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const controller = new AbortController();
  http.defaults.adapter = async config => {
    assert.equal(config.url, '/products');
    assert.equal(config.method, 'get');
    assert.equal(config.signal, controller.signal);
    assert.equal(config.headers.get('Authorization'), undefined);
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: [
      { id: 123, name: 'Nước chai DB', price: 17000, description: null, imageUrl: null, categoryId: null, categoryName: 'Đóng chai', isActive: true },
    ] } };
  };
  const menu = await getPublicMenu(controller.signal);
  assert.equal(menu[0].id, 123);
  assert.equal(menu[0].price, 17000);
  assert.equal(menu[0].description, '');
  assert.equal(menu[0].imageUrl, '/images/product-placeholder.svg');
  assert.equal(menu[0].category, 'Đóng chai');
});

test('menu errors are surfaced instead of returning mock products', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {}, data: { success: false, message: 'failed' } });
  await assert.rejects(getPublicMenu());
  http.defaults.adapter = async () => { throw new Error('offline'); };
  await assert.rejects(getPublicMenu(), /offline/);
});

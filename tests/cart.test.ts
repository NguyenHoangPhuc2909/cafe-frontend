import test from 'node:test';
import assert from 'node:assert/strict';
import { addCartItem, cartTotals, changeCartQuantity, reconcileCart, restoreCustomerCart } from '../src/utils/cart.ts';
import { PRODUCT_PLACEHOLDER, toProduct } from '../src/utils/products.ts';
import type { Product } from '../src/types/product.ts';

const product: Product = {
  id: 1, name: 'Nước chai', price: 15000, description: '', imageUrl: '', category: 'Nước uống',
};

test('tổng tiền bằng đơn giá nhân số lượng, không cộng phụ thu', () => {
  assert.deepEqual(cartTotals(addCartItem([], product, 2)), { subtotal: 30000, total: 30000, itemCount: 2 });
  const cart = addCartItem(addCartItem([], { ...product, price: 0.1 }), { ...product, id: 2, price: 0.2 });
  assert.equal(cartTotals(cart).total, 0.3);
});

test('gộp đúng sản phẩm, giữ ID gốc và tách dòng tùy chọn POS', () => {
  let cart = addCartItem([], product);
  cart = addCartItem(cart, { ...product, id: 10 });
  cart = addCartItem(cart, product, 2);
  cart = addCartItem(cart, { ...product, price: 25000 }, 1, 'Size L');
  assert.deepEqual(cart.map(item => [item.productId, item.quantity, item.price]), [[1, 3, 15000], [10, 1, 15000], [1, 1, 25000]]);
  assert.equal(new Set(cart.map(item => item.id)).size, 3);
});

test('giới hạn số lượng và bỏ dòng khi giảm về 0', () => {
  const cart = addCartItem([], product, 100);
  assert.equal(cart[0].quantity, 99);
  assert.equal(changeCartQuantity(cart, '1', 1)[0].quantity, 99);
  assert.deepEqual(changeCartQuantity(cart, '1', -99), []);
  assert.deepEqual(addCartItem([], product, -1), []);
  assert.deepEqual(addCartItem([], product, 1.5), []);
});

test('cập nhật giá và đánh dấu ngừng bán khi tải lại menu', () => {
  const cart = addCartItem([], product, 2);
  const refreshed = reconcileCart(cart, [{ ...product, price: 17000 }]);
  assert.equal(cartTotals(refreshed).total, 34000);
  assert.equal(refreshed[0].quantity, 2);
  assert.equal(reconcileCart(cart, [])[0].isAvailable, false);
  assert.equal(reconcileCart(cart, [{ ...product, isActive: false }])[0].isAvailable, false);
  assert.equal(cart[0].price, 15000);
});

test('khôi phục giỏ an toàn khi dữ liệu lưu hỏng, trùng hoặc sai số lượng', () => {
  assert.deepEqual(restoreCustomerCart('{broken'), { items: [], note: '' });
  assert.deepEqual(restoreCustomerCart(null), { items: [], note: '' });
  const valid = { productId: 1, name: 'Nước chai', price: 15000, quantity: 2 };
  const restored = restoreCustomerCart(JSON.stringify({ items: [valid, valid,
    { ...valid, productId: 2, quantity: 0 }, { ...valid, productId: 3, price: -1 },
    { ...valid, productId: '4' }, { ...valid, productId: 5, quantity: 100 }], note: 'Ít lạnh' }));
  assert.deepEqual(restored.items.map(item => [item.id, item.productId, item.quantity]), [['1', 1, 2], ['5', 5, 99]]);
  assert.equal(restored.note, 'Ít lạnh');
});

test('chuyển DTO BE có ảnh/mô tả/danh mục null và từ chối giá hoặc ID sai', () => {
  const dto = { id: 1, name: ' Nước chai ', price: 15000, imageUrl: null,
    description: null, categoryId: null, categoryName: null, isActive: true };
  const result = toProduct(dto);
  assert.equal(result.id, 1);
  assert.equal(result.name, 'Nước chai');
  assert.equal(result.imageUrl, PRODUCT_PLACEHOLDER);
  assert.equal(result.description, '');
  assert.equal(result.category, 'Danh mục khác');
  assert.throws(() => toProduct({ ...dto, price: -1 }));
  assert.throws(() => toProduct({ ...dto, id: 0 }));
});

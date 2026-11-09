import test from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError, AxiosHeaders } from 'axios';
import { getStaffProducts, updateProductActive } from '../src/services/staffProducts.ts';
import { http } from '../src/services/http.ts';

const product = { id: 12, name: 'Cà phê sữa', price: 30000, description: null,
  imageUrl: null, categoryId: 1, categoryName: 'Cà phê', isActive: false };

test('staff menu includes disabled products and uses the authenticated endpoint', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const controller = new AbortController();
  http.defaults.adapter = async config => {
    assert.equal(config.method, 'get');
    assert.equal(config.url, '/staff/products');
    assert.equal(config.headers.get('Authorization'), 'Bearer staff-token');
    assert.equal(config.signal, controller.signal);
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: [product] } };
  };
  const menu = await getStaffProducts('staff-token', controller.signal);
  assert.equal(menu.length, 1);
  assert.equal(menu[0].isActive, false);
});

test('toggle sends an explicit boolean and validates the server-confirmed product', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  for (const active of [true, false]) {
    http.defaults.adapter = async config => {
      assert.equal(config.method, 'patch');
      assert.equal(config.url, '/staff/products/12/active');
      assert.equal(config.headers.get('Authorization'), 'Bearer admin-token');
      assert.deepEqual(JSON.parse(config.data), { active });
      return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: { ...product, isActive: active } } };
    };
    assert.equal((await updateProductActive('admin-token', 12, active)).isActive, active);
  }
});

test('malformed or mismatched responses never confirm a successful toggle', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  for (const data of [null, product, { ...product, id: 99, isActive: true }]) {
    http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data } });
    await assert.rejects(updateProductActive('staff-token', 12, true));
  }
  for (const data of [[{ ...product, isActive: null }], [product, product]]) {
    http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data } });
    await assert.rejects(getStaffProducts('staff-token'));
  }
});

test('permission errors and network failures are surfaced without retrying the mutation', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  for (const status of [401, 403]) {
    let requests = 0;
    http.defaults.adapter = async config => {
      requests++;
      throw new AxiosError('denied', undefined, config, undefined, {
        config, status, statusText: 'Denied', headers: new AxiosHeaders(), data: { message: 'Không có quyền' },
      });
    };
    await assert.rejects(updateProductActive('staff-token', 12, true));
    assert.equal(requests, 1);
  }
  http.defaults.adapter = async () => { throw new Error('offline'); };
  await assert.rejects(getStaffProducts('staff-token'), /offline/);
});

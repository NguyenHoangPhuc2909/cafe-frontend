import test from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../src/services/http.ts';
import { deleteAdminIngredient, getAdminIngredients, saveAdminIngredient } from '../src/services/adminIngredients.ts';

const item = { id: 3, name: 'Sữa', unit: 'ml', stockQuantity: 100, minThreshold: 20,
  systemManaged: false, unitEditable: false, deletable: false };

test('ingredient management keeps server stock and restrictions, sends only metadata with admin credentials', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const calls: string[] = [];
  http.defaults.adapter = async config => {
    assert.equal(config.headers.get('Authorization'), 'Bearer admin-token');
    calls.push(`${config.method} ${config.url}`);
    if (config.method === 'put' || config.method === 'post')
      assert.deepEqual(JSON.parse(config.data), { name: 'Sữa', unit: 'ml', minThreshold: 20 });
    return { config, status: config.method === 'post' ? 201 : 200, statusText: 'OK', headers: {},
      data: { success: true, data: config.method === 'get' ? [item] : config.method === 'delete' ? null : item } };
  };
  assert.deepEqual(await getAdminIngredients('admin-token'), [item]);
  const input = { name: ' Sữa ', unit: ' ml ', minThreshold: 20, stockQuantity: 999, code: 'CUP_M' };
  assert.equal((await saveAdminIngredient('admin-token', input)).stockQuantity, 100);
  assert.equal((await saveAdminIngredient('admin-token', input, 3)).unitEditable, false);
  await deleteAdminIngredient('admin-token', 3);
  assert.deepEqual(calls, ['get /admin/ingredients/management', 'post /admin/ingredients', 'put /admin/ingredients/3', 'delete /admin/ingredients/3']);
});

test('malformed stock or permissions and mismatched update results cannot confirm success', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  for (const invalid of [{ ...item, stockQuantity: -1 }, { ...item, minThreshold: Infinity }, { ...item, deletable: undefined }]) {
    http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: [invalid] } });
    await assert.rejects(getAdminIngredients('admin-token'), /hợp lệ/);
  }
  http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: { ...item, id: 4 } } });
  await assert.rejects(saveAdminIngredient('admin-token', item, 3), /Chưa xác nhận/);
});

test('deletion conflicts and network failures surface without retrying', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  let calls = 0;
  http.defaults.adapter = async config => {
    calls++;
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: false, message: 'Nguyên liệu đang được sử dụng' } };
  };
  await assert.rejects(deleteAdminIngredient('admin-token', 3), /đang được sử dụng/);
  assert.equal(calls, 1);
  http.defaults.adapter = async () => { calls++; throw new Error('Mất kết nối'); };
  await assert.rejects(saveAdminIngredient('admin-token', item), /Mất kết nối/);
  assert.equal(calls, 2);
});

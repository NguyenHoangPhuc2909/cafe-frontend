import test from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../src/services/http.ts';
import { deleteAdminCategory, saveAdminCategory } from '../src/services/adminCategories.ts';

test('category mutations use admin credentials and preserve identity when renaming', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const calls: string[] = [];
  http.defaults.adapter = async config => {
    assert.equal(config.headers.get('Authorization'), 'Bearer admin-token');
    calls.push(`${config.method} ${config.url}`);
    if (config.method !== 'delete') assert.deepEqual(JSON.parse(config.data), { name: 'Trà' });
    return { config, status: config.method === 'post' ? 201 : 200, statusText: 'OK', headers: {},
      data: { success: true, data: config.method === 'delete' ? null : { id: 3, name: 'Trà' } } };
  };
  assert.equal((await saveAdminCategory('admin-token', ' Trà ')).id, 3);
  assert.equal((await saveAdminCategory('admin-token', 'Trà', 3)).id, 3);
  await deleteAdminCategory('admin-token', 3);
  assert.deepEqual(calls, ['post /admin/categories', 'put /admin/categories/3', 'delete /admin/categories/3']);
});

test('rejected or unreadable mutations never report success', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {},
    data: { success: false, message: 'Danh mục đang có món' } });
  await assert.rejects(deleteAdminCategory('admin-token', 3), /Danh mục đang có món/);
  await assert.rejects(saveAdminCategory('admin-token', 'Trà'), /Danh mục đang có món/);
  http.defaults.adapter = async config => ({ config, status: 201, statusText: 'Created', headers: {},
    data: { success: true, data: { id: -1, name: 'Trà' } } });
  await assert.rejects(saveAdminCategory('admin-token', 'Trà'), /Chưa xác nhận/);
});

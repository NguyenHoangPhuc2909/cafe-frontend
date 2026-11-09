import test from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../src/services/http.ts';
import { getPersonalRevenue } from '../src/services/staffRevenue.ts';

test('personal revenue sends no staff identifier or browser date and keeps server totals across pages', async t => {
  const previous = http.defaults.adapter;
  http.defaults.adapter = async config => {
    assert.equal(config.headers.get('Authorization'), 'Bearer token');
    assert.equal(config.url, '/staff/revenue/today'); assert.deepEqual(config.params, { page: 2, size: 20 });
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: {
      totalAmount: 900000, methods: [], payments: { content: [], totalElements: 45 },
    } } };
  };
  t.after(() => { http.defaults.adapter = previous; });
  assert.equal((await getPersonalRevenue('token', 2)).totalAmount, 900000);
});

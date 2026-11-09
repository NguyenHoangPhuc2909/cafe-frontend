import test from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../src/services/http.ts';
import { getStocktakePreview, saveStocktake } from '../src/services/staffStocktakes.ts';
import { getPersonalRevenue } from '../src/services/staffRevenue.ts';

test('stocktake uses the Staff token, preserves zero/unchecked and retries the same request identifier', async t => {
  const previous = http.defaults.adapter;
  const requests: unknown[] = [];
  http.defaults.adapter = async config => {
    assert.equal(config.headers.get('Authorization'), 'Bearer token');
    if (config.method === 'get') assert.equal(config.url, '/staff/inventory/stocktakes/preview');
    else { assert.equal(config.url, '/staff/inventory/stocktakes'); requests.push(JSON.parse(config.data)); }
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: config.method === 'get' ? [] : { id: 1, items: [] } } };
  };
  t.after(() => { http.defaults.adapter = previous; });
  await getStocktakePreview('token');
  const request = { requestId: 'same-request', note: '', items: [
    { ingredientId: 1, productId: null, expectedQuantity: 10, actualQuantity: 0, note: '' },
    { ingredientId: null, productId: 2, expectedQuantity: 5, actualQuantity: null, note: '' },
  ] };
  await saveStocktake('token', request); await saveStocktake('token', request);
  assert.deepEqual(requests, [request, request]);
});

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

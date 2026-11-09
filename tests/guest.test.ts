import test from 'node:test';
import assert from 'node:assert/strict';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { buildGuestOrder, isGuestOrder, restoreOrderAttempt, restoreTableAccess, subtractSubmittedItems, selectGuestOrder } from '../src/utils/guest.ts';
import { createGuestOrder, getGuestOrders, getGuestSession, getTable, grantTableAccess, guestErrorMessage, isOrderDefinitelyRejected } from '../src/services/guest.ts';
import { http } from '../src/services/http.ts';
import type { CartItem } from '../src/types/cart.ts';
import type { GuestOrderResponse, OrderAttempt, TableAccess } from '../src/types/guest.ts';

const access: TableAccess = { sessionId: 7, tableId: 3, tableName: 'Bàn 03', accessToken: 'test-only-token', expiresAt: '2026-10-24T12:00:00Z' };
const session = { id: 7, tableId: 3, tableName: 'Bàn 03', status: 'OPEN', openedAt: '2026-10-24T10:00:00', closedAt: null };
const item: CartItem = { id: '11:row', productId: 11, name: 'Nước chai', quantity: 2, price: 1, isAvailable: true };
const order: GuestOrderResponse = {
  id: 9, sessionId: 7, tableId: 3, tableName: 'Bàn 03', totalAmount: 30000, status: 'PENDING', paymentStatus: 'UNPAID',
  paymentExpiresAt: '2026-10-24T10:05:00Z', createdAt: '2026-10-24T17:00:00',
  items: [{ id: 20, productName: 'Nước chai', quantity: 2, price: 15000 }],
};

test('opening a QR link without an order renders an empty checkout safely', () => {
  assert.equal(selectGuestOrder(undefined, null, [], null, null), null);
  assert.equal(selectGuestOrder(undefined, 7, [], null, null), null);
  assert.equal(selectGuestOrder(9, 7, [], null, null), null);
});

test('order selection uses the requested order in the current session only', () => {
  const second = { ...order, id: 10 };
  assert.equal(selectGuestOrder(9, 7, [second, order], null, second), order);
  assert.equal(selectGuestOrder(9, 7, [], order, null), order);
  assert.equal(selectGuestOrder(9, 7, [], null, order), order);
  assert.equal(selectGuestOrder(9, 8, [order], order, order), null);
});

test('payload uses productId and quantity only, merges rows, trims note, ignores browser prices', () => {
  const request = buildGuestOrder([item, { ...item, id: '11:other', quantity: 1 }], '  ít đá  ');
  assert.deepEqual(request, { items: [{ productId: 11, quantity: 3 }], note: 'ít đá' });
  assert.equal(buildGuestOrder([item], 'x'.repeat(700)).note.length, 500);
});

test('rejects empty carts, unavailable items, options unsupported by BE and invalid quantities', () => {
  for (const items of [[], [{ ...item, isAvailable: false }], [{ ...item, options: 'Size L' }],
    [{ ...item, productId: 0 }], [{ ...item, quantity: 1.5 }], [{ ...item, quantity: 2147483648 }]]) {
    assert.throws(() => buildGuestOrder(items, ''));
  }
});

test('successful submission consumes the sent quantities while preserving later additions', () => {
  assert.deepEqual(subtractSubmittedItems([item], [item]), []);
  const current = [{ ...item, quantity: 3 }, { ...item, id: '12', productId: 12 }];
  assert.deepEqual(subtractSubmittedItems(current, [item]).map(value => [value.productId, value.quantity]), [[11, 1], [12, 2]]);
});

test('corrupt session storage is ignored; an expired token is retained only for BE revalidation', () => {
  assert.equal(restoreTableAccess('{bad'), null);
  assert.equal(restoreTableAccess(JSON.stringify({ ...access, accessToken: '' })), null);
  assert.deepEqual(restoreTableAccess(JSON.stringify(access)), access);
});

test('reload during a POST restores an unresolved attempt instead of sending again', () => {
  const pending: OrderAttempt = { state: 'sending', tableName: access.tableName, sessionId: 7, startedAt: '2026-10-24T10:00:00Z' };
  assert.deepEqual(restoreOrderAttempt(JSON.stringify(pending)), { ...pending, state: 'unknown' });
  assert.equal(restoreOrderAttempt('broken'), null);
  assert.equal(restoreOrderAttempt(JSON.stringify({ ...pending, state: 'success', order: { id: 9 } })), null);
  assert.equal(restoreOrderAttempt(JSON.stringify({ ...pending, state: 'success', order }))?.order?.totalAmount, 30000);
  assert.equal(restoreOrderAttempt(JSON.stringify({ ...pending, state: 'success', order: { ...order, sessionId: 8 } })), null);
});

test('invalid success data cannot be displayed as a confirmed order', () => {
  assert.equal(isGuestOrder(order), true);
  assert.equal(isGuestOrder({ ...order, totalAmount: NaN }), false);
  assert.equal(isGuestOrder({ ...order, paymentExpiresAt: 'bad' }), false);
  assert.equal(isGuestOrder({ ...order, items: [] }), false);
});

test('API integration uses the guest header, exact paths and BE totals without an account JWT', async t => {
  const previous = http.defaults.adapter;
  const requests: { method?: string; url?: string; body: unknown }[] = [];
  t.after(() => { http.defaults.adapter = previous; });
  http.defaults.adapter = async config => {
    requests.push({ method: config.method, url: config.url, body: config.data ? JSON.parse(config.data) : null });
    if (config.url?.startsWith('/guest/')) {
      assert.equal(config.headers.get('X-Table-Session-Token'), access.accessToken);
      assert.equal(config.headers.get('Authorization'), undefined);
    } else {
      assert.equal(config.headers.get('X-Table-Session-Token'), undefined);
    }
    const payload = config.url?.endsWith('/access') ? access
      : config.url === '/guest/session' ? session
        : config.url === '/guest/orders' ? order
          : { id: 3, name: 'Bàn 03', qrCode: 'qr-test', active: true };
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: payload } };
  };
  assert.equal((await getTable('qr-test')).isActive, true);
  assert.deepEqual(await grantTableAccess('qr-test'), access);
  assert.deepEqual(await getGuestSession(access), session);
  const response = await createGuestOrder(access, buildGuestOrder([item], 'Ghi chú'));
  assert.equal(response.totalAmount, 30000);
  assert.deepEqual(requests.map(value => [value.method, value.url]), [
    ['get', '/public/tables/qr-test'], ['post', '/public/tables/qr-test/access'], ['get', '/guest/session'], ['post', '/guest/orders'],
  ]);
  assert.deepEqual(requests[3].body, { items: [{ productId: 11, quantity: 2 }], note: 'Ghi chú' });
});

test('session and order responses must belong to the selected table and session', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  for (const payload of [{ ...session, status: 'CLOSED' }, { ...session, tableId: 4 }, { ...session, id: 8 }]) {
    http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: payload } });
    await assert.rejects(getGuestSession(access));
  }
  http.defaults.adapter = async config => ({ config, status: 201, statusText: 'Created', headers: {}, data: { success: true, data: { ...order, sessionId: 8 } } });
  await assert.rejects(createGuestOrder(access, buildGuestOrder([item], '')));
});

test('only definite 4xx rejections permit a retry; timeouts, 5xx and malformed success remain uncertain', () => {
  const config = { headers: new AxiosHeaders() };
  for (const status of [400, 401, 404, 409, 429]) {
    const error = new AxiosError('rejected', undefined, config, undefined, { status, statusText: '', headers: {}, config, data: { message: 'Không đủ hàng' } });
    assert.equal(isOrderDefinitelyRejected(error), true);
    assert.equal(guestErrorMessage(error), 'Không đủ hàng');
  }
  for (const status of [408, 500, 502, 503]) {
    const error = new AxiosError('unknown', undefined, config, undefined, { status, statusText: '', headers: {}, config, data: {} });
    assert.equal(isOrderDefinitelyRejected(error), false);
  }
  assert.equal(isOrderDefinitelyRejected(new AxiosError('timeout', axios.AxiosError.ECONNABORTED)), false);
  assert.equal(isOrderDefinitelyRejected(new Error('invalid success')), false);
});

test('two unpaid orders in the same session remain separately retrievable after reload', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const created: GuestOrderResponse[] = [];
  http.defaults.adapter = async config => {
    assert.equal(config.url, '/guest/orders');
    assert.equal(config.headers.get('X-Table-Session-Token'), access.accessToken);
    assert.equal(config.headers.get('Authorization'), undefined);
    if (config.method === 'post') {
      created.unshift({ ...order, id: 100 + created.length });
      return { config, status: 201, statusText: 'Created', headers: {}, data: { success: true, data: created[0] } };
    }
    assert.deepEqual(config.params, { page: 0, size: 20 });
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: {
      content: created, page: 0, size: 20, totalElements: 2, totalPages: 1, last: true,
    } } };
  };
  const first = await createGuestOrder(access, buildGuestOrder([item], ''));
  const second = await createGuestOrder(access, buildGuestOrder([item], ''));
  const history = await getGuestOrders(access);
  assert.notEqual(first.id, second.id);
  assert.equal(first.paymentStatus, 'UNPAID');
  assert.deepEqual(history.content.map(value => value.id), [second.id, first.id]);
  assert.equal(history.content[1].paymentExpiresAt, first.paymentExpiresAt);
});

test('guest history rejects orders from a different session or table', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  for (const invalid of [{ ...order, sessionId: 8 }, { ...order, tableId: 4 }]) {
    http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {},
      data: { success: true, data: {
        content: [invalid], page: 0, size: 20, totalElements: 1, totalPages: 1, last: true,
      } },
    });
    await assert.rejects(getGuestOrders(access), /Danh sách đơn của phiên bàn chưa hợp lệ/);
  }
});

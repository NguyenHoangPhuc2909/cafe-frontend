import test from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError, AxiosHeaders } from 'axios';
import { filterStaffTables, restoreStaffSession, tableState, toStaffSession, toStaffTable } from '../src/utils/staffTables.ts';
import { getStaffCurrentSession, getStaffTableOverview, getStaffTables, openStaffTableSession, signInStaff } from '../src/services/staffApi.ts';
import { http } from '../src/services/http.ts';
import type { StaffTableOverview } from '../src/types/staffApi.ts';

const table = { id: 3, name: 'Bàn 03', qrCode: 'qr-03', active: true };
const session = { id: 7, tableId: 3, tableName: 'Bàn 03', status: 'OPEN', openedAt: '2026-10-25T09:00:00', closedAt: null };

test('Staff session only retains account token, username and an allowed role', () => {
  const value = { accessToken: 'fake-test-token', username: 'staff', role: 'STAFF', password: 'do-not-save' };
  assert.deepEqual(toStaffSession(value), { accessToken: 'fake-test-token', username: 'staff', role: 'STAFF' });
  assert.equal(restoreStaffSession('broken'), null);
  assert.equal(restoreStaffSession(JSON.stringify({ ...value, role: 'CUSTOMER' })), null);
  assert.equal(restoreStaffSession(JSON.stringify(value))?.username, 'staff');
});

test('table flags normalize active/isActive and errors never become idle tables', () => {
  assert.equal(toStaffTable(table).isActive, true);
  assert.equal(toStaffTable({ ...table, active: undefined, isActive: false }).isActive, false);
  assert.throws(() => toStaffTable({ ...table, id: 0 }));
  const rows: StaffTableOverview[] = [
    { table: toStaffTable(table), session: null, sessionError: null },
    { table: toStaffTable({ ...table, id: 4, name: 'Bàn sân vườn' }), session: null, sessionError: 'offline' },
    { table: toStaffTable({ ...table, id: 5, active: false }), session: null, sessionError: null },
    { table: toStaffTable({ ...table, id: 6 }), session: { ...session, tableId: 6, status: 'OPEN' }, sessionError: null },
  ];
  assert.deepEqual(rows.map(tableState), ['idle', 'unknown', 'inactive', 'open']);
  assert.equal(filterStaffTables(rows, 'idle', '').length, 1);
  assert.equal(filterStaffTables(rows, 'all', 'san vuon')[0].table.id, 4);
});

test('login and Staff APIs use separate account authentication and preserve the password exactly', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const calls: string[] = [];
  http.defaults.adapter = async config => {
    calls.push(config.method + ' ' + config.url);
    if (config.url === '/auth/login') {
      assert.deepEqual(JSON.parse(config.data), { username: 'staff', password: ' password with spaces ' });
      assert.equal(config.headers.get('Authorization'), undefined);
    } else {
      assert.equal(config.headers.get('Authorization'), 'Bearer fake-test-token');
      assert.equal(config.headers.get('X-Table-Session-Token'), undefined);
    }
    const payload = config.url === '/auth/login' ? { accessToken: 'fake-test-token', username: 'staff', role: 'STAFF' }
      : config.url === '/staff/tables' ? [table] : session;
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: payload } };
  };
  const account = await signInStaff(' staff ', ' password with spaces ');
  assert.equal((await getStaffTables(account.accessToken))[0].id, 3);
  assert.equal((await getStaffCurrentSession(account.accessToken, 3))?.id, 7);
  assert.equal((await openStaffTableSession(account.accessToken, 3)).id, 7);
  assert.deepEqual(calls, ['post /auth/login', 'get /staff/tables', 'get /staff/tables/3/sessions/current', 'post /staff/tables/3/sessions']);
});

test('only the documented no-open-session 404 is treated as an idle table', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  for (const message of ['Bàn chưa có phiên phục vụ đang mở', 'Không tìm thấy bàn']) {
    http.defaults.adapter = async config => { throw new AxiosError('404', undefined, config, undefined, { config, status: 404, statusText: 'Not Found', headers: {}, data: { message } }); };
    if (message.startsWith('Bàn chưa')) assert.equal(await getStaffCurrentSession('fake-test-token', 3), null);
    else await assert.rejects(getStaffCurrentSession('fake-test-token', 3));
  }
});

test('overview skips inactive tables and retains unknown state when an individual session fails', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  const calls: string[] = [];
  http.defaults.adapter = async config => {
    calls.push(config.url ?? '');
    if (config.url === '/staff/tables') return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: [table, { ...table, id: 4 }, { ...table, id: 5, active: false }] } };
    if (config.url?.includes('/3/')) throw new AxiosError('404', undefined, config, undefined, { config, status: 404, statusText: '', headers: {}, data: { message: 'Bàn chưa có phiên phục vụ đang mở' } });
    throw new Error('connection lost');
  };
  const rows = await getStaffTableOverview('fake-test-token');
  assert.deepEqual(rows.map(tableState), ['idle', 'unknown', 'inactive']);
  assert.equal(calls.some(url => url.includes('/5/')), false);
});

test('duplicate table IDs, mismatched sessions and denied access cannot become valid map data', async t => {
  const previous = http.defaults.adapter;
  t.after(() => { http.defaults.adapter = previous; });
  http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: [table, table] } });
  await assert.rejects(getStaffTables('fake-test-token'));
  http.defaults.adapter = async config => ({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: { ...session, tableId: 99 } } });
  await assert.rejects(getStaffCurrentSession('fake-test-token', 3));
  http.defaults.adapter = async () => { const config = { headers: new AxiosHeaders() }; throw new AxiosError('denied', undefined, config, undefined, { config, status: 403, statusText: '', headers: {}, data: {} }); };
  await assert.rejects(getStaffTableOverview('fake-test-token'));
});

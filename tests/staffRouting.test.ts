import test from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError, AxiosHeaders } from 'axios';
import { staffReturnPath } from '../src/utils/staffRouting.ts';
import { isCurrentStaffAuthFailure } from '../src/services/staffApi.ts';

test('login returns to the requested Staff page including filters and hash', () => {
  for (const path of ['/staff', '/staff/pos', '/staff/tables', '/staff/orders?session=7#detail', '/staff/history?status=paid']) {
    assert.equal(staffReturnPath(path), path);
  }
});

test('login return paths cannot escape Staff routes or loop back to login', () => {
  for (const path of [undefined, null, {}, '', 'https://elsewhere.test/staff', '//elsewhere.test/staff',
    '/staffing', '/cart', '/staff/../../cart', '/staff\\orders', '/staff/orders\n',
    '/staff/login', '/staff/LOGIN/?from=pos', '/staff/login//', '/staff/%6cogin', '/staff/%broken']) {
    assert.equal(staffReturnPath(path), '/staff/orders', String(path));
  }
});

function failure(url: string, token: string, status = 401) {
  const config = { url, headers: new AxiosHeaders({ Authorization: `Bearer ${token}` }) };
  return new AxiosError('request failed', undefined, config, undefined,
    { config, status, statusText: '', headers: {}, data: {} });
}

test('only a current-token Staff auth failure requests logout', () => {
  assert.equal(isCurrentStaffAuthFailure(failure('/staff/tables', 'current'), 'current'), true);
  assert.equal(isCurrentStaffAuthFailure(failure('/staff/tables/3/sessions', 'current', 403), 'current'), true);
  assert.equal(isCurrentStaffAuthFailure(failure('/staff/tables', 'old'), 'current'), false);
  assert.equal(isCurrentStaffAuthFailure(failure('/auth/login', 'current'), 'current'), false);
  assert.equal(isCurrentStaffAuthFailure(failure('/products', 'current', 403), 'current'), false);
  assert.equal(isCurrentStaffAuthFailure(failure('/guest/sessions/7', 'current'), 'current'), false);
  assert.equal(isCurrentStaffAuthFailure(failure('/staff/tables', 'current', 500), 'current'), false);
  assert.equal(isCurrentStaffAuthFailure(new AxiosError('offline'), 'current'), false);
  assert.equal(isCurrentStaffAuthFailure(new Error('offline'), 'current'), false);
});

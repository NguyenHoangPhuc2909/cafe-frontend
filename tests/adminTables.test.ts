import test from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../src/services/http.ts';
import {
  deleteAdminTable,
  getAdminTables,
  saveAdminTable,
  updateAdminTableStatus,
} from '../src/services/adminTables.ts';

const sampleTable = {
  id: 1,
  name: 'Bàn 01',
  qrCode: 'stable-qr-uuid-01',
  isActive: true,
  hasOpenSession: false,
  openSessionId: null,
  hasSessionHistory: true,
  canDeactivate: true,
  deletable: false,
};

test('admin table CRUD uses admin credentials, sends only name/status and preserves qrCode', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  const calls: string[] = [];
  http.defaults.adapter = async (config) => {
    assert.equal(config.headers.get('Authorization'), 'Bearer admin-token');
    calls.push(`${config.method} ${config.url}`);

    if (config.method === 'post' || config.method === 'put') {
      assert.deepEqual(JSON.parse(config.data), { name: 'Bàn 01 mới' });
    }
    if (config.method === 'patch') {
      assert.deepEqual(JSON.parse(config.data), { isActive: false });
    }

    const data =
      config.method === 'get'
        ? [sampleTable]
        : config.method === 'delete'
          ? null
          : config.method === 'patch'
            ? { ...sampleTable, isActive: false }
            : { ...sampleTable, name: 'Bàn 01 mới' };

    return {
      config,
      status: config.method === 'post' ? 201 : 200,
      statusText: 'OK',
      headers: {},
      data: { success: true, data },
    };
  };

  assert.deepEqual(await getAdminTables('admin-token'), [sampleTable]);
  const created = await saveAdminTable('admin-token', { name: '  Bàn 01 mới  ' });
  assert.equal(created.qrCode, 'stable-qr-uuid-01');
  const renamed = await saveAdminTable('admin-token', { name: ' Bàn 01 mới ' }, 1);
  assert.equal(renamed.qrCode, 'stable-qr-uuid-01');
  const toggled = await updateAdminTableStatus('admin-token', 1, false);
  assert.equal(toggled.isActive, false);
  await deleteAdminTable('admin-token', 1);

  assert.deepEqual(calls, [
    'get /admin/tables',
    'post /admin/tables',
    'put /admin/tables/1',
    'patch /admin/tables/1/status',
    'delete /admin/tables/1',
  ]);
});

test('malformed table payloads and mismatched mutation results are rejected', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  const invalidRows = [
    { ...sampleTable, id: 0 },
    { ...sampleTable, name: '   ' },
    { ...sampleTable, qrCode: '' },
    { ...sampleTable, hasOpenSession: true, openSessionId: null },
    { ...sampleTable, deletable: undefined },
  ];

  for (const invalid of invalidRows) {
    http.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: true, data: [invalid] },
    });
    await assert.rejects(getAdminTables('admin-token'), /chưa hợp lệ/);
  }

  http.defaults.adapter = async (config) => ({
    config,
    status: 200,
    statusText: 'OK',
    headers: {},
    data: { success: true, data: { ...sampleTable, id: 2 } },
  });
  await assert.rejects(saveAdminTable('admin-token', { name: 'Bàn 01' }, 1), /Chưa xác nhận/);

  http.defaults.adapter = async (config) => ({
    config,
    status: 200,
    statusText: 'OK',
    headers: {},
    data: { success: true, data: { ...sampleTable, isActive: true } },
  });
  await assert.rejects(updateAdminTableStatus('admin-token', 1, false), /Chưa xác nhận/);
});

test('table conflicts and network errors surface without retrying', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  let calls = 0;
  http.defaults.adapter = async (config) => {
    calls++;
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: false, message: 'Bàn đang có phiên phục vụ đang mở' },
    };
  };
  await assert.rejects(deleteAdminTable('admin-token', 1), /phiên phục vụ/);
  assert.equal(calls, 1);

  http.defaults.adapter = async () => {
    calls++;
    throw new Error('Mất kết nối máy chủ');
  };
  await assert.rejects(updateAdminTableStatus('admin-token', 1, false), /Mất kết nối/);
  assert.equal(calls, 2);
});

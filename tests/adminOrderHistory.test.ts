import test from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../src/services/http.ts';
import { getAdminCompletedOrders } from '../src/services/adminOrders.ts';
import { getVietnamToday, isIsoDate, shiftIsoDate } from '../src/utils/adminOrderDates.ts';

const completedOrder = {
  id: 501,
  sessionId: 5,
  tableId: 1,
  tableName: 'Bàn 01',
  orderType: 'DINE_IN' as const,
  totalAmount: 35000,
  status: 'COMPLETED' as const,
  paymentStatus: 'PAID' as const,
  paymentExpiresAt: null,
  createdAt: '2026-11-15T23:59:59',
  items: [{ id: 901, productName: 'Cà phê sữa', quantity: 1, price: 35000 }],
};

test('admin order history sends admin JWT, date bounds, sessionId and pagination', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  let capturedParams: Record<string, unknown> | undefined;
  http.defaults.adapter = async (config) => {
    assert.equal(config.method, 'get');
    assert.equal(config.url, '/admin/orders');
    assert.equal(config.headers.get('Authorization'), 'Bearer admin-token');
    capturedParams = config.params;
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        success: true,
        data: {
          content: [completedOrder],
          page: 1,
          size: 20,
          totalElements: 21,
          totalPages: 2,
          last: true,
        },
      },
    };
  };

  const page = await getAdminCompletedOrders('admin-token', {
    fromDate: '2026-11-10',
    toDate: '2026-11-15',
    sessionId: 5,
    page: 1,
    size: 20,
  });

  assert.deepEqual(capturedParams, {
    fromDate: '2026-11-10',
    toDate: '2026-11-15',
    sessionId: 5,
    page: 1,
    size: 20,
  });
  assert.equal(page.totalElements, 21);
  assert.equal(page.content[0].status, 'COMPLETED');
});

test('admin order history rejects non-completed or malformed server payloads', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  for (const badOrder of [
    { ...completedOrder, status: 'PENDING' },
    { ...completedOrder, status: 'PREPARING' },
    { ...completedOrder, status: 'EXPIRED' },
    { ...completedOrder, totalAmount: -1 },
    { ...completedOrder, id: 0 },
  ]) {
    http.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        success: true,
        data: {
          content: [badOrder],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          last: true,
        },
      },
    });
    await assert.rejects(getAdminCompletedOrders('admin-token'), /chưa hợp lệ/);
  }
});

test('admin order date utilities handle Vietnam timezone and calendar shifts', () => {
  // 2026-11-15T17:30:00Z is already 2026-11-16 00:30 in Asia/Ho_Chi_Minh (+07:00)
  assert.equal(getVietnamToday(new Date('2026-11-15T17:30:00Z')), '2026-11-16');
  assert.equal(shiftIsoDate('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftIsoDate('2026-01-01', -1), '2025-12-31');
  assert.equal(isIsoDate('2026-11-24'), true);
  assert.equal(isIsoDate('2026-02-30'), false);
  assert.equal(isIsoDate('invalid'), false);
});

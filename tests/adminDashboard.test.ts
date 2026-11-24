import test from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../src/services/http.ts';
import { getAdminDashboardSummary } from '../src/services/adminDashboard.ts';

const sampleSummary = {
  businessDate: '2026-11-24',
  timeZone: 'Asia/Ho_Chi_Minh',
  generatedAt: '2026-11-24T05:00:00Z',
  todayRevenue: {
    totalRevenue: 125000,
    completedPaymentCount: 2,
    cashRevenue: 55000,
    bankTransferRevenue: 70000,
  },
  todayOrders: {
    total: 6,
    pending: 1,
    preparing: 2,
    completed: 2,
    expired: 1,
  },
  tables: {
    total: 8,
    activeTotal: 7,
    openCount: 3,
    idleCount: 4,
    inactiveCount: 1,
  },
  lowStock: {
    lowIngredientCount: 1,
    outOfStockIngredientCount: 1,
    outOfStockPackagedCount: 0,
    totalAlerts: 2,
    items: [
      {
        itemType: 'INGREDIENT' as const,
        id: 2,
        name: 'Bột cacao',
        unit: 'g',
        stockQuantity: 0,
        minThreshold: 100,
        outOfStock: true,
      },
    ],
  },
  recentRevenue: [
    { date: '2026-11-24', revenue: 125000, paymentCount: 2 },
  ],
};

test('admin dashboard fetches aggregate summary with admin JWT', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  http.defaults.adapter = async (config) => {
    assert.equal(config.method, 'get');
    assert.equal(config.url, '/admin/dashboard');
    assert.equal(config.headers.get('Authorization'), 'Bearer admin-token');
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: true, data: sampleSummary },
    };
  };

  const result = await getAdminDashboardSummary('admin-token');
  assert.equal(result.todayRevenue.totalRevenue, 125000);
  assert.equal(result.tables.openCount, 3);
  assert.equal(result.lowStock.totalAlerts, 2);
});

test('admin dashboard rejects malformed metrics or alert items', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  const invalidCases = [
    { ...sampleSummary, businessDate: 'invalid' },
    { ...sampleSummary, todayRevenue: { ...sampleSummary.todayRevenue, totalRevenue: -5 } },
    { ...sampleSummary, tables: { ...sampleSummary.tables, openCount: -1 } },
    {
      ...sampleSummary,
      lowStock: {
        ...sampleSummary.lowStock,
        items: [{ ...sampleSummary.lowStock.items[0], itemType: 'OTHER' }],
      },
    },
  ];

  for (const invalid of invalidCases) {
    http.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: true, data: invalid },
    });
    await assert.rejects(getAdminDashboardSummary('admin-token'), /chưa hợp lệ/);
  }
});

test('admin dashboard surfaces error without retrying', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  let calls = 0;
  http.defaults.adapter = async () => {
    calls++;
    throw new Error('Không thể kết nối máy chủ');
  };
  await assert.rejects(getAdminDashboardSummary('admin-token'), /kết nối/);
  assert.equal(calls, 1);
});

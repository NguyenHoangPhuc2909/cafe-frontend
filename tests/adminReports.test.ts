import test from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../src/services/http.ts';
import { getAdminRevenueReport } from '../src/services/adminReports.ts';
import { defaultGranularity, groupDailyRevenue } from '../src/utils/adminReportGrouping.ts';

const sampleReport = {
  fromDate: '2026-11-20',
  toDate: '2026-11-22',
  timeZone: 'Asia/Ho_Chi_Minh',
  generatedAt: '2026-11-24T05:00:00Z',
  totalRevenue: 150000,
  paymentCount: 3,
  averageOrderValue: 50000,
  methods: [
    { method: 'CASH', amount: 110000, paymentCount: 2 },
    { method: 'BANK_TRANSFER', amount: 40000, paymentCount: 1 },
  ],
  daily: [
    { date: '2026-11-20', revenue: 90000, cashRevenue: 50000, bankTransferRevenue: 40000, paymentCount: 2 },
    { date: '2026-11-21', revenue: 0, cashRevenue: 0, bankTransferRevenue: 0, paymentCount: 0 },
    { date: '2026-11-22', revenue: 60000, cashRevenue: 60000, bankTransferRevenue: 0, paymentCount: 1 },
  ],
  topProducts: [
    { productId: 1, productName: 'Cà phê sữa đá', quantitySold: 3, revenue: 105000 },
  ],
};

test('admin revenue report sends admin JWT and date query params', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  let capturedParams: Record<string, unknown> | undefined;
  http.defaults.adapter = async (config) => {
    assert.equal(config.method, 'get');
    assert.equal(config.url, '/admin/reports/revenue');
    assert.equal(config.headers.get('Authorization'), 'Bearer admin-token');
    capturedParams = config.params;
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: true, data: sampleReport },
    };
  };

  const result = await getAdminRevenueReport('admin-token', {
    fromDate: '2026-11-20',
    toDate: '2026-11-22',
    topLimit: 10,
  });

  assert.deepEqual(capturedParams, {
    fromDate: '2026-11-20',
    toDate: '2026-11-22',
    topLimit: 10,
  });
  assert.equal(result.totalRevenue, 150000);
  assert.equal(result.daily[1].revenue, 0);
  assert.equal(result.topProducts[0].productName, 'Cà phê sữa đá');
});

test('admin revenue report rejects malformed totals, daily points or top products', async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  const invalidReports = [
    { ...sampleReport, totalRevenue: -10 },
    { ...sampleReport, paymentCount: 1.5 },
    { ...sampleReport, daily: [{ ...sampleReport.daily[0], date: '2026-02-31' }] },
    { ...sampleReport, methods: [{ method: 'UNKNOWN', amount: 0, paymentCount: 0 }] },
    { ...sampleReport, topProducts: [{ productId: 0, productName: 'A', quantitySold: 1, revenue: 1000 }] },
  ];

  for (const invalid of invalidReports) {
    http.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: true, data: invalid },
    });
    await assert.rejects(getAdminRevenueReport('admin-token'), /chưa hợp lệ/);
  }
});

test('admin revenue report surfaces backend errors and network failure without retrying', async (t) => {
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
      data: { success: false, message: 'Khoảng ngày báo cáo không hợp lệ' },
    };
  };
  await assert.rejects(getAdminRevenueReport('admin-token'), /không hợp lệ/);
  assert.equal(calls, 1);

  http.defaults.adapter = async () => {
    calls++;
    throw new Error('Mất kết nối máy chủ');
  };
  await assert.rejects(getAdminRevenueReport('admin-token'), /Mất kết nối/);
  assert.equal(calls, 2);
});

test('daily revenue grouping aggregates by week and month and can hide zero entries', () => {
  assert.equal(defaultGranularity(7), 'day');
  assert.equal(defaultGranularity(24), 'week');
  assert.equal(defaultGranularity(120), 'month');

  const multi = [
    { date: '2026-11-01', revenue: 0, cashRevenue: 0, bankTransferRevenue: 0, paymentCount: 0 },
    { date: '2026-11-09', revenue: 300000, cashRevenue: 220000, bankTransferRevenue: 80000, paymentCount: 4 },
    { date: '2026-11-10', revenue: 50000, cashRevenue: 50000, bankTransferRevenue: 0, paymentCount: 1 },
    { date: '2026-12-02', revenue: 100000, cashRevenue: 0, bankTransferRevenue: 100000, paymentCount: 2 },
  ];

  const nonZeroDays = groupDailyRevenue(multi, 'day', true);
  assert.equal(nonZeroDays.length, 3);

  const weeks = groupDailyRevenue(multi, 'week', false);
  assert.equal(weeks.length, 3);
  assert.equal(weeks[1].revenue, 350000);
  assert.equal(weeks[1].paymentCount, 5);

  const months = groupDailyRevenue(multi, 'month', true);
  assert.equal(months.length, 2);
  assert.equal(months[0].label, '11/2026');
  assert.equal(months[0].revenue, 350000);
  assert.equal(months[1].label, '12/2026');
  assert.equal(months[1].revenue, 100000);
});

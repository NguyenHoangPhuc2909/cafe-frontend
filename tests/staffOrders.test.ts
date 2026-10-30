import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { OrderResponse } from '../src/types/order.ts';
import type { PaymentMethod } from '../src/types/payment.ts';
import {
  getStaffOrders,
  getStaffOrder,
  confirmStaffPayment,
} from '../src/services/staffApi.ts';
import { http } from '../src/services/http.ts';

const token = 'staff-test-token';

const order: OrderResponse = {
  id: 10,
  sessionId: 7,
  tableId: 3,
  tableName: 'Bàn 03',
  totalAmount: 30000,
  status: 'PENDING',
  paymentStatus: 'UNPAID',
  paymentExpiresAt: '2026-10-30T16:03:00Z',
  createdAt: '2026-10-30T23:00:00',
  items: [{
    id: 20,
    productName: 'Nước chai',
    quantity: 2,
    price: 15000,
    toppingNames: null,
  }],
};

const page = {
  content: [order],
  page: 0,
  size: 1,
  totalElements: 3,
  totalPages: 3,
  last: false,
};

const payment = {
  id: 100,
  orderId: order.id,
  method: 'CASH',
  amount: 30000,
  paidAt: '2026-10-30T16:01:00Z',
  confirmedById: 4,
};

function mockApi(
  t: TestContext,
  reply: (config: InternalAxiosRequestConfig) => unknown,
) {
  const previous = http.defaults.adapter;

  http.defaults.adapter = async config => ({
    config,
    status: 200,
    statusText: 'OK',
    headers: {},
    data: {
      success: true,
      message: 'OK',
      data: reply(config),
    },
  });

  t.after(() => {
    http.defaults.adapter = previous;
  });
}

test('danh sách gửi đúng bộ lọc, token Staff và giữ tổng số từ BE', async t => {
  mockApi(t, config => {
    assert.equal(config.method, 'get');
    assert.equal(config.url, '/staff/orders');
    assert.equal(config.headers.get('Authorization'), `Bearer ${token}`);
    assert.equal(config.headers.get('X-Table-Session-Token'), undefined);
    assert.deepEqual(config.params, {
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      sessionId: 7,
      page: 0,
      size: 1,
    });

    return page;
  });

  const result = await getStaffOrders(token, {
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    sessionId: 7,
    page: 0,
    size: 1,
  });

  assert.equal(result.content.length, 1);
  assert.equal(result.totalElements, 3);
});

test('chi tiết Staff đọc được đơn không gắn phiên bàn', async t => {
  const legacyOrder = {
    ...order,
    sessionId: null,
    tableId: null,
    tableName: null,
    paymentExpiresAt: null,
  };

  mockApi(t, config => {
    assert.equal(config.url, `/staff/orders/${order.id}`);
    assert.equal(config.headers.get('Authorization'), `Bearer ${token}`);
    return legacyOrder;
  });

  assert.deepEqual(
    await getStaffOrder(token, order.id),
    legacyOrder,
  );
});

test('CASH và BANK_TRANSFER chỉ gửi phương thức, nhận số tiền từ BE', async t => {
  let expectedMethod: PaymentMethod = 'CASH';

  mockApi(t, config => {
    assert.equal(config.method, 'post');
    assert.equal(config.url, `/staff/orders/${order.id}/payments`);
    assert.equal(config.headers.get('Authorization'), `Bearer ${token}`);
    assert.deepEqual(JSON.parse(config.data), {
      method: expectedMethod,
    });

    return { ...payment, method: expectedMethod };
  });

  for (const method of ['CASH', 'BANK_TRANSFER'] as const) {
    expectedMethod = method;

    const result = await confirmStaffPayment(token, order.id, method);

    assert.equal(result.method, method);
    assert.equal(result.amount, payment.amount);
    assert.equal(result.orderId, order.id);
  }
});

test('phản hồi danh sách sai không được coi là danh sách hợp lệ', async t => {
  mockApi(t, () => ({ ...page, content: null }));

  await assert.rejects(
    getStaffOrders(token),
    /Danh sách đơn trả về không hợp lệ/,
  );
});

test('Payment của đơn khác không được báo thành công', async t => {
  mockApi(t, () => ({ ...payment, orderId: 999 }));

  await assert.rejects(
    confirmStaffPayment(token, order.id, 'CASH'),
    /Chưa xác nhận được kết quả thanh toán/,
  );
});

test('lỗi 409 được trả lại và không tự gửi thanh toán thêm lần nữa', async t => {
  let calls = 0;

  mockApi(t, config => {
    calls += 1;

    throw new AxiosError(
      'Payment expired',
      'ERR_BAD_REQUEST',
      config,
      undefined,
      {
        config,
        status: 409,
        statusText: 'Conflict',
        headers: {},
        data: {
          success: false,
          message: 'Đơn hàng đã quá hạn thanh toán',
        },
      },
    );
  });

  await assert.rejects(
    confirmStaffPayment(token, order.id, 'CASH'),
    error => error instanceof AxiosError
      && error.response?.status === 409,
  );

  assert.equal(calls, 1);
});
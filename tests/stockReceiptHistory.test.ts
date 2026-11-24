import test from "node:test";
import assert from "node:assert/strict";
import { http } from "../src/services/http.ts";
import { getStaffReceiptHistory } from "../src/services/staffInventory.ts";

const sampleReceipt = {
  id: 101,
  type: "RECEIPT" as const,
  ingredientId: 3,
  productId: null,
  itemName: "Cà phê hạt",
  unit: "g",
  quantityDelta: 500,
  availableBefore: 200,
  availableAfter: 700,
  performedById: 10,
  performedByName: "Nguyễn Văn A",
  note: "Nhập ca sáng",
  createdAt: "2026-11-15T01:30:00Z",
};

test("receipt history sends filters including performedById with auth header and allows null unit", async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  const packagedReceipt = {
    ...sampleReceipt,
    id: 102,
    ingredientId: null,
    productId: 6,
    itemName: "Nước suối",
    unit: null,
    quantityDelta: 12,
    availableBefore: 8,
    availableAfter: 20,
    performedById: 11,
    performedByName: "staff_b",
  };

  let capturedParams: Record<string, unknown> | undefined;
  http.defaults.adapter = async (config) => {
    assert.equal(config.method, "get");
    assert.equal(config.url, "/staff/inventory/receipts");
    assert.equal(config.headers.get("Authorization"), "Bearer admin-token");
    capturedParams = config.params;

    return {
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: {
        success: true,
        data: {
          content: [sampleReceipt, packagedReceipt],
          page: 1,
          size: 20,
          totalElements: 22,
          totalPages: 2,
          last: true,
        },
      },
    };
  };

  const result = await getStaffReceiptHistory("admin-token", 1, 20, undefined, {
    fromDate: "2026-11-10",
    toDate: "2026-11-15",
    ingredientId: 3,
    performedById: 10,
  });

  assert.deepEqual(capturedParams, {
    page: 1,
    size: 20,
    fromDate: "2026-11-10",
    toDate: "2026-11-15",
    ingredientId: 3,
    productId: undefined,
    performedById: 10,
  });
  assert.equal(result.totalElements, 22);
  assert.equal(result.content.length, 2);
  assert.equal(result.content[1].unit, null);
});

test("receipt history rejects malformed server payloads and inconsistent stock rows", async (t) => {
  const previous = http.defaults.adapter;
  t.after(() => {
    http.defaults.adapter = previous;
  });

  const invalidRows = [
    { ...sampleReceipt, id: 0 },
    { ...sampleReceipt, type: "STOCKTAKE_ADJUSTMENT" },
    { ...sampleReceipt, ingredientId: null, productId: null },
    { ...sampleReceipt, ingredientId: 3, productId: 6 },
    { ...sampleReceipt, quantityDelta: 0 },
    { ...sampleReceipt, availableBefore: 500, availableAfter: 400 },
    { ...sampleReceipt, performedById: -1 },
    { ...sampleReceipt, performedByName: "   " },
    { ...sampleReceipt, createdAt: "not-a-date" },
  ];

  for (const row of invalidRows) {
    http.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: {
        success: true,
        data: { content: [row], page: 0, size: 20, totalElements: 1, totalPages: 1, last: true },
      },
    });
    await assert.rejects(getStaffReceiptHistory("admin-token"), /chưa hợp lệ/);
  }

  http.defaults.adapter = async (config) => ({
    config,
    status: 200,
    statusText: "OK",
    headers: {},
    data: {
      success: true,
      data: { content: [sampleReceipt], page: 0, size: 20, totalElements: -1, totalPages: 1, last: true },
    },
  });
  await assert.rejects(getStaffReceiptHistory("admin-token"), /chưa hợp lệ/);
});

test("receipt history surfaces backend rejection and network failure without retrying", async (t) => {
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
      statusText: "OK",
      headers: {},
      data: { success: false, message: "Bộ lọc lịch sử nhập kho không hợp lệ" },
    };
  };
  await assert.rejects(getStaffReceiptHistory("admin-token"), /không hợp lệ/);
  assert.equal(calls, 1);

  http.defaults.adapter = async () => {
    calls++;
    throw new Error("Mất kết nối máy chủ");
  };
  await assert.rejects(getStaffReceiptHistory("admin-token"), /Mất kết nối máy chủ/);
  assert.equal(calls, 2);
});

import { useEffect, useState } from "react";
import { Alert, Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { PageResponse } from "../../types/api";
import type { StockMovementResponse } from "../../types/inventory";
import { getStaffReceiptHistory } from "../../services/staffInventory";
import { staffErrorMessage } from "../../services/staffApi";
import StockReceiptFilters from "./StockReceiptFilters";
import type { Ingredient, PackagedStock } from "../../services/staffInventory";
import type { StockReceiptHistoryFilters } from "../../types/inventory";

interface Props {
  token: string;
  refreshVersion: number;
  ingredients: Ingredient[];
  packaged: PackagedStock[];
}

interface Result {
  token: string;
  page: number;
  version: number;
  retry: number;
  data: PageResponse<StockMovementResponse> | null;
  error: string | null;
  filters: StockReceiptHistoryFilters;
}

const PAGE_SIZE = 20;

const columns: ColumnsType<StockMovementResponse> = [
  {
    title: "Mã phiếu",
    dataIndex: "id",
    render: (id: number) => `#${id}`,
  },
  {
    title: "Thời gian",
    dataIndex: "createdAt",
    render: (value: string) =>
      new Date(value).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
  },
  {
    title: "Mặt hàng",
    dataIndex: "itemName",
  },
  {
    title: "Số lượng nhập",
    dataIndex: "quantityDelta",
    render: (value: number, row) =>
      `+${value.toLocaleString("vi-VN")} ${row.unit}`,
  },
  {
    title: "Tồn trước",
    dataIndex: "availableBefore",
    render: (value: number, row) =>
      `${value.toLocaleString("vi-VN")} ${row.unit}`,
  },
  {
    title: "Tồn sau",
    dataIndex: "availableAfter",
    render: (value: number, row) =>
      `${value.toLocaleString("vi-VN")} ${row.unit}`,
  },
  {
    title: "Người nhập",
    dataIndex: "performedByName",
  },
  {
    title: "Ghi chú",
    dataIndex: "note",
    render: (value: string) => (
      <span className="whitespace-pre-wrap break-words">{value}</span>
    ),
  },
];

export default function StockReceiptHistory({
  token,
  refreshVersion,
  ingredients,
  packaged,
}: Props) {
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [filters, setFilters] = useState<StockReceiptHistoryFilters>({});

  useEffect(() => {
    const controller = new AbortController();

    getStaffReceiptHistory(token, page, PAGE_SIZE, controller.signal, filters)
      .then((data) => {
        if (controller.signal.aborted) return;

        setResult({
          token,
          page,
          version: refreshVersion,
          retry,
          data,
          error: null,
          filters,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setResult({
          token,
          page,
          version: refreshVersion,
          retry,
          data: null,
          error: staffErrorMessage(error),
          filters,
        });
      });

    return () => controller.abort();
  }, [token, page, refreshVersion, retry, filters]);

  const current =
    result?.token === token &&
    result.page === page &&
    result.version === refreshVersion &&
    result.retry === retry &&
    result?.filters === filters ? result : null;

  return (
    <section aria-label="Lịch sử nhập kho">
      <StockReceiptFilters
        ingredients={ingredients}
        packaged={packaged}
        onApply={(nextFilters) => {
          setPage(0);
          setFilters(nextFilters);
        }}
      />
      {current?.error ? (
        <Alert
          type="error"
          showIcon
          title={current.error}
          action={
            <Button onClick={() => setRetry((value) => value + 1)}>
              Thử lại
            </Button>
          }
        />
      ) : (
        <Table<StockMovementResponse>
          rowKey="id"
          columns={columns}
          dataSource={current?.data?.content ?? []}
          loading={!current}
          scroll={{ x: 1100 }}
          locale={{ emptyText: "Chưa có lịch sử nhập kho." }}
          pagination={{
            current: page + 1,
            pageSize: PAGE_SIZE,
            total: current?.data?.totalElements ?? 0,
            showSizeChanger: false,
            onChange: (nextPage) => setPage(nextPage - 1),
          }}
        />
      )}
    </section>
  );
}

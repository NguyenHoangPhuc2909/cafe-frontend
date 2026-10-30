import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import { useStaffOrders } from "../../hooks/useStaffOrders";
import type { OrderResponse } from "../../types/order";
import type { StaffOrderQuery } from "../../types/staffApi";
import StaffPaymentPanel from "../../components/staff/StaffPaymentPanel";
import { formatCurrency } from "../../utils/format";
import CheckoutSummary from "../../components/common/CheckoutSummary";

type Filter = "all" | "unpaid" | "paid" | "expired";
type ViewMode = "orders" | "kitchen" | "history";

function paymentLabel(order: OrderResponse) {
  if (order.status === "EXPIRED") return "Hết hạn";
  if (order.paymentStatus === "PAID") return "Đã thanh toán";
  if (order.paymentStatus === "REFUNDED") return "Đã hoàn tiền";
  return "Chưa thanh toán";
}

export default function StaffOrdersPage({
  mode = "orders",
}: {
  mode?: ViewMode;
}) {
  const kitchen = mode === "kitchen";
  const history = mode === "history";
  const { session } = useStaffAuth();
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;

  const rawSession = Number(params.get("session"));
  const sessionId =
    Number.isSafeInteger(rawSession) && rawSession > 0 ? rawSession : undefined;

  const rawFilter = params.get("filter");
  const filter: Filter = kitchen
    ? "paid"
    : rawFilter === "all" ||
        rawFilter === "paid" ||
        rawFilter === "expired" ||
        rawFilter === "unpaid"
      ? rawFilter
      : history
        ? "all"
        : "unpaid";

  const query: StaffOrderQuery = { page, size: 20, sessionId };

  if (filter === "unpaid") {
    query.status = "PENDING";
    query.paymentStatus = "UNPAID";
  } else if (filter === "paid") {
    query.paymentStatus = "PAID";
  } else if (filter === "expired") {
    query.status = "EXPIRED";
  }

  if (kitchen) query.status = "PENDING";

  const { data, isLoading, error, reload } = useStaffOrders(session, query);
  const paymentChanged = (message: string, success: boolean) => {
    setNotice({ message, success });
    reload();
  };

  const orders = data?.content ?? [];
  const selected =
    orders.find((order) => order.id === selectedId) ?? orders[0] ?? null;

  const changeFilter = (value: string) => {
    const next = new URLSearchParams(params);
    next.set("filter", value);
    next.delete("page");
    setSelectedId(null);
    setParams(next);
  };

  const changePage = (value: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(value));
    setSelectedId(null);
    setParams(next);
  };

  const clearSession = () => {
    const next = new URLSearchParams(params);
    next.delete("session");
    next.delete("page");
    setSelectedId(null);
    setParams(next);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F6F2EE] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-primary">
            {history
              ? "Lịch sử đơn hàng"
              : kitchen
                ? "Đơn chờ chuẩn bị"
                : "Quản lý đơn hàng"}
          </h1>

          <Link
            to={mode === "orders" ? "/staff/kds" : "/staff/orders"}
            className="min-h-11 content-center font-semibold text-primary underline"
          >
            {mode === "orders" ? "Xem đơn đã nhận tiền" : "Về quản lý đơn"}
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!kitchen && (
            <label className="flex items-center gap-3 text-sm">
              Trạng thái
              <select
                value={filter}
                onChange={(event) => changeFilter(event.target.value)}
                className="min-h-11 rounded-xl border border-outline-variant bg-surface px-3"
              >
                <option value="unpaid">Chờ thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="expired">Hết hạn</option>
                <option value="all">Tất cả</option>
              </select>
            </label>
          )}

          <button
            type="button"
            onClick={reload}
            disabled={isLoading}
            className="min-h-11 rounded-xl border border-primary px-4 font-semibold text-primary disabled:opacity-40"
          >
            {isLoading ? "Đang tải…" : "Tải lại"}
          </button>

          {sessionId !== undefined && (
            <button
              type="button"
              onClick={clearSession}
              className="min-h-11 text-sm text-primary underline"
            >
              Phiên #{sessionId} · Xem tất cả phiên
            </button>
          )}
        </div>

        {notice && (
          <p
            role={notice.success ? "status" : "alert"}
            className="mt-4 rounded-xl bg-surface-container p-4 text-sm"
          >
            {notice.message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-error-container/30 p-4 text-error"
          >
            {error}
          </p>
        )}

        {data && (
          <p className="mt-4 text-sm text-on-surface-variant">
            {data.totalElements} đơn phù hợp
          </p>
        )}

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-2">
          <section aria-label="Danh sách đơn" className="space-y-3">
            {isLoading && <p role="status">Đang cập nhật danh sách…</p>}

            {!isLoading && !error && orders.length === 0 && (
              <p className="rounded-2xl bg-surface p-6">
                Chưa có đơn trong mục này.
              </p>
            )}

            {orders.map((order) => (
              <button
                type="button"
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                aria-pressed={selected?.id === order.id}
                className={`w-full rounded-2xl border bg-surface p-4 text-left ${
                  selected?.id === order.id
                    ? "border-primary ring-1 ring-primary"
                    : "border-outline-variant/40"
                }`}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>Đơn #{order.id}</strong>
                  <span className="text-sm">{paymentLabel(order)}</span>
                </div>

                <p className="mt-2 text-sm text-secondary">
                  {order.tableName ?? "Không gắn bàn"}
                </p>

                <p className="mt-2 text-sm text-on-surface-variant">
                  {order.items
                    .map((item) => `${item.quantity} × ${item.productName}`)
                    .join(" · ") || "Chưa có món"}
                </p>

                <p className="mt-3 font-bold text-primary">
                  {formatCurrency(order.totalAmount)}
                </p>
              </button>
            ))}

            <nav
              aria-label="Phân trang"
              className="flex items-center justify-between gap-3 pt-3"
            >
              <button
                type="button"
                disabled={page === 0 || isLoading}
                onClick={() => changePage(page - 1)}
                className="min-h-11 px-3 font-semibold text-primary disabled:opacity-40"
              >
                Trang trước
              </button>

              <span className="text-sm">Trang {page + 1}</span>

              <button
                type="button"
                disabled={!data || data.last || isLoading}
                onClick={() => changePage(page + 1)}
                className="min-h-11 px-3 font-semibold text-primary disabled:opacity-40"
              >
                Trang sau
              </button>
            </nav>
          </section>

          <aside aria-label="Chi tiết đơn" className="xl:sticky xl:top-0">
            {selected ? (
              mode === "orders" ? (
                <StaffPaymentPanel
                  key={selected.id}
                  order={selected}
                  onChanged={paymentChanged}
                />
              ) : (
                <CheckoutSummary order={selected} />
              )
            ) : (
              <p className="rounded-2xl bg-surface p-6 text-sm">
                Chọn một đơn để xem chi tiết.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

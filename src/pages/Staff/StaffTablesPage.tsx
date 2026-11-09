import { Drawer, Grid, Popconfirm } from 'antd';
import Icon from '../../components/ui/Icon';
import { Skeleton, TablesSkeleton } from "../../components/ui/Skeleton";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import { useStaffTables } from "../../hooks/useStaffTables";
import { filterStaffTables, tableState } from "../../utils/staffTables";
import type { StaffTableFilter } from "../../types/staffApi";
import {
  closeStaffTableSession,
  staffErrorMessage,
} from "../../services/staffApi";
import { useStaffOrders } from "../../hooks/useStaffOrders";

const states = {
  open: {
    title: "Đang phục vụ",
    color: "border-primary bg-primary/5",
    badge: "bg-green-50 text-green-800",
    icon: "restaurant",
  },
  idle: {
    title: "Bàn trống",
    color: "border-outline-variant/40 bg-surface",
    badge: "bg-surface-container text-on-surface-variant",
    icon: "table_restaurant",
  },
  inactive: {
    title: "Ngừng sử dụng",
    color: "border-error/20 bg-error-container/10",
    badge: "bg-error-container text-error",
    icon: "block",
  },
  unknown: {
    title: "Chưa xác định",
    color: "border-secondary/40 bg-secondary-fixed/20",
    badge: "bg-secondary-fixed text-on-secondary-container",
    icon: "help",
  },
};

export default function StaffTablesPage() {
  const screens = Grid.useBreakpoint();
  const desktop = !!screens.lg;
  const [detailOpen, setDetailOpen] = useState(false);
  const { session, signOut } = useStaffAuth();
  const { rows, error, accessDenied, isLoading, reload } =
    useStaffTables(session);
  const [filter, setFilter] = useState<StaffTableFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const closing = useRef(false);
  const visible = filterStaffTables(rows, filter, query);
  const selected =
    visible.find((row) => row.table.id === selectedId) ?? visible[0] ?? null;
  const {
    data: sessionOrders,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useStaffOrders(selected?.session ? session : null, {
    sessionId: selected?.session?.id,
    page: 0,
    size: 1,
  });

  const close = async () => {
    if (!session || !selected?.session || closing.current || isLoading) return;
    closing.current = true;
    setIsClosing(true);
    setNotice('');
    try {
      await closeStaffTableSession(session.accessToken, selected.table.id, selected.session.id);
      setNotice(`Đã kết thúc phiên #${selected.session.id} của ${selected.table.name}. Bàn sẵn sàng đón lượt khách mới.`);
    } catch (cause) {
      setNotice(`${staffErrorMessage(cause)} Sơ đồ sẽ được tải lại để đối chiếu kết quả.`);
    } finally {
      closing.current = false;
      setIsClosing(false);
      reload();
    }
  };

  const details = selected ? <div className="table-detail-body">
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                      Chi tiết bàn
                    </p>
                    <h2 className="mt-2 break-words text-2xl font-bold text-primary">
                      {selected.table.name}
                    </h2>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      {states[tableState(selected)].title}
                    </p>
                    {selected.sessionError && (
                      <p
                        role="alert"
                        className="mt-4 rounded-xl bg-error-container/30 p-3 text-sm text-error"
                      >
                        {selected.sessionError} Chưa thể kết luận bàn không có
                        phiên.
                      </p>
                    )}
                    {selected.session && (
                      <>
                        <p className="mt-4 text-sm">
                          Phiên đang mở: <strong>#{selected.session.id}</strong>
                        </p>
                        <dl className="mt-4 rounded-xl bg-surface-container-low p-4 text-sm">
                          <div className="flex justify-between gap-3">
                            <dt>Số đơn trong phiên</dt>
                            <dd className="font-semibold">
                              {isLoadingOrders
                                ? "Đang tải…"
                                : sessionOrders
                                  ? sessionOrders.totalElements
                                  : "—"}
                            </dd>
                          </div>
                        </dl>

                        {ordersError && (
                          <p
                            role="alert"
                            className="mt-3 rounded-xl bg-error-container/30 p-3 text-sm text-error"
                          >
                            {ordersError}
                          </p>
                        )}
                        <Link
                          to={`/staff/orders?session=${selected.session.id}`}
                          className="mt-4 flex min-h-control items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
                        >
                          Xem đơn trong phiên
                        </Link>
                        <Link
                          to={`/staff/history?session=${selected.session.id}`}
                          className="mt-2 flex min-h-control items-center justify-center rounded-xl border border-primary px-4 text-sm font-semibold text-primary"
                        >
                          Lịch sử phiên hiện tại
                        </Link>
                        <div className="mt-5 border-t border-outline-variant/30 pt-4">
                          <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">
                            Kết thúc phiên sau khi khách rời bàn. Các đơn phải hoàn thành hoặc đã hết hạn.
                          </p>
                          <Popconfirm title={`Kết thúc phiên của ${selected.table.name}?`}
                            description="Xác nhận khách đã rời bàn. Quyền đặt món của phiên này sẽ kết thúc."
                            okText="Khách đã rời bàn" cancelText="Quay lại"
                            onConfirm={close} disabled={isClosing || isLoading}>
                            <button type="button" disabled={isClosing || isLoading}
                              className="ui-button w-full border-error/30 text-error">
                              {isClosing ? 'Đang kết thúc phiên…' : 'Kết thúc phiên'}
                            </button>
                          </Popconfirm>
                        </div>
                      </>
                    )}
                    {tableState(selected) === "idle" && (
                      <div className="mt-5">
                        <p className="text-sm leading-relaxed text-on-surface-variant">
                          Khách quét QR và xác nhận bàn để bắt đầu đặt món. Phiên phục vụ sẽ tự mở khi khách xác nhận.
                        </p>
                      </div>
                    )}
                    {selected.table.isActive && (
                      <Link
                        to={`/table/${encodeURIComponent(selected.table.qrCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 flex min-h-control items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold text-primary"
                      >
                        <span
                          aria-hidden="true"
                          className="icon-slot text-xl"
                        ><Icon name="qr_code_2" /></span>
                        Mở trang QR của bàn
                      </Link>
                    )}
                    <p className="mt-4 text-xs leading-relaxed text-on-surface-variant">
                      BE chưa có API đóng phiên. Đơn mẫu phục vụ xong không tự
                      làm phiên thật của bàn đóng lại.
                    </p>
  </div> : null;

  return (
    <div className="staff-page-scroll h-full">
      <div className="staff-page-content">
        <div className="staff-page-heading">
          <div>
            <h1 className="ui-page-title">
              Sơ đồ bàn
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Tra cứu bàn, phiên đang mở và các đơn trong phiên.
            </p>
          </div>
        </div>
        <>
          <div className="table-filter-list">
            {(
              [
                "all",
                "open",
                "idle",
                "inactive",
                "unknown",
              ] as StaffTableFilter[]
            ).map((state) => (
              <button
                type="button"
                key={state}
                aria-pressed={filter === state}
                onClick={() => {
                  setFilter(state);
                  setSelectedId(null);
                }}
                className="table-filter"
              >
                <span>{state === "all" ? "Tất cả bàn" : states[state].title}</span>
                <strong>{isLoading && rows.length === 0 ? <Skeleton className="h-3 w-4" /> : state === "all" ? rows.length : rows.filter(row => tableState(row) === state).length}</strong>
              </button>
            ))}
          </div>
          <label className="mt-5 block sm:max-w-sm">
            <span className="sr-only">Tìm tên hoặc ID bàn</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên hoặc ID bàn…"
              className="min-h-control w-full rounded-xl border border-outline-variant/40 bg-surface px-4 text-base outline-none focus:border-primary sm:text-sm"
            />
          </label>
          {notice && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-surface-container p-4 text-sm"
            >
              {notice}
            </p>
          )}
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl bg-error-container/30 p-4 text-sm text-error"
            >
              <p>{error}</p>
              {accessDenied && (
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-3 min-h-control rounded-lg border border-primary px-4 font-semibold text-primary"
                >
                  Đăng nhập lại
                </button>
              )}
            </div>
          )}
          {isLoading && rows.length === 0 ? (
            <TablesSkeleton />
          ) : (
            !error && (
              <div className="staff-table-grid mt-5">
                <section aria-label="Các bàn trong quán" className="min-w-0">
                  <div className="staff-table-tiles">
                    {visible.map((row) => {
                      const state = tableState(row);
                      const style = states[state];
                      return (
                        <button
                          type="button"
                          key={row.table.id}
                          disabled={isClosing || isLoading}
                          onClick={() => { setSelectedId(row.table.id); if (!desktop) setDetailOpen(true); }}
                          aria-pressed={selected?.table.id === row.table.id}
                          className="table-tile"
                        >
                          <span
                            aria-hidden="true"
                            className="icon-slot text-2xl text-on-surface-variant"
                          ><Icon name={style.icon} /></span>
                          <h2 className="mt-2 break-words text-sm font-semibold text-on-surface">
                            {row.table.name}
                          </h2>
                          <span
                            className={`mt-2 inline-block rounded-md px-2 py-1 text-[10px] font-semibold ${style.badge}`}
                          >
                            {style.title}
                          </span>
                          <p className="mt-2 text-xs text-on-surface-variant">
                            {row.session
                              ? `Phiên #${row.session.id}`
                              : `ID bàn ${row.table.id}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {visible.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-outline-variant bg-surface p-9 text-center text-sm text-on-surface-variant">
                      {rows.length
                        ? "Không có bàn khớp bộ lọc."
                        : "Chưa có bàn trong database. Có thể tạo bàn bằng API Staff hiện có."}
                    </p>
                  )}
                </section>
                {desktop && selected && <aside aria-label="Chi tiết bàn" className="order-detail">{details}</aside>}

              </div>
            )
          )}
        </>
      </div>
      {!desktop && <Drawer title={selected ? selected.table.name : 'Chi tiết bàn'} placement="bottom" size="auto" open={detailOpen && !!selected} onClose={() => setDetailOpen(false)} styles={{ wrapper: { maxHeight: '85dvh' }, section: { maxHeight: '85dvh', minHeight: 240 }, body: { padding: 0 } }}>{details}</Drawer>}
    </div>
  );
}

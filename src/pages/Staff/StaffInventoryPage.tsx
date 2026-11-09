import { useEffect, useState } from "react";
import { Modal, message } from "antd";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import {
  getStaffIngredients,
  getStaffPackagedStock,
  type PackagedStock,
  type Ingredient,
} from "../../services/staffInventory";
import { staffErrorMessage } from "../../services/staffApi";
import StockReceiptModal from "../../components/staff/StockReceiptModal";
import StockReceiptHistory from "../../components/staff/StockReceiptHistory";
import StocktakeForm from "../../components/staff/StocktakeForm";
import StocktakeHistory from "../../components/staff/StocktakeHistory";
import StocktakeReportView from "../../components/staff/StocktakeReportView";
import type { StocktakeReport } from "../../types/stocktake";

interface Result {
  token: string;
  version: number;
  items: Ingredient[];
  packaged: PackagedStock[];
  error: string | null;
}

function InventoryTableColumns() {
  return (
    <colgroup>
      <col style={{ width: "26%" }} />
      <col style={{ width: "14%" }} />
      <col style={{ width: "18%" }} />
      <col style={{ width: "24%" }} />
      <col style={{ width: "18%" }} />
    </colgroup>
  );
}

export default function StaffInventoryPage() {
  const [messageApi, contextHolder] = message.useMessage({ maxCount: 1 });
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const [result, setResult] = useState<Result | null>(null);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [stocktakeOpen, setStocktakeOpen] = useState(false);
  const [stocktakeHistoryOpen, setStocktakeHistoryOpen] = useState(false);
  const [savedStocktake, setSavedStocktake] = useState<StocktakeReport | null>(null);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    Promise.all([
      getStaffIngredients(token, controller.signal),
      getStaffPackagedStock(token, controller.signal),
    ])
      .then(([items, packaged]) => {
        if (controller.signal.aborted) return;

        setResult({
          token,
          version: loadVersion,
          items,
          packaged,
          error: null,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setResult({
          token,
          version: loadVersion,
          items: [],
          packaged: [],
          error: staffErrorMessage(error),
        });
      });

    return () => controller.abort();
  }, [token, loadVersion]);

  const current =
    result !== null && result.token === token && result.version === loadVersion
      ? result
      : null;

  const canReceive =
    !!current &&
    !current.error &&
    (current.items.length > 0 || current.packaged.length > 0);

  return (
    <div className="staff-page-scroll h-full">
      {contextHolder}
      <div className="staff-page-content">
        <div className="staff-page-heading">
          <div>
            <h1>Tồn kho</h1>
            <p>Theo dõi nguyên liệu và hàng đóng gói khả dụng trong quán.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={!session} onClick={() => setStocktakeHistoryOpen(true)}
              className="min-h-control rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold disabled:opacity-40">Lịch sử kiểm kho</button>
            <button type="button" disabled={!session} onClick={() => setStocktakeOpen(true)}
              className="min-h-control rounded-xl border border-primary bg-white px-4 text-sm font-semibold text-primary disabled:opacity-40">Kiểm kho</button>
            <button
              type="button"
              disabled={!session}
              onClick={() => setHistoryOpen(true)}
              className="min-h-control rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold disabled:opacity-40"
            >
              Lịch sử nhập kho
            </button>
            <button
              type="button"
              disabled={!canReceive}
              onClick={() => {
                setReceiptOpen(true);
              }}
              className="min-h-control rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-40"
            >
              Nhập kho
            </button>
          </div>
        </div>

        {!current ? (
          <p role="status" className="mt-6">
            Đang tải tồn kho…
          </p>
        ) : current.error ? (
          <p role="alert" className="mt-6 text-error">
            {current.error}
          </p>
        ) : current.items.length === 0 ? (
          <p className="mt-6">Chưa có nguyên liệu.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-outline-variant bg-white">
            <table className="w-full min-w-[760px] table-fixed break-words text-left text-sm">
              <caption className="sr-only">Kho nguyên liệu</caption>
              <InventoryTableColumns />
              <thead className="bg-surface-container">
                <tr>
                  <th scope="col" className="p-4">
                    Nguyên liệu
                  </th>
                  <th scope="col" className="p-4">
                    Đơn vị
                  </th>
                  <th scope="col" className="p-4">
                    Khả dụng
                  </th>
                  <th scope="col" className="p-4">
                    Ngưỡng cảnh báo
                  </th>
                  <th scope="col" className="p-4">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {current.items.map((item) => (
                  <tr key={item.id} className="border-t border-outline-variant">
                    <td className="p-4">{item.name}</td>
                    <td className="p-4">{item.unit}</td>
                    <td className="p-4">
                      {item.stockQuantity.toLocaleString("vi-VN")}
                    </td>
                    <td className="p-4">
                      {item.minThreshold.toLocaleString("vi-VN")}
                    </td>
                    <td className="p-4">
                      {item.stockQuantity <= 0
                        ? "Hết hàng"
                        : item.stockQuantity <= item.minThreshold
                          ? "Sắp hết"
                          : "Đủ hàng"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {current && !current.error && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold">Hàng đóng gói</h2>

            {current.packaged.length === 0 ? (
              <p className="text-sm">Chưa có hàng đóng gói.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-outline-variant bg-white">
                <table className="w-full min-w-[760px] table-fixed break-words text-left text-sm">
                  <caption className="sr-only">Kho hàng đóng gói</caption>
                  <InventoryTableColumns />
                  <thead className="bg-surface-container">
                    <tr>
                      <th scope="col" className="p-4">
                        Sản phẩm
                      </th>
                      <th scope="col" className="p-4">
                        Đơn vị
                      </th>
                      <th scope="col" className="p-4">
                        Khả dụng
                      </th>
                      <th scope="col" className="p-4">
                        Tình trạng kho
                      </th>
                      <th scope="col" className="p-4">
                        Trạng thái bán
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.packaged.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-outline-variant"
                      >
                        <td className="p-4">{item.name}</td>
                        <td className="p-4">{item.unit}</td>
                        <td className="p-4">
                          {item.stockQuantity?.toLocaleString("vi-VN") ??
                            "Chưa có dữ liệu"}
                        </td>
                        <td className="p-4">
                          {item.stockQuantity == null
                            ? "Chưa có dữ liệu"
                            : item.stockQuantity <= 0
                              ? "Hết hàng"
                              : "Còn hàng"}
                        </td>
                        <td className="p-4">
                          {item.isActive == null
                            ? "Chưa có dữ liệu"
                            : item.isActive
                              ? "Đang bán"
                              : "Ngừng bán"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {stocktakeOpen && session && <StocktakeForm key={session.username} token={session.accessToken} username={session.username}
          onClose={() => setStocktakeOpen(false)} onSuccess={report => { setStocktakeOpen(false); setSavedStocktake(report); }} />}
        {stocktakeHistoryOpen && session && <StocktakeHistory key={session.username} token={session.accessToken} onClose={() => setStocktakeHistoryOpen(false)} />}
        {savedStocktake && <Modal open title="Đã lưu phiếu kiểm kho" width={1000} footer={null} onCancel={() => setSavedStocktake(null)}>
          <StocktakeReportView report={savedStocktake} />
        </Modal>}
        {historyOpen && session && (
          <Modal
            open
            title="Lịch sử nhập kho"
            footer={null}
            width={1200}
            onCancel={() => setHistoryOpen(false)}
          >
            <StockReceiptHistory
              key={session.username}
              token={session.accessToken}
              refreshVersion={loadVersion}
              ingredients={current?.items ?? []}
              packaged={current?.packaged ?? []}
            />
          </Modal>
        )}

        {receiptOpen && session && current && !current.error && (
          <StockReceiptModal
            key={session.username}
            token={session.accessToken}
            username={session.username}
            ingredients={current.items}
            packaged={current.packaged}
            onClose={() => setReceiptOpen(false)}
            onSuccess={(movement) => {
              setReceiptOpen(false);
              void messageApi.success({
                key: "stock-receipt-success",
                content: `Đã ghi nhận phiếu nhập kho #${movement.id}.`,
                duration: 4,
              });
              setLoadVersion((version) => version + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}

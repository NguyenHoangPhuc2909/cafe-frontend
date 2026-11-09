import { Tag } from 'antd';
import type { StocktakeReport } from '../../types/stocktake';

const quantity = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 6 });
export default function StocktakeReportView({ report }: { report: StocktakeReport }) {
  return <article className="stocktake-report">
    <div className="stocktake-report-heading"><div><h2>Phiếu kiểm kho #{report.id}</h2>
      <p>{report.performedByName} · {new Date(report.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p></div>
      <Tag color="green">Đã lưu</Tag></div>
    <p className="my-4">Đã kiểm <strong>{report.checkedItems}/{report.totalItems}</strong> mặt hàng · <strong>{report.differenceItems}</strong> mặt hàng chênh lệch</p>
    <div className="overflow-x-auto"><table className="stocktake-report-table">
      <thead><tr><th>Mặt hàng</th><th>Đơn vị</th><th>Hệ thống</th><th>Thực tế</th><th>Chênh lệch</th><th>Ghi chú</th></tr></thead>
      <tbody>{report.items?.map(item => <tr key={`${item.ingredientId == null ? 'p' : 'i'}:${item.ingredientId ?? item.productId}`}>
        <td data-label="Mặt hàng">{item.itemName}</td><td data-label="Đơn vị">{item.unit}</td><td data-label="Hệ thống">{quantity(item.expectedQuantity)}</td>
        <td data-label="Thực tế">{item.actualQuantity == null ? <span className="text-on-surface-variant">Chưa kiểm</span> : quantity(item.actualQuantity)}</td>
        <td data-label="Chênh lệch">{item.difference == null ? '—' : <span className={item.difference !== 0 ? 'text-error font-semibold' : ''}>
          {item.difference > 0 ? '+' : ''}{quantity(item.difference)}</span>}</td><td data-label="Ghi chú" className="whitespace-pre-wrap">{item.note || '—'}</td>
      </tr>)}</tbody>
    </table></div>
    {report.note && <p className="mt-4 whitespace-pre-wrap"><strong>Ghi chú:</strong> {report.note}</p>}
    <p className="mt-4 text-xs text-on-surface-variant">Phiếu ghi nhận kết quả kiểm đếm, chưa điều chỉnh tồn kho.</p>
  </article>;
}

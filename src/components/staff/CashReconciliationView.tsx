import { Tag } from 'antd';
import type { CashReconciliation } from '../../types/cash';
import { formatCurrency } from '../../utils/format';
import { cashDate, cashStatus } from '../../utils/cash';

export default function CashReconciliationView({ report }: { report: CashReconciliation }) {
  return <article className="cash-report">
    <div className="cash-report-heading"><div><h3>Đối chiếu tiền mặt #{report.id}</h3><p>Quỹ chung · {cashDate(report.businessDate)}</p></div>
      <Tag color={report.difference === 0 ? 'green' : 'orange'}>{cashStatus(report.difference)}</Tag></div>
    <dl className="cash-breakdown">
      <div><dt>Quỹ đầu ngày</dt><dd>{formatCurrency(report.openingAmount)}</dd></div>
      <div><dt>Tiền mặt bán hàng · {report.cashPaymentCount} đơn</dt><dd>+ {formatCurrency(report.cashSales)}</dd></div>
      <div><dt>Bổ sung vào quỹ</dt><dd>+ {formatCurrency(report.topUps)}</dd></div>
      <div><dt>Chi / rút tiền</dt><dd>− {formatCurrency(report.payouts)}</dd></div>
      <div className="cash-breakdown-total"><dt>Tiền dự kiến</dt><dd>{formatCurrency(report.expectedAmount)}</dd></div>
      <div><dt>Tiền thực đếm</dt><dd>{formatCurrency(report.actualAmount)}</dd></div>
      <div className={report.difference === 0 ? 'cash-match' : 'cash-mismatch'}><dt>{cashStatus(report.difference)}</dt><dd>{formatCurrency(Math.abs(report.difference))}</dd></div>
    </dl>
    {report.note && <p className="cash-report-note">{report.note}</p>}
    <p className="cash-caption">{report.performedByName} · {new Date(report.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
    <p className="cash-caption">Kết quả tại thời điểm đối chiếu, không tự bù chênh lệch vào quỹ.</p>
  </article>;
}

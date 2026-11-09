import { useState } from 'react';
import { Alert, Button, Input } from 'antd';
import type { CashDay, CashReconciliation, CashReconciliationRequest } from '../../types/cash';
import { useCashSubmission } from '../../hooks/useCashSubmission';
import { reconcileCash } from '../../services/staffCash';
import { cashDate, cashDifference, cashStatus, parseCashAmount } from '../../utils/cash';
import { formatCurrency } from '../../utils/format';

export default function CashReconciliationForm({ token, username, day, loading, onBusy, onSuccess }: {
  token: string; username: string; day: CashDay; loading: boolean; onBusy: (busy: boolean) => void;
  onSuccess: (report: CashReconciliation) => void;
}) {
  const submission = useCashSubmission<CashReconciliationRequest, CashReconciliation>(username, 'reconciliation', request => reconcileCash(token, request));
  const [actual, setActual] = useState(submission.pending ? String(submission.pending.actualAmount) : '');
  const [note, setNote] = useState(submission.pending?.note ?? '');
  const locked = submission.busy || !!submission.pending || submission.blocked;
  let difference: number | null = null;
  try { difference = cashDifference(parseCashAmount(actual), day.expectedAmount); } catch { /* Wait for a valid count. */ }
  return <form className="cash-reconcile-form" onSubmit={event => {
    event.preventDefault(); onBusy(true);
    void submission.submit(() => {
      const actualAmount = parseCashAmount(actual);
      if (cashDifference(actualAmount, day.expectedAmount) !== 0 && !note.trim()) throw new Error('Ghi chú nguyên nhân thừa / thiếu tiền trước khi lưu.');
      return { requestId: crypto.randomUUID(), businessDate: day.businessDate, expectedRevision: day.revision,
        expectedPaymentCount: day.cashPaymentCount, expectedLastPaymentId: day.lastPaymentId, actualAmount, note: note.trim() };
    }).then(result => { if (result) onSuccess(result); }).finally(() => onBusy(false));
  }}>
    <div className="cash-section-heading"><div><h3>Đối chiếu tiền thực đếm</h3><p>Đếm tiền trong ngăn kéo sau khi xử lý hết đơn.</p></div></div>
    {submission.error && <Alert className="mb-3" type="error" title={submission.error} showIcon />}
    {submission.pending && <Alert className="mb-3" type="info" showIcon title={`Phiếu ngày ${cashDate(submission.pending.businessDate)} chưa rõ kết quả. Gửi lại cùng phiếu để kiểm tra.`} />}
    <div className="cash-count-grid"><label>Tiền mặt thực đếm<Input className="cash-money-input" type="number" inputMode="numeric" min={0} max={999999999999} step={1} suffix="đ"
      aria-label="Tiền mặt thực đếm" disabled={locked} value={actual} onChange={event => setActual(event.target.value)} placeholder="Nhập tổng tiền vừa đếm" /></label>
      <div className={`cash-count-result ${difference == null ? '' : difference === 0 ? 'cash-match' : 'cash-mismatch'}`}>
        <span>{difference == null ? 'Chênh lệch' : cashStatus(difference)}</span><strong>{difference == null ? '—' : formatCurrency(Math.abs(difference))}</strong></div>
    </div>
    <label className="cash-count-note">Ghi chú {difference != null && difference !== 0 ? '(bắt buộc khi có chênh lệch)' : '(không bắt buộc)'}
      <Input.TextArea aria-label="Ghi chú đối chiếu tiền mặt" rows={2} maxLength={500} disabled={locked} value={note}
        onChange={event => setNote(event.target.value)} placeholder="Nguyên nhân thừa / thiếu hoặc thông tin bàn giao…" /></label>
    <div className="cash-form-actions"><span className="cash-caption">Phiếu không thay đổi số tiền dự kiến của quỹ.</span>
      <Button type="primary" htmlType="submit" aria-label={submission.pending ? 'Gửi lại cùng phiếu' : 'Lưu đối chiếu'} loading={submission.busy} disabled={submission.blocked || loading}>{submission.pending ? 'Gửi lại cùng phiếu' : 'Lưu đối chiếu'}</Button></div>
  </form>;
}

import { useState } from 'react';
import { Alert, Button, Input, Modal, Radio } from 'antd';
import type { CashMovement, CashMovementRequest, CashMovementType } from '../../types/cash';
import { useCashSubmission } from '../../hooks/useCashSubmission';
import { recordCashMovement } from '../../services/staffCash';
import { cashDate, parseCashAmount } from '../../utils/cash';
import Icon from '../ui/Icon';

export default function CashMovementForm({ token, username, businessDate, onClose, onSuccess }: {
  token: string; username: string; businessDate: string; onClose: () => void; onSuccess: (result: CashMovement) => void;
}) {
  const submission = useCashSubmission<CashMovementRequest, CashMovement>(username, 'movement', request => recordCashMovement(token, request));
  const [type, setType] = useState<CashMovementType>(submission.pending?.type ?? 'PAYOUT');
  const [amount, setAmount] = useState(submission.pending ? String(submission.pending.amount) : '');
  const [note, setNote] = useState(submission.pending?.note ?? '');
  const locked = submission.busy || !!submission.pending || submission.blocked;
  return <Modal open width={480} title={<div className="cash-form-title"><Icon name="payments" /> Ghi thu chi tiền mặt</div>}
    mask={{ closable: false }} closable={!submission.busy} keyboard={!submission.busy} onCancel={onClose} footer={null}>
    <p className="cash-caption">Quỹ chung · {cashDate(submission.pending?.businessDate ?? businessDate)}</p>
    <form className="cash-entry-form" onSubmit={event => {
      event.preventDefault();
      void submission.submit(() => {
        if (!note.trim()) throw new Error('Vui lòng ghi nội dung thu chi.');
        return { requestId: crypto.randomUUID(), businessDate, type, amount: parseCashAmount(amount, true), note: note.trim() };
      }).then(result => { if (result) onSuccess(result); });
    }}>
      {submission.error && <Alert type="error" title={submission.error} showIcon />}
      {submission.pending && <Alert type="info" showIcon title="Yêu cầu đang chờ xác nhận. Gửi lại cùng yêu cầu để tránh ghi trùng." />}
      <Radio.Group value={type} disabled={locked} onChange={event => setType(event.target.value)} optionType="button" buttonStyle="solid"
        options={[{ value: 'PAYOUT', label: 'Chi / rút tiền' }, { value: 'TOP_UP', label: 'Bổ sung vào quỹ' }]} />
      <label>Số tiền<Input className="cash-money-input" aria-label="Số tiền thu chi" type="number" inputMode="numeric" min={1} max={999999999999} step={1}
        suffix="đ" value={amount} disabled={locked} placeholder="Ví dụ: 100000" onChange={event => setAmount(event.target.value)} /></label>
      <label>Nội dung<Input.TextArea aria-label="Nội dung thu chi" rows={3} maxLength={500} value={note} disabled={locked}
        onChange={event => setNote(event.target.value)} placeholder={type === 'PAYOUT' ? 'Ví dụ: Mua ly, khăn giấy; bàn giao tiền cho chủ…' : 'Ví dụ: Chủ bổ sung tiền lẻ vào quỹ…'} /></label>
      <p className="cash-caption">Chỉ ghi tiền thực đưa vào hoặc lấy ra khỏi ngăn kéo. Tiền bán hàng được hệ thống tự cộng.</p>
      <div className="cash-form-actions"><Button disabled={submission.busy} onClick={onClose}>Đóng</Button>
        <Button type="primary" htmlType="submit" aria-label={submission.pending ? 'Gửi lại cùng yêu cầu' : 'Lưu thu chi'} loading={submission.busy} disabled={submission.blocked}>{submission.pending ? 'Gửi lại cùng yêu cầu' : 'Lưu thu chi'}</Button></div>
    </form>
  </Modal>;
}

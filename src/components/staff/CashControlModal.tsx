import { useEffect, useState } from 'react';
import { Alert, Button, Modal, Radio, Table, Tag } from 'antd';
import type { CashDay, CashMovement, CashReconciliation } from '../../types/cash';
import { getCashDay } from '../../services/staffCash';
import { staffErrorMessage } from '../../services/staffApi';
import { formatCurrency } from '../../utils/format';
import { cashDate, readCashPending } from '../../utils/cash';
import CashMovementForm from './CashMovementForm';
import CashReconciliationForm from './CashReconciliationForm';
import CashReconciliationView from './CashReconciliationView';
import CashHistory from './CashHistory';
import Icon from '../ui/Icon';

export default function CashControlModal({ token, username, onClose }: { token: string; username: string; onClose: () => void }) {
  const [tab, setTab] = useState('today');
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [saved, setSaved] = useState<CashReconciliation | null>(null);
  const [notice, setNotice] = useState('');
  const readMovementState = () => {
    try { return { pending: !!readCashPending(username, 'movement'), error: '' }; }
    catch { return { pending: false, error: 'Chưa đọc được khoản thu chi đang chờ trên trình duyệt. Kiểm tra bộ nhớ trước khi đối chiếu.' }; }
  };
  const [movementState, setMovementState] = useState(readMovementState);
  const [result, setResult] = useState<{ token: string; page: number; version: number; data?: CashDay; error?: string } | null>(null);
  const refresh = () => { setPage(0); setVersion(value => value + 1); };
  useEffect(() => {
    const controller = new AbortController();
    getCashDay(token, page, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ token, page, version, data });
    }).catch(cause => {
      if (!controller.signal.aborted) setResult(previous => ({ token, page, version,
        data: previous?.token === token ? previous.data : undefined, error: staffErrorMessage(cause) }));
    });
    return () => controller.abort();
  }, [token, page, version]);
  useEffect(() => {
    const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    let previousDate = today();
    const timer = setInterval(() => { const currentDate = today(); if (currentDate !== previousDate) {
      previousDate = currentDate; setPage(0); setVersion(value => value + 1);
    } }, 15_000);
    return () => clearInterval(timer);
  }, []);
  const current = result?.token === token && result.page === page && result.version === version ? result : null;
  const day = result?.token === token ? result.data : undefined;
  return <Modal open width={880} className="cash-modal" title={<div className="stocktake-title"><span className="stocktake-title-icon"><Icon name="payments" /></span>
    <div><h2>Quỹ tiền mặt chung</h2><p>Toàn quán · Đầu ngày mặc định 500.000đ</p></div></div>}
    mask={{ closable: false }} closable={!busy} keyboard={!busy} onCancel={onClose} footer={null}>
    <div className="cash-modal-toolbar"><Radio.Group value={tab} disabled={busy} onChange={event => { setTab(event.target.value); setSaved(null); }} optionType="button" buttonStyle="solid"
      options={[{ value: 'today', label: 'Quỹ hôm nay' }, { value: 'history', label: 'Lịch sử đối chiếu' }]} />
      <Button shape="circle" aria-label="Tải lại quỹ tiền mặt" title="Tải lại quỹ tiền mặt" disabled={busy || !current} icon={<Icon name="refresh" spin={!current} />} onClick={refresh} />
    </div>
    {notice && <Alert className="mb-4" type="success" title={notice} closable onClose={() => setNotice('')} />}
    {tab === 'history' ? <CashHistory token={token} /> : saved ? <>
      <CashReconciliationView report={saved} /><Button className="mt-4" onClick={() => setSaved(null)}>Về quỹ hôm nay</Button>
    </> : <>
      {current?.error && <Alert className="mb-3" type="error" title={current.error} showIcon />}
      {!day && !current?.error && <p role="status">Đang tải quỹ tiền mặt…</p>}
      {day && <>
        {movementState.error && <Alert className="mb-3" type="error" title={movementState.error} showIcon />}
        {movementState.pending && <Alert className="mb-3" type="warning" showIcon title="Còn khoản thu chi chưa rõ kết quả. Mở “Ghi thu chi” để gửi lại cùng yêu cầu trước khi đối chiếu tiền." />}
        <div className="cash-day-meta"><span>{cashDate(day.businessDate)} · Giờ Việt Nam</span><span>Cập nhật {new Date(day.updatedAt).toLocaleTimeString('vi-VN', { timeZone: day.timeZone })}</span></div>
        <div className="cash-summary-grid"><div className="cash-summary-main"><span>Tiền dự kiến trong quỹ</span><strong>{formatCurrency(day.expectedAmount)}</strong><small>Tiền mặt chung, không phải doanh thu cá nhân</small></div>
          <div><span>Tiền mặt bán hàng</span><strong>{formatCurrency(day.cashSales)}</strong><small>{day.cashPaymentCount} đơn · toàn quán</small></div></div>
        <div className="cash-formula"><span>Đầu ngày <b>{formatCurrency(day.openingAmount)}</b></span><span>+ Bổ sung <b>{formatCurrency(day.topUps)}</b></span><span>− Chi / rút <b>{formatCurrency(day.payouts)}</b></span></div>
        {day.expectedAmount < 0 && <Alert className="mt-3" type="warning" title="Tiền dự kiến đang âm. Kiểm tra lại các khoản bổ sung và chi/rút đã ghi." />}
        <div className="cash-section-heading"><div><h3>Thu chi trong ngày</h3><p>Ghi tiền mua vật dụng, bàn giao hoặc bổ sung tiền lẻ.</p></div>
          <Button disabled={busy || !current || !!current.error} icon={<Icon name="add" />} onClick={() => setMovementOpen(true)}>Ghi thu chi</Button></div>
        <Table<CashMovement> rowKey="id" size="small" loading={!current} dataSource={day.movements.content} scroll={{ x: 350 }} locale={{ emptyText: 'Chưa có khoản bổ sung hoặc chi/rút nào.' }} columns={[
          { title: 'Giờ', dataIndex: 'createdAt', width: 90, responsive: ['md'], render: value => new Date(value).toLocaleTimeString('vi-VN', { timeZone: day.timeZone }) },
          { title: 'Nội dung', dataIndex: 'note', render: (value, entry) => <span className="whitespace-pre-wrap break-words">{value}<small className="cash-caption mt-1 block md:hidden">{entry.performedByName} · {new Date(entry.createdAt).toLocaleTimeString('vi-VN', { timeZone: day.timeZone })}</small></span> },
          { title: 'Người ghi', dataIndex: 'performedByName', responsive: ['md'] },
          { title: 'Số tiền', align: 'right', width: 150, render: (_, entry) => <Tag color={entry.type === 'TOP_UP' ? 'green' : 'orange'}>{entry.type === 'TOP_UP' ? '+' : '−'} {formatCurrency(entry.amount)}</Tag> },
        ]} pagination={{ current: day.movements.page + 1, pageSize: 10, total: day.movements.totalElements, showSizeChanger: false, onChange: value => setPage(value - 1) }} />
        <CashReconciliationForm key={`${username}:${day.businessDate}`} token={token} username={username} day={day}
          loading={!current || !!current.error || movementState.pending || !!movementState.error} onBusy={setBusy} onSuccess={report => { setSaved(report); refresh(); }} />
      </>}
    </>}
    {movementOpen && day && <CashMovementForm key={username} token={token} username={username} businessDate={day.businessDate}
      onClose={() => { setMovementOpen(false); setMovementState(readMovementState()); }} onSuccess={entry => { setMovementOpen(false); setMovementState(readMovementState()); setNotice(`Đã ghi ${entry.type === 'TOP_UP' ? 'bổ sung' : 'chi / rút'} ${formatCurrency(entry.amount)} cho quỹ ngày ${cashDate(entry.businessDate)}.`); refresh(); }} />}
  </Modal>;
}

import { useEffect, useState } from 'react';
import { Alert, Button, Table, Tag } from 'antd';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { getPersonalRevenue } from '../../services/staffRevenue';
import { staffErrorMessage } from '../../services/staffApi';
import type { PersonalRevenue } from '../../types/revenue';
import { formatCurrency } from '../../utils/format';
import Icon from '../../components/ui/Icon';
import StaffOrderDrawer from '../../components/staff/StaffOrderDrawer';
import CashControlModal from '../../components/staff/CashControlModal';

const methodName = (method: string) => method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản';
export default function StaffRevenuePage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const [result, setResult] = useState<{ token: string; page: number; version: number; data?: PersonalRevenue; error?: string } | null>(null);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getPersonalRevenue(token, page, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ token, page, version, data });
    }).catch(cause => {
      if (!controller.signal.aborted) setResult({ token, page, version, error: staffErrorMessage(cause) });
    });
    return () => controller.abort();
  }, [token, page, version]);
  // Refresh when returning to the page and at midnight in Vietnam.
  useEffect(() => {
    const refresh = () => { if (!document.hidden) { setPage(0); setVersion(value => value + 1); } };
    const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    let date = today();
    const timer = setInterval(() => { const next = today(); if (date !== next) { date = next; setPage(0); setVersion(value => value + 1); } }, 15_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const current = result && result.token === token && result.page === page && result.version === version ? result : null;
  const data = current?.data;
  return <div className="staff-page-scroll h-full"><div className="staff-page-content">
    <div className="staff-page-heading"><div><h1>Doanh thu hôm nay</h1><p>Các khoản thanh toán do bạn xác nhận trong ngày, theo giờ Việt Nam.</p></div>
      <div className="flex flex-wrap items-center gap-3"><Button icon={<Icon name="payments" />} onClick={() => setCashOpen(true)}>Đối chiếu tiền mặt</Button>
        <Button shape="circle" aria-label="Tải lại doanh thu" title="Tải lại doanh thu" icon={<Icon name="refresh" spin={!current} />} disabled={!current}
          onClick={() => { setPage(0); setVersion(value => value + 1); }} /></div></div>
    {current?.error && <Alert className="mt-6" type="error" showIcon title={current.error} />}
    {!current && <p className="mt-6" role="status">Đang tải doanh thu…</p>}
    {data && <>
      <div className="revenue-meta"><span>{session?.username} · {data.date.split('-').reverse().join('/')}</span>
        <span>Cập nhật {new Date(data.updatedAt).toLocaleTimeString('vi-VN', { timeZone: data.timeZone })}</span></div>
      <div className="revenue-cards">
        <div className="revenue-card revenue-card-total"><span><Icon name="payments" /> Tổng đã thu</span><strong>{formatCurrency(data.totalAmount)}</strong><small>{data.paymentCount} đơn đã thanh toán</small></div>
        {data.methods.map(method => <div className="revenue-card" key={method.method}><span>{methodName(method.method)}</span>
          <strong>{formatCurrency(method.amount)}</strong><small>{method.paymentCount} đơn</small></div>)}
      </div>
      <section className="mt-8"><h2 className="mb-4 text-lg font-semibold">Giao dịch của bạn</h2>
        <Table<PersonalRevenue['payments']['content'][number]> className="revenue-transactions" rowKey="id" dataSource={data.payments.content} scroll={{ x: 390 }}
          locale={{ emptyText: 'Bạn chưa xác nhận thanh toán nào hôm nay.' }} columns={[
            { title: 'Đơn hàng', dataIndex: 'orderId', width: 100, render: value => <button type="button" className="revenue-order-link" aria-label={`Xem đơn #${value}`} onClick={() => setSelectedOrderId(value)}>#{value}</button> },
            { title: 'Giờ thu', dataIndex: 'paidAt', width: 100, render: value => new Date(value).toLocaleTimeString('vi-VN', { timeZone: data.timeZone }) },
            { title: 'Số tiền', dataIndex: 'amount', align: 'right', width: 140, render: value => <strong>{formatCurrency(value)}</strong> },
            { title: 'Phương thức', dataIndex: 'method', responsive: ['md'], render: value => <Tag color={value === 'CASH' ? 'green' : 'blue'}>{methodName(value)}</Tag> },
            { title: '', key: 'detail', width: 100, align: 'right', render: (_, row) => <button type="button" className="revenue-detail-link" aria-label={`Chi tiết đơn #${row.orderId}`} onClick={() => setSelectedOrderId(row.orderId)}>Chi tiết <Icon name="chevron_right" /></button> },
          ]} pagination={{ current: page + 1, pageSize: 20, total: data.payments.totalElements, showSizeChanger: false, onChange: value => setPage(value - 1) }} />
      </section>
    </>}
  </div>{selectedOrderId != null && <StaffOrderDrawer key={`${session?.username}:${selectedOrderId}`} readOnly orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
    {cashOpen && session && <CashControlModal key={session.username} token={session.accessToken} username={session.username} onClose={() => setCashOpen(false)} />}</div>;
}

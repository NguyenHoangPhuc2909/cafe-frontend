import { useEffect, useState } from 'react';
import { Alert, Button, Modal, Table } from 'antd';
import type { PageResponse } from '../../types/api';
import type { StocktakeReport } from '../../types/stocktake';
import { getStocktake, getStocktakes } from '../../services/staffStocktakes';
import { staffErrorMessage } from '../../services/staffApi';
import StocktakeReportView from './StocktakeReportView';
import Icon from '../ui/Icon';

export default function StocktakeHistory({ token, onClose }: { token: string; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ token: string; page: number; retry: number; data?: PageResponse<StocktakeReport>; error?: string } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ id: number; data?: StocktakeReport; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getStocktakes(token, page, controller.signal).then(data => { if (!controller.signal.aborted) setResult({ token, page, retry, data }); })
      .catch(cause => { if (!controller.signal.aborted) setResult({ token, page, retry, error: staffErrorMessage(cause) }); });
    return () => controller.abort();
  }, [token, page, retry]);
  useEffect(() => {
    if (selected == null) return;
    const controller = new AbortController();
    getStocktake(token, selected, controller.signal).then(data => { if (!controller.signal.aborted) setDetail({ id: selected, data }); })
      .catch(cause => { if (!controller.signal.aborted) setDetail({ id: selected, error: staffErrorMessage(cause) }); });
    return () => controller.abort();
  }, [token, selected, retry]);
  const current = result?.token === token && result.page === page && result.retry === retry ? result : null;
  return <Modal open title={selected == null ? 'Lịch sử kiểm kho' : `Phiếu kiểm kho #${selected}`} width={1000} onCancel={onClose} footer={<div className="flex justify-end gap-2">
    {selected != null && <Button onClick={() => setSelected(null)}>Danh sách phiếu</Button>}
    <Button shape="circle" aria-label="Tải lại lịch sử kiểm kho" title="Tải lại lịch sử kiểm kho" icon={<Icon name="refresh" />} onClick={() => setRetry(value => value + 1)} /><Button onClick={onClose}>Đóng</Button>
  </div>}>
    {selected != null ? detail?.id !== selected ? <p role="status">Đang tải phiếu…</p>
      : detail.error ? <Alert type="error" title={detail.error} /> : detail.data && <StocktakeReportView report={detail.data} />
      : current?.error ? <Alert type="error" title={current.error} />
        : <Table<StocktakeReport> rowKey="id" loading={!current} dataSource={current?.data?.content ?? []}
          scroll={{ x: 650 }} locale={{ emptyText: 'Chưa có phiếu kiểm kho.' }} columns={[
            { title: 'Phiếu', render: (_, row) => <Button type="link" onClick={() => setSelected(row.id)}>#{row.id}</Button> },
            { title: 'Thời gian', dataIndex: 'createdAt', render: value => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) },
            { title: 'Người kiểm', dataIndex: 'performedByName' },
            { title: 'Đã kiểm', render: (_, row) => `${row.checkedItems}/${row.totalItems}` },
            { title: 'Dòng lệch', dataIndex: 'differenceItems' },
          ]} pagination={{ current: page + 1, pageSize: 10, total: current?.data?.totalElements ?? 0, showSizeChanger: false, onChange: value => setPage(value - 1) }} />}
  </Modal>;
}

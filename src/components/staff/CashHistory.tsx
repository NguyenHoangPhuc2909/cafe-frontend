import { useEffect, useState } from 'react';
import { Alert, Button, Table } from 'antd';
import type { PageResponse } from '../../types/api';
import type { CashReconciliation } from '../../types/cash';
import { getCashReconciliations } from '../../services/staffCash';
import { staffErrorMessage } from '../../services/staffApi';
import { cashDate, cashStatus } from '../../utils/cash';
import { formatCurrency } from '../../utils/format';
import CashReconciliationView from './CashReconciliationView';
import Icon from '../ui/Icon';

export default function CashHistory({ token }: { token: string }) {
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<CashReconciliation | null>(null);
  const [result, setResult] = useState<{ token: string; page: number; version: number; data?: PageResponse<CashReconciliation>; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getCashReconciliations(token, page, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ token, page, version, data });
    }).catch(cause => { if (!controller.signal.aborted) setResult({ token, page, version, error: staffErrorMessage(cause) }); });
    return () => controller.abort();
  }, [token, page, version]);
  const current = result?.token === token && result.page === page && result.version === version ? result : null;
  return <section>
    <div className="cash-section-heading"><h3>{selected ? `Phiếu #${selected.id}` : 'Các lần đối chiếu'}</h3><div className="flex gap-2">
      {selected && <Button size="small" onClick={() => setSelected(null)}>Về danh sách</Button>}
      <Button aria-label="Tải lại lịch sử đối chiếu" title="Tải lại lịch sử đối chiếu" shape="circle" icon={<Icon name="refresh" />} onClick={() => setVersion(value => value + 1)} /></div></div>
    {selected ? <CashReconciliationView report={selected} /> : current?.error ? <Alert type="error" title={current.error} />
      : <Table<CashReconciliation> rowKey="id" size="small" loading={!current} dataSource={current?.data?.content ?? []} scroll={{ x: 610 }}
        locale={{ emptyText: 'Chưa có phiếu đối chiếu tiền mặt.' }} columns={[
          { title: 'Phiếu', render: (_, report) => <button type="button" className="revenue-order-link" onClick={() => setSelected(report)}>#{report.id}</button> },
          { title: 'Ngày quỹ', dataIndex: 'businessDate', render: cashDate },
          { title: 'Người kiểm', dataIndex: 'performedByName' },
          { title: 'Thực đếm', dataIndex: 'actualAmount', render: formatCurrency },
          { title: 'Kết quả', render: (_, report) => <span className={report.difference === 0 ? 'cash-match' : 'cash-mismatch'}>{cashStatus(report.difference)}{report.difference !== 0 && ` ${formatCurrency(Math.abs(report.difference))}`}</span> },
        ]} pagination={{ current: page + 1, pageSize: 10, total: current?.data?.totalElements ?? 0, showSizeChanger: false, onChange: value => setPage(value - 1) }} />}
  </section>;
}

import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { deleteAdminIngredient, getAdminIngredients, saveAdminIngredient } from '../../services/adminIngredients';
import { staffErrorMessage } from '../../services/staffApi';
import type { AdminIngredient, SaveAdminIngredient } from '../../types/adminIngredient';
import SearchField from '../../components/ui/SearchField';
import { getStaffPackagedStock, type PackagedStock } from '../../services/staffInventory';
import StockReceiptHistory from '../../components/staff/StockReceiptHistory';

export default function AdminInventoryPage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ token: string; version: number; data?: AdminIngredient[]; packaged?: PackagedStock[]; error?: string } | null>(null);
  const [view, setView] = useState('ingredients');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ item?: AdminIngredient } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form] = Form.useForm<SaveAdminIngredient>();
  const busy = useRef(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    Promise.all([getAdminIngredients(token, controller.signal), getStaffPackagedStock(token, controller.signal)]).then(([data, packaged]) => {
      if (!controller.signal.aborted) setResult({ token, version, data, packaged });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setResult({ token, version, error: staffErrorMessage(cause) });
    });
    return () => controller.abort();
  }, [token, version]);

  const current = result?.token === token && result?.version === version ? result : null;
  const rows = (current?.data ?? []).filter(item =>
    item.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')) &&
    (stockFilter === 'all' || (stockFilter === 'empty' ? item.stockQuantity === 0 : item.stockQuantity <= item.minThreshold)));
  const packagedRows = (current?.packaged ?? []).filter(item =>
    item.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')) &&
    (stockFilter !== 'empty' || item.stockQuantity === 0));
  const reload = () => { setPage(1); setVersion(value => value + 1); };
  const open = (item?: AdminIngredient) => {
    form.resetFields();
    form.setFieldsValue(item ? { name: item.name, unit: item.unit, minThreshold: item.minThreshold }
      : { name: '', unit: '', minThreshold: 0 });
    setFormError(null);
    setEditor({ item });
  };
  const save = async (values: SaveAdminIngredient) => {
    if (!token || !editor || busy.current) return;
    busy.current = true; setSaving(true); setFormError(null);
    try {
      const item = await saveAdminIngredient(token, values, editor.item?.id);
      setNotice({ error: false, text: `${editor.item ? 'Đã cập nhật' : 'Đã thêm'} nguyên liệu ${item.name}.` });
      setEditor(null); reload();
    } catch (cause) {
      setFormError(`${staffErrorMessage(cause)} Nếu mất kết nối, hãy đóng form và tải lại danh sách trước khi gửi lại.`);
    } finally { busy.current = false; setSaving(false); }
  };
  const remove = async (item: AdminIngredient) => {
    if (!token || busy.current) return;
    busy.current = true; setSaving(true);
    try {
      await deleteAdminIngredient(token, item.id);
      setNotice({ error: false, text: `Đã xóa nguyên liệu ${item.name}.` });
    } catch (cause) { setNotice({ error: true, text: staffErrorMessage(cause) }); }
    finally { busy.current = false; setSaving(false); reload(); }
  };

  return <section className="admin-page">
    <header className="admin-page-heading">
      <div><h1>Kho của quán</h1><p>Theo dõi tồn kho, quản lý nguyên liệu và tra cứu các phiếu nhập.</p></div>
      <Space wrap>
        <Button disabled={!token} onClick={() => setHistoryOpen(true)}>Lịch sử nhập kho</Button>
        {view === 'ingredients' && <Button type="primary" icon={<PlusOutlined />} disabled={saving || !current?.data} onClick={() => open()}>Thêm nguyên liệu</Button>}
      </Space>
    </header>
    {notice && <Alert className="mb-4" showIcon type={notice.error ? 'error' : 'success'} title={notice.text} />}
    <Tabs activeKey={view} onChange={value => { setView(value); setPage(1); setQuery(''); setStockFilter('all'); }}
      items={[{ key: 'ingredients', label: 'Nguyên liệu' }, { key: 'packaged', label: 'Hàng đóng gói' }]} />
    <div className="admin-filter-bar">
      <SearchField label="Tìm mặt hàng" placeholder={view === 'ingredients' ? 'Tìm theo tên nguyên liệu…' : 'Tìm hàng đóng gói…'} value={query} onChange={value => { setQuery(value); setPage(1); }} />
      <Select aria-label="Lọc mức tồn" value={stockFilter} className="min-w-44" onChange={value => { setStockFilter(value); setPage(1); }}
        options={[{ value: 'all', label: 'Tất cả mức tồn' }, ...(view === 'ingredients' ? [{ value: 'low', label: 'Sắp hết / hết hàng' }] : []), { value: 'empty', label: 'Đã hết hàng' }]} />
      <Button disabled={saving} onClick={reload}>Tải lại</Button>
    </div>
    {view === 'ingredients'
      ? <p className="mb-4 text-sm text-on-surface-variant">Nguyên liệu mới có tồn bằng 0. Nhân viên nhập kho để bổ sung số lượng. Đơn vị và thao tác xóa được khóa khi nguyên liệu đã có tồn, công thức hoặc lịch sử sử dụng.</p>
      : <p className="mb-4 text-sm text-on-surface-variant">Theo dõi số lượng hàng đóng gói tại đây. <Link to="/admin/products" className="underline">Sửa thông tin mặt hàng trong Thực đơn.</Link></p>}
    {current?.error ? <Alert showIcon type="error" title={current.error} action={<Button onClick={reload}>Thử lại</Button>} />
      : view === 'packaged' ? <Table<PackagedStock> rowKey="id" dataSource={packagedRows} loading={!current} scroll={{ x: 600 }}
        locale={{ emptyText: query.trim() || stockFilter !== 'all' ? 'Không có hàng đóng gói phù hợp.' : 'Chưa có hàng đóng gói.' }}
        pagination={{ current: page, pageSize: 20, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'Sản phẩm', dataIndex: 'name' }, { title: 'Đơn vị', dataIndex: 'unit' },
          { title: 'Khả dụng', dataIndex: 'stockQuantity', align: 'right', render: (value: number | null) => value?.toLocaleString('vi-VN') ?? 'Chưa có dữ liệu' },
          { title: 'Tình trạng kho', key: 'stock', render: (_, item) => item.stockQuantity == null ? 'Chưa có dữ liệu' : item.stockQuantity <= 0 ? 'Hết hàng' : 'Còn hàng' },
          { title: 'Trạng thái bán', dataIndex: 'isActive', render: (value: boolean | null) => value == null ? 'Chưa có dữ liệu' : value ? 'Đang bán' : 'Ngừng bán' },
        ]} /> : <Table<AdminIngredient> rowKey="id" dataSource={rows} loading={!current} scroll={{ x: 800 }}
        locale={{ emptyText: query.trim() || stockFilter !== 'all' ? 'Không có nguyên liệu phù hợp.' : 'Chưa có nguyên liệu. Thêm nguyên liệu để thiết lập công thức.' }}
        pagination={{ current: page, pageSize: 20, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'Nguyên liệu', dataIndex: 'name', render: (name, item) => <Space wrap><span>{name}</span>{item.systemManaged && <Tag>Ly theo size</Tag>}</Space> },
          { title: 'Đơn vị', dataIndex: 'unit' },
          { title: 'Khả dụng', dataIndex: 'stockQuantity', align: 'right', render: (value: number) => value.toLocaleString('vi-VN') },
          { title: 'Ngưỡng cảnh báo', dataIndex: 'minThreshold', align: 'right', render: (value: number) => value.toLocaleString('vi-VN') },
          { title: 'Trạng thái', key: 'stock', render: (_, item) => <Tag color={item.stockQuantity === 0 ? 'error' : item.stockQuantity <= item.minThreshold ? 'warning' : 'success'}>
            {item.stockQuantity === 0 ? 'Hết hàng' : item.stockQuantity <= item.minThreshold ? 'Sắp hết' : 'Đủ hàng'}</Tag> },
          { title: 'Thao tác', key: 'actions', width: 130, render: (_, item) => <Space>
            <Button icon={<EditOutlined />} aria-label={`Sửa nguyên liệu ${item.name}`} disabled={saving} onClick={() => open(item)} />
            <Tooltip title={!item.deletable ? 'Nguyên liệu còn tồn, đã được sử dụng hoặc là ly theo size.' : 'Xóa nguyên liệu chưa sử dụng'}>
              <span><Popconfirm title={`Xóa nguyên liệu ${item.name}?`} description="Chỉ xóa nguyên liệu chưa sử dụng và không còn tồn." okText="Xóa nguyên liệu" cancelText="Giữ lại"
                onConfirm={() => remove(item)} disabled={saving || !item.deletable}>
                <Button danger icon={<DeleteOutlined />} aria-label={`Xóa nguyên liệu ${item.name}`} disabled={saving || !item.deletable} />
              </Popconfirm></span>
            </Tooltip>
          </Space> },
        ]} />}
    {historyOpen && token && <Modal open title="Lịch sử nhập kho" footer={null} width={1200} onCancel={() => setHistoryOpen(false)}>
      <StockReceiptHistory key={token} token={token} refreshVersion={version} ingredients={current?.data ?? []} packaged={current?.packaged ?? []} />
    </Modal>}
    <Modal title={editor?.item ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'} open={editor !== null}
      onCancel={() => { if (!busy.current) setEditor(null); }} onOk={() => form.submit()} confirmLoading={saving}
      okText="Lưu nguyên liệu" cancelText="Hủy" cancelButtonProps={{ disabled: saving }} closable={!saving} maskClosable={!saving} keyboard={!saving}>
      {formError && <Alert className="mb-4" showIcon type="error" title={formError} />}
      {editor?.item && !editor.item.unitEditable && <p className="mb-4 text-sm text-on-surface-variant">Đơn vị đã được khóa để giữ đúng định lượng và lịch sử. Bạn vẫn có thể sửa tên và ngưỡng cảnh báo.</p>}
      <Form form={form} layout="vertical" onFinish={save} disabled={saving}>
        <Form.Item name="name" label="Tên nguyên liệu" rules={[{ required: true, whitespace: true, message: 'Nhập tên nguyên liệu.' }, { max: 255 }]}>
          <Input maxLength={255} autoComplete="off" placeholder="Ví dụ: Cà phê hạt" />
        </Form.Item>
        <Form.Item name="unit" label="Đơn vị tính" rules={[{ required: true, whitespace: true, message: 'Nhập đơn vị tính.' }, { max: 50 }]}>
          <Input maxLength={50} autoComplete="off" placeholder="Ví dụ: g, ml, cái" disabled={saving || (editor?.item !== undefined && !editor.item.unitEditable)} />
        </Form.Item>
        <Form.Item name="minThreshold" label="Ngưỡng cảnh báo tồn kho" extra="Cảnh báo khi số lượng khả dụng bằng hoặc thấp hơn mức này."
          rules={[{ required: true, message: 'Nhập ngưỡng cảnh báo.' }, { type: 'number', min: 0, message: 'Ngưỡng cảnh báo không được âm.' }]}>
          <InputNumber min={0} className="w-full" placeholder="Ví dụ: 500" />
        </Form.Item>
      </Form>
    </Modal>
  </section>;
}

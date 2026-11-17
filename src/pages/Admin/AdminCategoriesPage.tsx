import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Popconfirm, Space, Table } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { deleteAdminCategory, saveAdminCategory } from '../../services/adminCategories';
import { getAdminCategories } from '../../services/adminProducts';
import { staffErrorMessage } from '../../services/staffApi';
import type { CategoryResponse } from '../../types/adminProduct';
import SearchField from '../../components/ui/SearchField';

export default function AdminCategoriesPage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ token: string; version: number; data?: CategoryResponse[]; error?: string } | null>(null);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ id?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form] = Form.useForm<{ name: string }>();
  const busy = useRef(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getAdminCategories(token, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ token, version, data });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setResult({ token, version, error: staffErrorMessage(cause) });
    });
    return () => controller.abort();
  }, [token, version]);

  const current = result?.token === token && result?.version === version ? result : null;
  const rows = (current?.data ?? []).filter(item => item.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));
  const open = (item?: CategoryResponse) => {
    form.resetFields();
    form.setFieldsValue({ name: item?.name ?? '' });
    setFormError(null);
    setEditor(item ? { id: item.id } : {});
  };

  const save = async ({ name }: { name: string }) => {
    if (!token || !editor || busy.current) return;
    busy.current = true;
    setSaving(true);
    setFormError(null);
    try {
      const saved = await saveAdminCategory(token, name, editor.id);
      setNotice({ error: false, text: `${editor.id === undefined ? 'Đã thêm' : 'Đã cập nhật'} danh mục ${saved.name}.` });
      setEditor(null);
      setVersion(value => value + 1);
    } catch (cause) {
      setFormError(`${staffErrorMessage(cause)} Nếu mất kết nối, hãy đóng form và tải lại danh sách trước khi gửi lại.`);
    } finally { busy.current = false; setSaving(false); }
  };

  const remove = async (item: CategoryResponse) => {
    if (!token || busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      await deleteAdminCategory(token, item.id);
      setNotice({ error: false, text: `Đã xóa danh mục ${item.name}.` });
    } catch (cause) {
      setNotice({ error: true, text: staffErrorMessage(cause) });
    } finally { busy.current = false; setSaving(false); setVersion(value => value + 1); }
  };

  return <section className="admin-page">
    <header className="admin-page-heading">
      <div><h1>Danh mục thực đơn</h1><p>Nhóm món để khách dễ tìm và quán dễ quản lý thực đơn.</p></div>
      <Button type="primary" icon={<PlusOutlined />} disabled={saving || !current?.data} onClick={() => open()}>Thêm danh mục</Button>
    </header>
    {notice && <Alert className="mb-4" showIcon type={notice.error ? 'error' : 'success'} title={notice.text} />}
    <div className="admin-filter-bar">
      <SearchField label="Tìm danh mục" placeholder="Tìm theo tên danh mục…" value={query} onChange={setQuery} />
      <Button disabled={saving} onClick={() => setVersion(value => value + 1)}>Tải lại</Button>
      <Link className="ui-button" to="/admin/products">Quản lý món</Link>
    </div>
    <p className="mb-4 text-sm text-on-surface-variant">Chỉ xóa danh mục không còn món. Chuyển món sang danh mục khác trước khi xóa.</p>
    {current?.error ? <Alert showIcon type="error" title={current.error} action={<Button onClick={() => setVersion(value => value + 1)}>Thử lại</Button>} />
      : <Table<CategoryResponse> rowKey="id" dataSource={rows} loading={!current} scroll={{ x: 450 }}
        locale={{ emptyText: query.trim() ? 'Không có danh mục phù hợp.' : 'Chưa có danh mục. Thêm danh mục để bắt đầu tạo món.' }}
        pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'Tên danh mục', dataIndex: 'name' },
          { title: 'Thao tác', key: 'actions', width: 150, render: (_, item) => <Space>
            <Button icon={<EditOutlined />} aria-label={`Sửa danh mục ${item.name}`} disabled={saving} onClick={() => open(item)} />
            <Popconfirm title={`Xóa danh mục ${item.name}?`} description="Danh mục còn món sẽ không thể xóa." okText="Xóa danh mục" cancelText="Giữ lại" onConfirm={() => remove(item)} disabled={saving}>
              <Button danger icon={<DeleteOutlined />} aria-label={`Xóa danh mục ${item.name}`} disabled={saving} />
            </Popconfirm>
          </Space> },
        ]} />}
    <Modal title={editor?.id === undefined ? 'Thêm danh mục' : 'Sửa danh mục'} open={editor !== null}
      onCancel={() => { if (!busy.current) setEditor(null); }} onOk={() => form.submit()} confirmLoading={saving}
      okText="Lưu danh mục" cancelText="Hủy" cancelButtonProps={{ disabled: saving }} closable={!saving} maskClosable={!saving} keyboard={!saving}>
      {formError && <Alert className="mb-4" showIcon type="error" title={formError} />}
      <Form form={form} layout="vertical" onFinish={save} disabled={saving}>
        <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, whitespace: true, message: 'Nhập tên danh mục.' }, { max: 100, message: 'Tên danh mục tối đa 100 ký tự.' }]}>
          <Input maxLength={100} autoComplete="off" placeholder="Ví dụ: Cà phê, Trà, Bánh" />
        </Form.Item>
      </Form>
    </Modal>
  </section>;
}

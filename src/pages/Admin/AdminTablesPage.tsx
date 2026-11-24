import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  notification,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  QrcodeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import SearchField from '../../components/ui/SearchField';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import {
  deleteAdminTable,
  getAdminTables,
  saveAdminTable,
  updateAdminTableStatus,
} from '../../services/adminTables';
import { staffErrorMessage } from '../../services/staffApi';
import type { AdminTable, SaveAdminTable } from '../../types/adminTable';

type TableFilter = 'all' | 'open' | 'idle' | 'inactive';

export default function AdminTablesPage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{
    token: string;
    version: number;
    data?: AdminTable[];
    error?: string;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TableFilter>('all');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ item?: AdminTable } | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form] = Form.useForm<SaveAdminTable>();
  const [notificationApi, notificationHolder] = notification.useNotification({
    placement: 'topRight',
    duration: 3,
    maxCount: 2,
  });
  const busy = useRef(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getAdminTables(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ token, version, data });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({ token, version, error: staffErrorMessage(cause) });
        }
      });
    return () => controller.abort();
  }, [token, version]);

  const current = result?.token === token && result?.version === version ? result : null;
  const allTables = current?.data ?? [];
  const normalizedQuery = query.trim().toLocaleLowerCase('vi');
  const rows = allTables.filter((item) => {
    const matchesSearch =
      !normalizedQuery ||
      item.name.toLocaleLowerCase('vi').includes(normalizedQuery) ||
      String(item.id) === normalizedQuery ||
      item.qrCode.toLocaleLowerCase('vi').includes(normalizedQuery);

    if (!matchesSearch) return false;
    if (statusFilter === 'open') return item.hasOpenSession;
    if (statusFilter === 'idle') return item.isActive && !item.hasOpenSession;
    if (statusFilter === 'inactive') return !item.isActive;
    return true;
  });

  const reload = () => {
    setPage(1);
    setVersion((value) => value + 1);
  };

  const openEditor = (item?: AdminTable) => {
    form.resetFields();
    form.setFieldsValue({ name: item?.name ?? '' });
    setFormError(null);
    setEditor({ item });
  };

  const handleSave = async (values: SaveAdminTable) => {
    if (!token || !editor || busy.current) return;
    busy.current = true;
    setSaving(true);
    setFormError(null);
    try {
      const saved = await saveAdminTable(token, values, editor.item?.id);
      setNotice({
        error: false,
        text: editor.item
          ? `Đã đổi tên thành ${saved.name}. Mã QR của bàn vẫn được giữ nguyên.`
          : `Đã thêm bàn ${saved.name}.`,
      });
      setEditor(null);
      reload();
    } catch (cause) {
      setFormError(
        `${staffErrorMessage(cause)} Nếu mất kết nối, hãy đóng form và tải lại danh sách trước khi gửi lại.`,
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: AdminTable, nextActive: boolean) => {
    if (!token || busy.current) return;
    busy.current = true;
    setTogglingId(item.id);
    setNotice(null);
    try {
      const updated = await updateAdminTableStatus(token, item.id, nextActive);
      setResult((previous) => {
        if (previous?.token !== token || !previous.data) return previous;
        return {
          ...previous,
          data: previous.data.map((row) => (row.id === updated.id ? updated : row)),
        };
      });
      notificationApi.success({
        key: 'admin-table-status',
        title: `Đã ${nextActive ? 'bật sử dụng' : 'ngừng sử dụng'} ${updated.name}.`,
      });
    } catch (cause) {
      setNotice({ error: true, text: staffErrorMessage(cause) });
      reload();
    } finally {
      busy.current = false;
      setTogglingId(null);
    }
  };

  const handleDelete = async (item: AdminTable) => {
    if (!token || busy.current) return;
    busy.current = true;
    setSaving(true);
    setNotice(null);
    try {
      await deleteAdminTable(token, item.id);
      setNotice({ error: false, text: `Đã xóa bàn ${item.name}.` });
    } catch (cause) {
      setNotice({ error: true, text: staffErrorMessage(cause) });
    } finally {
      busy.current = false;
      setSaving(false);
      reload();
    }
  };

  const copyQrLink = async (item: AdminTable) => {
    const qrUrl = `${window.location.origin}/table/${encodeURIComponent(item.qrCode)}`;
    try {
      await navigator.clipboard.writeText(qrUrl);
      notificationApi.success({
        key: 'admin-table-qr',
        title: `Đã sao chép đường dẫn QR của ${item.name}.`,
      });
    } catch {
      notificationApi.info({
        key: 'admin-table-qr',
        title: `Đường dẫn QR: ${qrUrl}`,
      });
    }
  };

  const openCount = allTables.filter((item) => item.hasOpenSession).length;
  const idleCount = allTables.filter((item) => item.isActive && !item.hasOpenSession).length;
  const inactiveCount = allTables.filter((item) => !item.isActive).length;
  const isMutating = saving || togglingId !== null;

  return (
    <section className="admin-page">
      {notificationHolder}
      <header className="admin-page-heading">
        <div>
          <h1>Quản lý bàn</h1>
          <p>Thêm, đổi tên (giữ nguyên mã QR), bật/tắt bàn và theo dõi trạng thái phiên phục vụ.</p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} disabled={!current || isMutating} onClick={reload}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!current?.data || isMutating}
            onClick={() => openEditor()}
          >
            Thêm bàn
          </Button>
        </Space>
      </header>

      {notice && (
        <Alert className="mb-4" showIcon type={notice.error ? 'error' : 'success'} title={notice.text} />
      )}

      <div className="admin-filter-bar">
        <SearchField
          label="Tìm bàn"
          placeholder="Tìm theo tên bàn, ID hoặc mã QR…"
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
        />
        <Select<TableFilter>
          aria-label="Lọc trạng thái bàn"
          value={statusFilter}
          className="min-w-52"
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: `Tất cả bàn (${allTables.length})` },
            { value: 'open', label: `Đang phục vụ (${openCount})` },
            { value: 'idle', label: `Bàn trống (${idleCount})` },
            { value: 'inactive', label: `Ngừng sử dụng (${inactiveCount})` },
          ]}
        />
      </div>

      {current?.error ? (
        <Alert
          showIcon
          type="error"
          title={current.error}
          action={<Button onClick={reload}>Thử lại</Button>}
        />
      ) : (
        <Table<AdminTable>
          rowKey="id"
          dataSource={rows}
          loading={!current}
          scroll={{ x: 960 }}
          locale={{
            emptyText:
              normalizedQuery || statusFilter !== 'all'
                ? 'Không có bàn phù hợp với bộ lọc.'
                : 'Chưa có bàn nào. Bấm "Thêm bàn" để tạo bàn và mã QR mới.',
          }}
          pagination={{
            current: page,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          columns={[
            {
              title: 'Bàn',
              dataIndex: 'name',
              render: (name: string, item) => (
                <Space wrap>
                  <span className="font-semibold">{name}</span>
                  <span className="text-xs text-on-surface-variant">#{item.id}</span>
                </Space>
              ),
            },
            {
              title: 'Mã QR',
              dataIndex: 'qrCode',
              render: (qrCode: string, item) => (
                <Space wrap size="small">
                  <Tooltip title="Sao chép QR">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      aria-label={`Sao chép QR ${item.name}`}
                      onClick={() => void copyQrLink(item)}
                    />
                  </Tooltip>
                  {item.isActive ? (
                    <Tooltip title="Mở trang QR">
                      <Link
                        to={`/table/${encodeURIComponent(qrCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <QrcodeOutlined />
                        <span>Mở QR</span>
                      </Link>
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-on-surface-variant">QR tạm khóa</span>
                  )}
                </Space>
              ),
            },
            {
              title: 'Phiên hiện tại',
              key: 'session',
              render: (_, item) =>
                item.hasOpenSession && item.openSessionId !== null ? (
                  <Space wrap size="small">
                    <Tag color="processing">Đang phục vụ #{item.openSessionId}</Tag>
                    <Link
                      to={`/admin/orders?session=${item.openSessionId}&filter=all`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Xem đơn
                    </Link>
                  </Space>
                ) : item.isActive ? (
                  <Tag>Trống</Tag>
                ) : (
                  <span className="text-xs text-on-surface-variant">—</span>
                ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'isActive',
              width: 150,
              render: (active: boolean, item) => {
                const blocked = active && !item.canDeactivate;
                return (
                  <Tooltip
                    title={
                      blocked
                        ? 'Bàn đang có phiên phục vụ đang mở; hãy kết thúc phiên trước khi ngừng sử dụng.'
                        : active
                          ? 'Bấm để ngừng sử dụng bàn này'
                          : 'Bấm để bật sử dụng lại bàn này'
                    }
                  >
                    <span>
                      <Switch
                        checked={active}
                        checkedChildren="Đang dùng"
                        unCheckedChildren="Ngừng dùng"
                        aria-label={`Bật hoặc tắt ${item.name}`}
                        loading={togglingId === item.id}
                        disabled={isMutating || blocked}
                        onChange={(checked) => void handleToggleStatus(item, checked)}
                      />
                    </span>
                  </Tooltip>
                );
              },
            },
            {
              title: 'Thao tác',
              key: 'actions',
              width: 120,
              render: (_, item) => {
                const deleteTooltip = item.hasOpenSession
                  ? 'Bàn đang có phiên phục vụ đang mở; không thể xóa.'
                  : item.hasSessionHistory
                    ? 'Bàn đã có lịch sử phục vụ; hãy chuyển sang ngừng sử dụng thay vì xóa.'
                    : 'Xóa bàn chưa từng sử dụng';
                return (
                  <Space>
                    <Tooltip title="Đổi tên bàn (giữ nguyên mã QR)">
                      <Button
                        icon={<EditOutlined />}
                        aria-label={`Sửa tên ${item.name}`}
                        disabled={isMutating}
                        onClick={() => openEditor(item)}
                      />
                    </Tooltip>
                    <Tooltip title={deleteTooltip}>
                      <span>
                        <Popconfirm
                          title={`Xóa bàn ${item.name}?`}
                          description="Chỉ xóa bàn chưa từng có phiên phục vụ. Thao tác này không thể hoàn tác."
                          okText="Xóa bàn"
                          cancelText="Giữ lại"
                          onConfirm={() => void handleDelete(item)}
                          disabled={isMutating || !item.deletable}
                        >
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={`Xóa ${item.name}`}
                            disabled={isMutating || !item.deletable}
                          />
                        </Popconfirm>
                      </span>
                    </Tooltip>
                  </Space>
                );
              },
            },
          ]}
        />
      )}

      <Modal
        title={editor?.item ? 'Đổi tên bàn' : 'Thêm bàn mới'}
        open={editor !== null}
        onCancel={() => {
          if (!busy.current) setEditor(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={editor?.item ? 'Lưu tên bàn' : 'Tạo bàn'}
        cancelText="Hủy"
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
        keyboard={!saving}
      >
        {formError && <Alert className="mb-4" showIcon type="error" title={formError} />}
        {editor?.item && (
          <p className="mb-4 text-sm text-on-surface-variant">
            Đổi tên bàn sẽ <strong>giữ nguyên mã QR</strong> để không ảnh hưởng mã đã in tại bàn.
          </p>
        )}
        <Form form={form} layout="vertical" onFinish={(values) => void handleSave(values)} disabled={saving}>
          <Form.Item
            name="name"
            label="Tên bàn"
            rules={[
              { required: true, whitespace: true, message: 'Nhập tên bàn.' },
              { max: 20, message: 'Tên bàn tối đa 20 ký tự.' },
            ]}
          >
            <Input maxLength={20} autoComplete="off" placeholder="Ví dụ: Bàn 09 hoặc Bàn 01 - Tầng 2" />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}

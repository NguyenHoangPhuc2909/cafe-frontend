import { useEffect, useState } from "react";
import { EditOutlined } from "@ant-design/icons";
import {
  Alert,
  Table,
  Button,
  Form,
  Input,
  Modal,
  Switch,
  Popconfirm,
  Tooltip,
} from "antd";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
} from "../../services/adminEmployees";
import { staffErrorMessage } from "../../services/staffApi";
import type { PageResponse } from "../../types/api";
import type {
  EmployeeResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "../../types/employee";

const PAGE_SIZE = 20;

interface EmployeeResult {
  token: string;
  page: number;
  data?: PageResponse<EmployeeResponse>;
  error?: string;
  refreshVersion: number;
}

export default function AdminEmployeesPage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<EmployeeResult | null>(null);
  const [form] = Form.useForm<CreateEmployeeRequest>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [editForm] = Form.useForm<UpdateEmployeeRequest>();
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeResponse | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [statusSavingId, setStatusSavingId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function handleStatusChange(employee: EmployeeResponse) {
    if (!token || statusSavingId !== null) return;

    setStatusSavingId(employee.id);
    setStatusError(null);

    try {
      await updateEmployeeStatus(token, employee.id, !employee.isActive);
      setRefreshVersion((version) => version + 1);
    } catch (cause: unknown) {
      setStatusError(staffErrorMessage(cause));
    } finally {
      setStatusSavingId(null);
    }
  }

  function openEditForm(employee: EmployeeResponse) {
    editForm.resetFields();
    editForm.setFieldsValue({
      fullName: employee.fullName ?? "",
      email: employee.email,
    });
    setEditError(null);
    setEditingEmployee(employee);
  }

  async function handleEdit(values: UpdateEmployeeRequest) {
    if (!token || !editingEmployee || editSaving) return;

    setEditSaving(true);
    setEditError(null);

    try {
      await updateEmployee(token, editingEmployee.id, {
        fullName: values.fullName?.trim() || null,
        email: values.email,
      });

      setEditingEmployee(null);
      setRefreshVersion((version) => version + 1);
    } catch (cause: unknown) {
      setEditError(staffErrorMessage(cause));
    } finally {
      setEditSaving(false);
    }
  }

  function closeCreateForm() {
    form.resetFields();
    setCreateError(null);
    setOpen(false);
  }

  async function handleCreate(values: CreateEmployeeRequest) {
    if (!token || saving) return;

    setSaving(true);
    setCreateError(null);

    try {
      await createEmployee(token, values);
      closeCreateForm();
      setPage(0);
      setRefreshVersion((version) => version + 1);
    } catch (cause: unknown) {
      setCreateError(staffErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    getEmployees(token, page, PAGE_SIZE, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ token, page, refreshVersion, data });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            token,
            page,
            refreshVersion,
            error: staffErrorMessage(cause),
          });
        }
      });

    return () => controller.abort();
  }, [token, page, refreshVersion]);

  const current =
    result?.token === token &&
    result?.page === page &&
    result?.refreshVersion === refreshVersion
      ? result
      : null;
  const data = current?.data;

  const tableError = statusError ?? current?.error;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Quản lý nhân viên</h2>
        <Button type="primary" onClick={() => setOpen(true)}>
          Thêm nhân viên
        </Button>
      </div>

      <Modal
        title="Thêm nhân viên"
        open={open}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        confirmLoading={saving}
        onOk={() => form.submit()}
        onCancel={() => {
          if (!saving) closeCreateForm();
        }}
      >
        {createError && (
          <Alert className="mb-4" type="error" showIcon title={createError} />
        )}

        <Form
          form={form}
          layout="vertical"
          disabled={saving}
          onFinish={handleCreate}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Nhập tên đăng nhập.",
              },
              { min: 8, message: "Tên đăng nhập cần ít nhất 8 ký tự." },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>

          <Form.Item name="fullName" label="Họ tên">
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Nhập email." },
              { type: "email", message: "Email không đúng định dạng." },
            ]}
          >
            <Input type="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, whitespace: true, message: "Nhập mật khẩu." },
              { min: 8, message: "Mật khẩu cần ít nhất 8 ký tự." },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Sửa thông tin ${editingEmployee?.username ?? ""}`}
        open={editingEmployee !== null}
        forceRender
        okText="Lưu thay đổi"
        cancelText="Hủy"
        confirmLoading={editSaving}
        onOk={() => editForm.submit()}
        onCancel={() => {
          if (!editSaving) setEditingEmployee(null);
        }}
      >
        {editError && (
          <Alert className="mb-4" type="error" showIcon title={editError} />
        )}

        <Form
          form={editForm}
          layout="vertical"
          disabled={editSaving}
          onFinish={handleEdit}
        >
          <Form.Item name="fullName" label="Họ tên">
            <Input maxLength={100} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Nhập email." },
              { type: "email", message: "Email không đúng định dạng." },
            ]}
          >
            <Input type="email" maxLength={100} />
          </Form.Item>
        </Form>
      </Modal>

      {tableError && (
        <Alert className="mb-4" type="error" showIcon title={tableError} />
      )}

      <Table<EmployeeResponse>
        rowKey="id"
        loading={Boolean(token) && !current}
        dataSource={data?.content ?? []}
        scroll={{ x: 620 }}
        locale={{ emptyText: "Chưa có nhân viên." }}
        columns={[
          { title: "Tên đăng nhập", dataIndex: "username" },
          {
            title: "Họ tên",
            dataIndex: "fullName",
            render: (value) => value || "—",
          },
          { title: "Email", dataIndex: "email" },
          {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            render: (value) =>
              value ? new Date(value).toLocaleDateString("vi-VN") : "—",
          },
          {
            title: "Trạng thái",
            dataIndex: "isActive",
            width: 128,
            render: (_, employee) => {
              const action = employee.isActive
                ? "Ngừng hoạt động"
                : "Kích hoạt lại";

              return (
                <Popconfirm
                  title={`${action} tài khoản ${employee.username}?`}
                  okText="Xác nhận"
                  cancelText="Hủy"
                  onConfirm={() => handleStatusChange(employee)}
                >
                  <span className="inline-flex">
                    <Switch
                      aria-label={`Trạng thái tài khoản ${employee.username}`}
                      checked={employee.isActive}
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                      loading={statusSavingId === employee.id}
                      disabled={statusSavingId !== null}
                    />
                  </span>
                </Popconfirm>
              );
            },
          },
          {
            title: "Thao tác",
            key: "actions",
            width: 104,
            render: (_, employee) => (
              <Tooltip title="Chỉnh sửa" trigger={["hover", "focus"]}>
                <Button
                  type="text"
                  aria-label={`Chỉnh sửa ${employee.username}`}
                  icon={<EditOutlined />}
                  onClick={() => openEditForm(employee)}
                />
              </Tooltip>
            ),
          },
        ]}
        pagination={{
          current: page + 1,
          pageSize: PAGE_SIZE,
          total: data?.totalElements ?? 0,
          showSizeChanger: false,
          onChange: (nextPage) => setPage(nextPage - 1),
        }}
      />
    </section>
  );
}

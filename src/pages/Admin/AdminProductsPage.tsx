import { useEffect, useState } from "react";
import { Alert, Table, Tag, Button, Select, Tooltip } from "antd";
import SearchField from '../../components/ui/SearchField';
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import AdminProductModal from "../../components/admin/AdminProductModal";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import {
  getAdminProducts,
  getAdminCategories,
} from "../../services/adminProducts";
import { staffErrorMessage } from "../../services/staffApi";
import { formatCurrency } from "../../utils/format";
import type { PageResponse, ProductResponse } from "../../types/api";
import type {
  AdminProductFilters,
  CategoryResponse,
} from "../../types/adminProduct";

const PAGE_SIZE = 20;

interface ProductResult {
  token: string;
  filters: AdminProductFilters;
  data?: PageResponse<ProductResponse>;
  error?: string;
}

interface CategoryResult {
  token: string;
  data?: CategoryResponse[];
  error?: string;
}

export default function AdminProductsPage() {
  const { session } = useStaffAuth();
  const token = session?.accessToken;

  const [filters, setFilters] = useState<AdminProductFilters>({
    page: 0,
    size: PAGE_SIZE,
  });
  const [result, setResult] = useState<ProductResult | null>(null);
  const [keyword, setKeyword] = useState("");
  const [editor, setEditor] = useState<{ id?: number } | null>(null);
  const [categoryResult, setCategoryResult] = useState<CategoryResult | null>(
    null,
  );

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    getAdminCategories(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setCategoryResult({ token, data });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setCategoryResult({ token, error: staffErrorMessage(cause) });
        }
      });

    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    getAdminProducts(token, filters, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ token, filters, data });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            token,
            filters,
            error: staffErrorMessage(cause),
          });
        }
      });

    return () => controller.abort();
  }, [token, filters]);

  const current =
    result?.token === token && result?.filters === filters ? result : null;

  const data = current?.data;

  const currentCategories =
    categoryResult?.token === token ? categoryResult : null;

  const pageError = current?.error ?? currentCategories?.error;

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div><h1>Thực đơn của quán</h1><p>Quản lý món, giá bán và công thức pha chế.</p></div>
        <Button type="primary" icon={<PlusOutlined aria-hidden="true" />} disabled={!currentCategories?.data?.length}
          onClick={() => setEditor({})}>Thêm món</Button>
      </div>

      {pageError && (
        <Alert className="mb-4" type="error" showIcon title={pageError} />
      )}

      <div className="admin-filter-bar">
        <SearchField
          className="w-full sm:w-72"
          label="Tìm theo tên món"
          placeholder="Tìm tên món…"
          value={keyword}
          onChange={setKeyword}
          onSearch={(value) =>
            setFilters((previous) => ({
              ...previous,
              keyword: value.trim(),
              page: 0,
            }))
          }
        />
        <Button onClick={() => setFilters(previous => ({ ...previous, keyword: keyword.trim(), page: 0 }))}>Tìm kiếm</Button>

        <Select<number>
          className="w-full sm:w-52"
          aria-label="Lọc theo danh mục"
          placeholder="Tất cả danh mục"
          allowClear
          value={filters.categoryId}
          loading={Boolean(token) && !currentCategories}
          options={(currentCategories?.data ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          onChange={(categoryId) =>
            setFilters((previous) => ({
              ...previous,
              categoryId,
              page: 0,
            }))
          }
        />

        <Select
          className="w-full sm:w-48"
          aria-label="Lọc theo trạng thái"
          value={
            filters.active === undefined
              ? "all"
              : filters.active
                ? "active"
                : "inactive"
          }
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "active", label: "Đang bán" },
            { value: "inactive", label: "Ngừng bán" },
          ]}
          onChange={(value) =>
            setFilters((previous) => ({
              ...previous,
              active: value === "all" ? undefined : value === "active",
              page: 0,
            }))
          }
        />

        <Button
          onClick={() => {
            setKeyword("");
            setFilters({ page: 0, size: PAGE_SIZE });
          }}
        >
          Đặt lại
        </Button>
      </div>

      <Table<ProductResponse>
        rowKey="id"
        loading={Boolean(token) && !current}
        dataSource={data?.content ?? []}
        scroll={{ x: 650 }}
        locale={{ emptyText: "Không có món phù hợp." }}
        columns={[
          { title: "Tên món", dataIndex: "name" },
          {
            title: "Danh mục",
            dataIndex: "categoryName",
            render: (value) => value || "—",
          },
          {
            title: "Giá",
            dataIndex: "price",
            align: "right",
            render: (value: number) => formatCurrency(value),
          },
          {
            title: "Trạng thái",
            dataIndex: "isActive",
            render: (active: boolean) => (
              <Tag color={active ? "green" : "default"}>
                {active ? "Đang bán" : "Ngừng bán"}
              </Tag>
            ),
          },
          {
            title: "Thao tác",
            key: "actions",
            render: (_, product) => <Tooltip title="Chỉnh sửa món và công thức">
              <Button icon={<EditOutlined aria-hidden="true" />} aria-label={`Chỉnh sửa ${product.name}`}
                disabled={!currentCategories?.data?.length} onClick={() => setEditor({ id: product.id })} />
            </Tooltip>,
          },
        ]}
        pagination={{
          current: (filters.page ?? 0) + 1,
          pageSize: PAGE_SIZE,
          total: data?.totalElements ?? 0,
          showSizeChanger: false,
          onChange: (nextPage) =>
            setFilters((previous) => ({
              ...previous,
              page: nextPage - 1,
            })),
        }}
      />
      {editor && token && <AdminProductModal key={`${token}:${editor.id ?? "new"}`} token={token}
        productId={editor.id} categories={currentCategories?.data ?? []} onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          setFilters(previous => ({ ...previous, page: editor.id === undefined ? 0 : previous.page }));
        }} />}
    </section>
  );
}

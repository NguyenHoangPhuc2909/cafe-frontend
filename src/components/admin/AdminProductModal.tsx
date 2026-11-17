import { useEffect, useState } from "react";
import { Alert, Button, Form, Input, InputNumber, Modal, Select, Spin, Switch } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getAdminProduct, getRecipeIngredients, saveAdminProduct } from "../../services/adminProducts";
import { staffErrorMessage } from "../../services/staffApi";
import type { CategoryResponse, IngredientOptionResponse, SaveAdminProductRequest } from "../../types/adminProduct";
import { recipeConfigurationError } from "../../utils/adminProduct";

interface Props {
  token: string;
  productId?: number;
  categories: CategoryResponse[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AdminProductModal({ token, productId, categories, onClose, onSaved }: Props) {
  const [form] = Form.useForm<SaveAdminProductRequest>();
  const [ingredients, setIngredients] = useState<IngredientOptionResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const productType = Form.useWatch(["product", "productType"], form);
  const sizeEnabled = Form.useWatch(["product", "sizeEnabled"], form);
  const packaged = productType === "PACKAGED";
  const loading = ingredients === null && !loadError;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getRecipeIngredients(token, controller.signal),
      productId === undefined ? Promise.resolve(null) : getAdminProduct(token, productId, controller.signal),
    ]).then(([options, detail]) => {
      if (controller.signal.aborted) return;
      if (detail) form.setFieldsValue({ product: detail.product, recipes: detail.recipes });
      setIngredients(options);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setLoadError(staffErrorMessage(cause));
    });
    return () => controller.abort();
  }, [token, productId, form]);

  async function handleSave(values: SaveAdminProductRequest) {
    if (saving || loading || loadError) return;
    const request = {
      product: {
        ...values.product,
        name: values.product.name.trim(),
        unit: values.product.unit.trim(),
        sizeEnabled: values.product.productType === "MADE_TO_ORDER" && Boolean(values.product.sizeEnabled),
      },
      recipes: values.product.productType === "PACKAGED" ? [] : values.recipes,
    };
    const error = recipeConfigurationError(request);
    setSaveError(error);
    if (error) return;
    setSaving(true);
    try {
      await saveAdminProduct(token, request, productId);
      onSaved();
    } catch (cause: unknown) {
      setSaveError(staffErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={productId === undefined ? "Thêm món" : "Chỉnh sửa món và công thức"}
      width={780} onCancel={onClose} onOk={() => form.submit()} okText="Lưu món" cancelText="Hủy"
      confirmLoading={saving} okButtonProps={{ disabled: loading || Boolean(loadError) }}
      cancelButtonProps={{ disabled: saving }} closable={!saving} maskClosable={!saving} keyboard={!saving}>
      {loadError && <Alert type="error" showIcon title={loadError} className="mb-4" />}
      {saveError && <Alert type="error" showIcon title={saveError} className="mb-4" />}
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" disabled={saving || loading || Boolean(loadError)} onFinish={handleSave}
          initialValues={{ product: { productType: "MADE_TO_ORDER", sizeEnabled: false, unit: "ly" }, recipes: [{ size: "M" }] }}>
          <Form.Item name={["product", "name"]} label="Tên món" rules={[{ required: true, whitespace: true, message: "Nhập tên món." }, { max: 255 }]}>
            <Input maxLength={255} />
          </Form.Item>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name={["product", "categoryId"]} label="Danh mục" rules={[{ required: true, message: "Chọn danh mục." }]}>
              <Select options={categories.map(category => ({ value: category.id, label: category.name }))} />
            </Form.Item>
            <Form.Item name={["product", "productType"]} label="Loại món" rules={[{ required: true }]}>
              <Select disabled={productId !== undefined || saving || loading || Boolean(loadError)}
                options={[{ value: "MADE_TO_ORDER", label: "Pha chế / chế biến" }, { value: "PACKAGED", label: "Đóng gói sẵn" }]}
                onChange={value => form.setFieldValue("recipes", value === "PACKAGED" ? [] : [{ size: "M" }])} />
            </Form.Item>
            <Form.Item name={["product", "price"]} label={sizeEnabled && !packaged ? "Giá size M (đ)" : "Giá bán (đ)"}
              rules={[{ required: true, message: "Nhập giá bán." }]}>
              <InputNumber className="w-full" min={0} max={9999999999.99} precision={2} />
            </Form.Item>
            <Form.Item name={["product", "unit"]} label="Đơn vị bán" rules={[{ required: true, whitespace: true, message: "Nhập đơn vị, ví dụ: ly, chai, cái." }, { max: 20 }]}>
              <Input maxLength={20} placeholder="ly, chai, cái..." />
            </Form.Item>
          </div>
          {!packaged && <Form.Item name={["product", "sizeEnabled"]} valuePropName="checked" label="Cho phép chọn size M / L"
            extra="Size L cộng 10.000đ so với M. Tắt lựa chọn này sẽ bỏ các dòng công thức L.">
            <Switch checkedChildren="ON" unCheckedChildren="OFF" onChange={enabled => {
              if (!enabled) form.setFieldValue("recipes", (form.getFieldValue("recipes") ?? []).filter((row: { size: string }) => row.size !== "L"));
            }} />
          </Form.Item>}
          <Form.Item name={["product", "description"]} label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name={["product", "imageUrl"]} label="Đường dẫn ảnh"><Input placeholder="https://..." /></Form.Item>
          {packaged ? <Alert type="info" showIcon title="Món đóng gói dùng tồn kho sản phẩm, không sử dụng công thức nguyên liệu." /> : <>
            <h3 className="mb-2 font-semibold">Công thức cho 1 phần</h3>
            <p className="mb-3 text-sm text-on-surface-variant">Nhập định lượng theo đơn vị của nguyên liệu. Mặc định là M; khi bật M/L, cần nhập đủ cả hai size. Ly mang đi được trừ tự động.</p>
            <Form.List name="recipes">
              {(fields, { add, remove }) => <>
                {fields.map(({ key, name, ...rest }) => <div key={key} className="mb-2 flex flex-wrap items-start gap-2 rounded border border-gray-200 p-3">
                  <Form.Item {...rest} name={[name, "ingredientId"]} label="Nguyên liệu" className="mb-0 min-w-44 flex-1"
                    rules={[{ required: true, message: "Chọn nguyên liệu." }]}>
                    <Select showSearch optionFilterProp="label" placeholder="Chọn nguyên liệu"
                      options={(ingredients ?? []).map(ingredient => ({ value: ingredient.id, label: `${ingredient.name} (${ingredient.unit})` }))} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "quantity"]} label="Định lượng" className="mb-0 w-32"
                    rules={[{ required: true, message: "Nhập định lượng." }, { type: "number", min: Number.MIN_VALUE, message: "Phải lớn hơn 0." }]}>
                    <InputNumber min={0} className="w-full" />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "size"]} label="Size" className="mb-0 w-20" rules={[{ required: true }]}>
                    <Select options={(sizeEnabled ? ["M", "L"] : ["M"]).map(size => ({ value: size, label: size }))} />
                  </Form.Item>
                  <Button className="mt-7" danger icon={<DeleteOutlined />} aria-label={`Xóa nguyên liệu dòng ${name + 1}`} onClick={() => remove(name)} />
                </div>)}
                <Button icon={<PlusOutlined />} onClick={() => add({ size: "M" })} disabled={!ingredients?.length || saving || loading}>Thêm nguyên liệu</Button>
              </>}
            </Form.List>
            {ingredients?.length === 0 && <p className="mt-2 text-warning">Chưa có nguyên liệu. Cần tạo nguyên liệu trước khi lưu món pha chế.</p>}
          </>}
        </Form>
      </Spin>
    </Modal>
  );
}

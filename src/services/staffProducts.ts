import type { ApiResponse, ProductResponse } from "../types/api.ts";
import { toProduct } from "../utils/products.ts";
import { http } from "./http.ts";

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function getStaffProducts(token: string, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<ProductResponse[]>>(
    "/staff/products",
    {
      headers: headers(token),
      signal,
    },
  );
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || "Danh sách món chưa hợp lệ.");
  }
  const products = data.data.map((product) => {
    if (typeof product.isActive !== "boolean")
      throw new Error("Trạng thái món chưa hợp lệ.");
    return toProduct(product);
  });
  if (new Set(products.map((product) => product.id)).size !== products.length) {
    throw new Error("Danh sách món bị trùng ID.");
  }
  return products;
}

export async function updateProductActive(
  token: string,
  id: number | string,
  active: boolean,
  signal?: AbortSignal,
) {
  const { data } = await http.patch<ApiResponse<ProductResponse>>(
    `/staff/products/${id}/active`,
    { active },
    {
      headers: headers(token),
      signal,
    },
  );
  if (!data.success)
    throw new Error(data.message || "Chưa cập nhật được trạng thái món.");
  if (
    !data.data ||
    String(data.data.id) !== String(id) ||
    data.data.isActive !== active
  ) {
    throw new Error(
      "Chưa xác nhận được trạng thái món. Vui lòng kiểm tra lại.",
    );
  }
  return toProduct(data.data);
}

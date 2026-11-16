import type {
  ApiResponse,
  PageResponse,
  ProductResponse,
} from "../types/api";
import type {
  AdminProductFilters, CategoryResponse, AdminProductDetailResponse,
  IngredientOptionResponse, SaveAdminProductRequest,
} from "../types/adminProduct";
import { http } from "./http";

export async function getAdminProducts(
  token: string,
  filters: AdminProductFilters = {},
  signal?: AbortSignal,
): Promise<PageResponse<ProductResponse>> {
  const { data } = await http.get<ApiResponse<PageResponse<ProductResponse>>>(
    "/admin/products",
    {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        ...filters,
        page: filters.page ?? 0,
        size: filters.size ?? 20,
      },
      signal,
    },
  );

  if (!data.success || !data.data || !Array.isArray(data.data.content)) {
    throw new Error(data.message || "Không tải được danh sách món.");
  }

  return data.data;
}

export async function getAdminCategories(
  token: string,
  signal?: AbortSignal,
): Promise<CategoryResponse[]> {
  const { data } = await http.get<ApiResponse<CategoryResponse[]>>(
    "/admin/categories",
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );

  if (!data.success || !data.data || !Array.isArray(data.data)) {
    throw new Error(data.message || "Không tải được danh mục.");
  }

  return data.data;
}

export async function getAdminProduct(token: string, id: number, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<AdminProductDetailResponse>>(
    `/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` }, signal },
  );
  if (!data.success || !data.data) {
    throw new Error(data.message || "Không tải được thông tin món.");
  }
  return data.data;
}

export async function getRecipeIngredients(token: string, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<IngredientOptionResponse[]>>(
    "/admin/ingredients", { headers: { Authorization: `Bearer ${token}` }, signal },
  );
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || "Không tải được nguyên liệu.");
  }
  return data.data;
}

export async function saveAdminProduct(token: string, request: SaveAdminProductRequest, id?: number) {
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = id === undefined
    ? await http.post<ApiResponse<AdminProductDetailResponse>>("/admin/products", request, options)
    : await http.put<ApiResponse<AdminProductDetailResponse>>(`/admin/products/${id}`, request, options);
  if (!data.success || !data.data) {
    throw new Error(data.message || "Không lưu được món.");
  }
  return data.data;
}

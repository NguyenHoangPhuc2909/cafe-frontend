import type {
  EmployeeResponse,
  CreateEmployeeRequest,
  CreateEmployeeResponse,
  UpdateEmployeeRequest,
} from "../types/employee";
import type { ApiResponse, PageResponse } from "../types/api";
import { http } from "./http";

export async function getEmployees(
  token: string,
  page = 0,
  size = 20,
  signal?: AbortSignal,
): Promise<PageResponse<EmployeeResponse>> {
  const { data } = await http.get<ApiResponse<PageResponse<EmployeeResponse>>>(
    "/admin/employees",
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, size },
      signal,
    },
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || "Không tải được danh sách nhân viên.");
  }

  return data.data;
}

export async function createEmployee(
  token: string,
  request: CreateEmployeeRequest,
): Promise<CreateEmployeeResponse> {
  const { data } = await http.post<ApiResponse<CreateEmployeeResponse>>(
    "/auth/register",
    request,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || "Không tạo được tài khoản nhân viên.");
  }

  return data.data;
}

export async function updateEmployee(
  token: string,
  id: number,
  request: UpdateEmployeeRequest,
): Promise<EmployeeResponse> {
  const { data } = await http.patch<ApiResponse<EmployeeResponse>>(
    `/admin/employees/${id}`,
    request,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || "Không cập nhật được thông tin nhân viên.");
  }

  return data.data;
}

export async function updateEmployeeStatus(
  token: string,
  id: number,
  isActive: boolean,
): Promise<EmployeeResponse> {
  const { data } = await http.patch<ApiResponse<EmployeeResponse>>(
    `/admin/employees/${id}/status`,
    { isActive },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || "Không đổi được trạng thái tài khoản.");
  }

  return data.data;
}

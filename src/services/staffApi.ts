import axios from 'axios';
import type { ApiResponse } from '../types/api.ts';
import type { TableSessionResponse } from '../types/guest.ts';
import type { StaffTableOverview } from '../types/staffApi.ts';
import { toStaffSession, toStaffTable } from '../utils/staffTables.ts';
import { http } from './http.ts';

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
const NO_OPEN_SESSION = 'Bàn chưa có phiên phục vụ đang mở';
function unwrap<T>(response: ApiResponse<T>): T {
  if (!response?.success || response.data == null) throw new Error(response?.message || 'Phản hồi chưa hợp lệ.');
  return response.data;
}

export async function signInStaff(username: string, password: string) {
  const { data } = await http.post<ApiResponse<unknown>>('/auth/login', { username: username.trim(), password });
  return toStaffSession(unwrap(data));
}

export async function getStaffTables(token: string, signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<unknown[]>>('/staff/tables', { headers: headers(token), signal });
  const values = unwrap(data);
  if (!Array.isArray(values)) throw new Error('Danh sách bàn chưa hợp lệ.');
  const tables = values.map(toStaffTable).sort((left, right) => left.id - right.id);
  if (new Set(tables.map(table => table.id)).size !== tables.length) throw new Error('Danh sách bàn bị trùng ID.');
  return tables;
}

export function isStaffAccessError(error: unknown) {
  return axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
}

export function isCurrentStaffAuthFailure(error: unknown, token: string) {
  if (!isStaffAccessError(error) || !axios.isAxiosError(error) || !error.config?.url?.startsWith('/staff/')) return false;
  return axios.AxiosHeaders.from(error.config.headers).get('Authorization') === `Bearer ${token}`;
}

export function staffErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.message;
    if (typeof message === 'string' && message.length < 500) return message;
    if (isStaffAccessError(error)) return 'Phiên đăng nhập đã hết hạn hoặc tài khoản không có quyền. Vui lòng đăng nhập lại.';
    return 'Chưa kết nối được BE. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export async function getStaffCurrentSession(token: string, tableId: number, signal?: AbortSignal) {
  try {
    const { data } = await http.get<ApiResponse<TableSessionResponse>>(`/staff/tables/${tableId}/sessions/current`, { headers: headers(token), signal });
    const session = unwrap(data);
    if (!Number.isSafeInteger(session.id) || session.id < 1 || session.tableId !== tableId || session.status !== 'OPEN') {
      throw new Error('Phiên bàn trả về chưa hợp lệ.');
    }
    return session;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404 && error.response.data?.message === NO_OPEN_SESSION) return null;
    throw error;
  }
}

export async function getStaffTableOverview(token: string, signal?: AbortSignal) {
  const tables = await getStaffTables(token, signal);
  const rows: StaffTableOverview[] = [];
  for (let offset = 0; offset < tables.length; offset += 4) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const chunk = await Promise.all(tables.slice(offset, offset + 4).map(async table => {
      if (!table.isActive) return { table, session: null, sessionError: null };
      try { return { table, session: await getStaffCurrentSession(token, table.id, signal), sessionError: null }; }
      catch (error) {
        if (isStaffAccessError(error) || signal?.aborted) throw error;
        return { table, session: null, sessionError: staffErrorMessage(error) };
      }
    }));
    rows.push(...chunk);
  }
  return rows;
}

export async function openStaffTableSession(token: string, tableId: number) {
  const { data } = await http.post<ApiResponse<TableSessionResponse>>(`/staff/tables/${tableId}/sessions`, undefined, { headers: headers(token) });
  const session = unwrap(data);
  if (!Number.isSafeInteger(session.id) || session.id < 1 || session.tableId !== tableId || session.status !== 'OPEN') {
    throw new Error('Chưa xác nhận được kết quả mở phiên. Vui lòng tải lại sơ đồ bàn trước khi thử lại.');
  }
  return session;
}

import type { ApiResponse } from '../types/api.ts';
import type { AdminTable, SaveAdminTable } from '../types/adminTable.ts';
import { http } from './http.ts';

function parseAdminTable(raw: unknown): AdminTable {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu bàn từ máy chủ chưa hợp lệ.');
  }
  const item = raw as Record<string, unknown>;
  const validSessionId =
    item.openSessionId === null ||
    (typeof item.openSessionId === 'number' &&
      Number.isSafeInteger(item.openSessionId) &&
      item.openSessionId > 0);

  if (
    typeof item.id !== 'number' ||
    !Number.isSafeInteger(item.id) ||
    item.id <= 0 ||
    typeof item.name !== 'string' ||
    !item.name.trim() ||
    typeof item.qrCode !== 'string' ||
    !item.qrCode.trim() ||
    typeof item.isActive !== 'boolean' ||
    typeof item.hasOpenSession !== 'boolean' ||
    !validSessionId ||
    (item.hasOpenSession && item.openSessionId === null) ||
    typeof item.hasSessionHistory !== 'boolean' ||
    typeof item.canDeactivate !== 'boolean' ||
    typeof item.deletable !== 'boolean'
  ) {
    throw new Error('Dữ liệu bàn từ máy chủ chưa hợp lệ.');
  }

  return {
    id: item.id,
    name: item.name,
    qrCode: item.qrCode,
    isActive: item.isActive,
    hasOpenSession: item.hasOpenSession,
    openSessionId: item.openSessionId as number | null,
    hasSessionHistory: item.hasSessionHistory,
    canDeactivate: item.canDeactivate,
    deletable: item.deletable,
  };
}

export async function getAdminTables(
  token: string,
  signal?: AbortSignal,
): Promise<AdminTable[]> {
  const { data } = await http.get<ApiResponse<AdminTable[]>>('/admin/tables', {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!data?.success || !Array.isArray(data.data)) {
    throw new Error(data?.message || 'Chưa tải được danh sách bàn.');
  }

  return data.data.map(parseAdminTable);
}

export async function saveAdminTable(
  token: string,
  input: SaveAdminTable,
  id?: number,
): Promise<AdminTable> {
  const payload = { name: input.name.trim() };
  const headers = { Authorization: `Bearer ${token}` };
  const { data } =
    id === undefined
      ? await http.post<ApiResponse<AdminTable>>('/admin/tables', payload, { headers })
      : await http.put<ApiResponse<AdminTable>>(`/admin/tables/${id}`, payload, { headers });

  if (!data?.success || !data.data) {
    throw new Error(data?.message || 'Không lưu được thông tin bàn.');
  }

  const saved = parseAdminTable(data.data);
  if (id !== undefined && saved.id !== id) {
    throw new Error('Chưa xác nhận được bàn vừa cập nhật.');
  }
  return saved;
}

export async function updateAdminTableStatus(
  token: string,
  id: number,
  isActive: boolean,
): Promise<AdminTable> {
  const { data } = await http.patch<ApiResponse<AdminTable>>(
    `/admin/tables/${id}/status`,
    { isActive },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!data?.success || !data.data) {
    throw new Error(data?.message || 'Không đổi được trạng thái bàn.');
  }

  const saved = parseAdminTable(data.data);
  if (saved.id !== id || saved.isActive !== isActive) {
    throw new Error('Chưa xác nhận được trạng thái mới của bàn.');
  }
  return saved;
}

export async function deleteAdminTable(token: string, id: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<null>>(`/admin/tables/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!data?.success) {
    throw new Error(data?.message || 'Không xóa được bàn.');
  }
}

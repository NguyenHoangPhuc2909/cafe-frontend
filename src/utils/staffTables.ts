import type { CafeTableResponse } from '../types/guest.ts';
import type { StaffSession, StaffTableFilter, StaffTableOverview } from '../types/staffApi.ts';

export function toStaffSession(value: unknown): StaffSession {
  if (!value || typeof value !== 'object') throw new Error('Phản hồi đăng nhập chưa hợp lệ.');
  const data = value as Record<string, unknown>;
  if (data.role !== 'STAFF' && data.role !== 'ADMIN') throw new Error('Tài khoản cần có quyền STAFF hoặc ADMIN để vào hệ thống nhân viên.');
  if (typeof data.accessToken !== 'string' || !data.accessToken || typeof data.username !== 'string' || !data.username) {
    throw new Error('Chưa nhận được phiên đăng nhập hợp lệ.');
  }
  return { accessToken: data.accessToken, username: data.username, role: data.role };
}

export function restoreStaffSession(raw: string | null): StaffSession | null {
  try { return toStaffSession(JSON.parse(raw ?? 'null')); } catch { return null; }
}

export function toStaffTable(value: unknown): CafeTableResponse {
  if (!value || typeof value !== 'object') throw new Error('Thông tin bàn chưa hợp lệ.');
  const data = value as Record<string, unknown>;
  const active = data.active ?? data.isActive;
  if (typeof data.id !== 'number' || !Number.isSafeInteger(data.id) || data.id < 1
    || typeof data.name !== 'string' || !data.name.trim() || typeof data.qrCode !== 'string'
    || typeof active !== 'boolean') throw new Error('Thông tin bàn chưa hợp lệ.');
  return { id: data.id, name: data.name, qrCode: data.qrCode, isActive: active };
}

export function tableState(row: StaffTableOverview): Exclude<StaffTableFilter, 'all'> {
  if (!row.table.isActive) return 'inactive';
  if (row.sessionError) return 'unknown';
  return row.session ? 'open' : 'idle';
}

export function filterStaffTables(rows: StaffTableOverview[], filter: StaffTableFilter, query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
  return rows.filter(row => (filter === 'all' || tableState(row) === filter)
    && normalize(row.table.name + ' ' + row.table.id).includes(normalize(query.trim())));
}

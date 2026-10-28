import type { CafeTableResponse, TableSessionResponse } from './guest';

export interface StaffSession {
  accessToken: string;
  username: string;
  role: 'STAFF' | 'ADMIN';
}

export interface StaffTableOverview {
  table: CafeTableResponse;
  session: TableSessionResponse | null;
  sessionError: string | null;
}

export type StaffTableFilter = 'all' | 'open' | 'idle' | 'inactive' | 'unknown';

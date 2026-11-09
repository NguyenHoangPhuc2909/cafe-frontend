import type { CafeTableResponse, TableSessionResponse } from './guest';
import type { OrderPaymentStatus, OrderStatus, OrderType } from './order';
import type { GuestOrderRequest } from './guest';

export interface StaffOrderRequest extends GuestOrderRequest {
  orderType: OrderType;
}

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

export interface StaffOrderQuery {
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  sessionId?: number;
  page?: number;
  size?: number;
}

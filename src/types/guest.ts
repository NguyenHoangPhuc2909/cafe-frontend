import type { OrderResponse } from "./order";

export interface CafeTableResponse {
  id: number;
  name: string;
  qrCode: string;
  isActive: boolean;
}

export interface TableAccess {
  sessionId: number;
  tableId: number;
  tableName: string;
  accessToken: string;
  expiresAt: string;
}

export interface TableSessionResponse {
  id: number;
  tableId: number;
  tableName: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
}

export interface GuestOrderRequest {
  items: { productId: number; quantity: number }[];
  note: string;
}

export interface GuestOrderResponse extends OrderResponse {
  sessionId: number;
  tableId: number;
  tableName: string;
  paymentExpiresAt: string;
}

export interface OrderAttempt {
  state: 'sending' | 'unknown' | 'success';
  tableName: string;
  sessionId: number;
  startedAt: string;
  order?: GuestOrderResponse;
}

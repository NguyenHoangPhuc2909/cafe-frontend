import type { PageResponse } from './api';

export type CashMovementType = 'TOP_UP' | 'PAYOUT';
export interface CashMovementRequest {
  requestId: string;
  businessDate: string;
  type: CashMovementType;
  amount: number;
  note: string;
}
export interface CashReconciliationRequest {
  requestId: string;
  businessDate: string;
  expectedRevision: number;
  expectedPaymentCount: number;
  expectedLastPaymentId: number;
  actualAmount: number;
  note: string;
}
export interface CashMovement {
  id: number;
  businessDate: string;
  type: CashMovementType;
  amount: number;
  note: string;
  performedById: number;
  performedByName: string;
  createdAt: string;
}
export interface CashDay {
  businessDate: string;
  timeZone: string;
  updatedAt: string;
  openingAmount: number;
  cashSales: number;
  cashPaymentCount: number;
  lastPaymentId: number;
  revision: number;
  topUps: number;
  payouts: number;
  expectedAmount: number;
  movements: PageResponse<CashMovement>;
}
export interface CashReconciliation {
  id: number;
  businessDate: string;
  performedById: number;
  performedByName: string;
  createdAt: string;
  openingAmount: number;
  cashSales: number;
  cashPaymentCount: number;
  lastPaymentId: number;
  revision: number;
  topUps: number;
  payouts: number;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  note: string;
}

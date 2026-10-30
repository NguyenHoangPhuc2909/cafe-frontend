export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export interface PaymentResponse {
  id: number;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  confirmedById: number;
}
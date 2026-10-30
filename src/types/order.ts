export type OrderPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface OrderItemResponse {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  toppingNames: string[] | null;
}

export interface OrderResponse {
  id: number;
  sessionId: number | null;
  tableId: number | null;
  tableName: string | null;
  totalAmount: number;
  status: string;
  paymentStatus: OrderPaymentStatus;
  paymentExpiresAt: string | null;
  createdAt: string;
  items: OrderItemResponse[];
}
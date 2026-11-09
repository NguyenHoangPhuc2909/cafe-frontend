import type { DrinkSize } from './productSize';
import type { DrinkCustomization } from './drinkOptions';

export type OrderPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type OrderType = 'DINE_IN' | 'TAKEAWAY';

export type OrderStatus = 'PENDING' | 'PREPARING'  | 'COMPLETED' | 'EXPIRED';

export interface OrderItemResponse extends DrinkCustomization {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  size?: DrinkSize | null;
}

export interface OrderResponse {
  id: number;
  sessionId: number | null;
  tableId: number | null;
  tableName: string | null;
  orderType?: OrderType | null;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentExpiresAt: string | null;
  createdAt: string;
  items: OrderItemResponse[];
}

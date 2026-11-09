import type { PageResponse } from './api';
import type { PaymentMethod } from './payment';

export interface PersonalRevenue {
  date: string;
  timeZone: string;
  updatedAt: string;
  totalAmount: number;
  paymentCount: number;
  methods: { method: PaymentMethod; amount: number; paymentCount: number }[];
  payments: PageResponse<{ id: number; orderId: number; method: PaymentMethod; amount: number; paidAt: string }>;
}

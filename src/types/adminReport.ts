export type ReportPaymentMethod = 'CASH' | 'BANK_TRANSFER';

export interface AdminMethodBreakdown {
  method: ReportPaymentMethod;
  amount: number;
  paymentCount: number;
}

export interface DailyRevenuePoint {
  date: string;
  revenue: number;
  cashRevenue: number;
  bankTransferRevenue: number;
  paymentCount: number;
}

export interface TopProductItem {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface AdminRevenueReport {
  fromDate: string;
  toDate: string;
  timeZone: string;
  generatedAt: string;
  totalRevenue: number;
  paymentCount: number;
  averageOrderValue: number;
  methods: AdminMethodBreakdown[];
  daily: DailyRevenuePoint[];
  topProducts: TopProductItem[];
}

export interface AdminRevenueReportQuery {
  fromDate?: string;
  toDate?: string;
  topLimit?: number;
}

export interface DashboardRevenueSummary {
  totalRevenue: number;
  completedPaymentCount: number;
  cashRevenue: number;
  bankTransferRevenue: number;
}

export interface DashboardOrderSummary {
  total: number;
  pending: number;
  preparing: number;
  completed: number;
  expired: number;
}

export interface DashboardTableSummary {
  total: number;
  activeTotal: number;
  openCount: number;
  idleCount: number;
  inactiveCount: number;
}

export interface LowStockAlertItem {
  itemType: 'INGREDIENT' | 'PACKAGED';
  id: number;
  name: string;
  unit: string | null;
  stockQuantity: number;
  minThreshold: number | null;
  outOfStock: boolean;
}

export interface DashboardLowStockSummary {
  lowIngredientCount: number;
  outOfStockIngredientCount: number;
  outOfStockPackagedCount: number;
  totalAlerts: number;
  items: LowStockAlertItem[];
}

export interface DashboardTrendPoint {
  date: string;
  revenue: number;
  paymentCount: number;
}

export interface AdminDashboardSummary {
  businessDate: string;
  timeZone: string;
  generatedAt: string;
  todayRevenue: DashboardRevenueSummary;
  todayOrders: DashboardOrderSummary;
  tables: DashboardTableSummary;
  lowStock: DashboardLowStockSummary;
  recentRevenue: DashboardTrendPoint[];
}

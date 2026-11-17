// Isolated visual fixture. It is not imported by the application or production build.
// The adapter serves local GET fixtures and rejects every mutation without network access.
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StaffAuthContext } from '../../src/contexts/staffAuth';
import UIProvider from '../../src/components/ui/UIProvider';
import StaffLayout from '../../src/layouts/StaffLayout';
import AdminLayout from '../../src/layouts/AdminLayout';
import POSPage from '../../src/pages/Staff/POSPage';
import StaffOrdersPage from '../../src/pages/Staff/StaffOrdersPage';
import StaffTablesPage from '../../src/pages/Staff/StaffTablesPage';
import StaffInventoryPage from '../../src/pages/Staff/StaffInventoryPage';
import StaffRevenuePage from '../../src/pages/Staff/StaffRevenuePage';
import AdminDashboardPage from '../../src/pages/Admin/AdminDashboardPage';
import AdminProductsPage from '../../src/pages/Admin/AdminProductsPage';
import AdminEmployeesPage from '../../src/pages/Admin/AdminEmployeesPage';
import AdminReportsPage from '../../src/pages/Admin/AdminReportsPage';
import { http } from '../../src/services/http';
import type { ProductResponse } from '../../src/types/api';
import type { OrderResponse } from '../../src/types/order';
import '../../src/index.css';
import '../../src/styles/atelier.css';

const products: ProductResponse[] = [
  { id: 1, name: 'Cà phê trứng', price: 45000, description: 'Cà phê đậm đà, kem trứng mịn.', imageUrl: '/images/ca_phe_trung.png', isActive: true, categoryId: 1, categoryName: 'Cà phê', sizes: [{ size: 'M', price: 45000 }, { size: 'L', price: 55000 }] },
  { id: 2, name: 'Caramel macchiato', price: 55000, description: 'Espresso cùng sữa và caramel.', imageUrl: '/images/caramel_macchiato.png', isActive: true, categoryId: 1, categoryName: 'Cà phê' },
  { id: 3, name: 'Trà đào cam sả thanh mát', price: 40000, description: 'Trà trái cây, vị thanh nhẹ.', imageUrl: null, isActive: true, categoryId: 2, categoryName: 'Trà' },
  { id: 4, name: 'Bánh croissant', price: 35000, description: 'Bánh bơ thơm, lớp vỏ giòn.', imageUrl: null, isActive: false, categoryId: 3, categoryName: 'Bánh' },
  { id: 5, name: 'Cà phê sữa đá', price: 30000, description: 'Cà phê pha phin và sữa đặc.', imageUrl: null, isActive: true, categoryId: 1, categoryName: 'Cà phê' },
  { id: 6, name: 'Nước suối', price: 15000, description: 'Chai 500ml.', imageUrl: null, isActive: true, categoryId: 4, categoryName: 'Nước đóng chai' },
];
const now = new Date().toISOString();
const orders: OrderResponse[] = [
  { id: 101, sessionId: 1, tableId: 1, tableName: 'Bàn 01', orderType: 'DINE_IN', totalAmount: 90000, status: 'PENDING', paymentStatus: 'UNPAID', createdAt: now, paymentExpiresAt: new Date(Date.now() + 900000).toISOString(), items: [{ id: 1, productName: 'Cà phê trứng', price: 45000, quantity: 2, size: 'M' }] },
  { id: 102, sessionId: null, tableId: null, tableName: null, orderType: 'TAKEAWAY', totalAmount: 55000, status: 'PREPARING', paymentStatus: 'PAID', createdAt: now, paymentExpiresAt: null, items: [{ id: 2, productName: 'Caramel macchiato', price: 55000, quantity: 1 }] },
  { id: 103, sessionId: 2, tableId: 2, tableName: 'Bàn 02', orderType: 'DINE_IN', totalAmount: 40000, status: 'COMPLETED', paymentStatus: 'PAID', createdAt: now, paymentExpiresAt: null, items: [{ id: 3, productName: 'Trà đào cam sả thanh mát', price: 40000, quantity: 1 }] },
];
const ingredients = [
  { id: 1, name: 'Cà phê hạt', unit: 'g', stockQuantity: 2500, minThreshold: 500 },
  { id: 2, name: 'Sữa tươi', unit: 'ml', stockQuantity: 800, minThreshold: 1000 },
  { id: 3, name: 'Trà đen', unit: 'g', stockQuantity: 0, minThreshold: 200 },
];
const page = <T,>(content: T[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: content.length ? 1 : 0, last: true });
const empty = new URLSearchParams(location.search).get('state') === 'empty';
http.defaults.adapter = async config => {
  if (config.method !== 'get') throw new Error('Bản xem thiết kế không gửi thao tác thay đổi dữ liệu.');
  const url = config.url ?? '';
  let data: unknown;
  if (url === '/staff/products') data = empty ? [] : products;
  else if (url === '/admin/products') data = page(empty ? [] : products);
  else if (url === '/admin/categories') data = [{ id: 1, name: 'Cà phê', type: 'PREPARED' }, { id: 2, name: 'Trà', type: 'PREPARED' }];
  else if (url === '/admin/ingredients' || url === '/staff/ingredients') data = empty ? [] : ingredients;
  else if (url === '/admin/employees') data = page(empty ? [] : [{ id: 1, username: 'nhanvien01', fullName: 'Nhân viên mẫu', email: 'preview@example.test', role: 'STAFF', isActive: true, createdAt: now }]);
  else if (url === '/staff/tables') data = empty ? [] : Array.from({length: 8}, (_, i) => ({ id: i + 1, name: `Bàn ${String(i + 1).padStart(2, '0')}`, qrCode: `preview-${i + 1}`, isActive: i !== 7 }));
  else if (/\/staff\/tables\/\d+\/sessions\/current/.test(url)) { const id = Number(url.split('/')[3]); data = { id, tableId: id, tableName: `Bàn ${id}`, status: 'OPEN', openedAt: now }; }
  else if (url === '/staff/orders') data = page(empty ? [] : config.params?.status === 'PREPARING' ? orders.filter(o => o.status === 'PREPARING') : orders);
  else if (/\/staff\/orders\/\d+$/.test(url)) data = orders.find(o => o.id === Number(url.split('/').at(-1)));
  else if (url === '/staff/inventory/packaged') data = empty ? [] : [{ id: 6, name: 'Nước suối', unit: 'chai', stockQuantity: 20, isActive: true }];
  else if (url === '/staff/inventory/receipts') data = page([]);
  else if (url === '/staff/revenue/today') data = { date: '2026-11-17', timeZone: 'Asia/Ho_Chi_Minh', updatedAt: now, totalAmount: empty ? 0 : 95000, paymentCount: empty ? 0 : 2, methods: [{method: 'CASH', amount: empty ? 0 : 55000, paymentCount: empty ? 0 : 1}, {method: 'BANK_TRANSFER', amount: empty ? 0 : 40000, paymentCount: empty ? 0 : 1}], payments: page(empty ? [] : [{ id: 1, orderId: 102, method: 'CASH', amount: 55000, paidAt: now }, { id: 2, orderId: 103, method: 'BANK_TRANSFER', amount: 40000, paidAt: now }]) };
  else throw new Error(`Chưa có dữ liệu xem thiết kế cho ${url}`);
  return { data: { success: true, message: 'Dữ liệu mô phỏng', data }, status: 200, statusText: 'OK', headers: {}, config };
};
const route = new URLSearchParams(location.search).get('page') ?? '/staff/pos';
const session = { accessToken: 'ui-preview-only', username: 'Thiết kế UI', role: route.startsWith('/admin') ? 'ADMIN' as const : 'STAFF' as const };
createRoot(document.getElementById('root')!).render(<UIProvider><StaffAuthContext.Provider value={{session, isAuthenticated: true, signIn: async () => false, signOut: () => {}, isSigningIn: false, error: null, verificationError: null, retryVerification: () => {}}}>
  <MemoryRouter initialEntries={[route]}><Routes>
    <Route path="/staff" element={<StaffLayout />}>
      <Route path="pos" element={<POSPage />} />
      <Route path="orders" element={<StaffOrdersPage />} />
      <Route path="kds" element={<StaffOrdersPage mode="kitchen" />} />
      <Route path="history" element={<StaffOrdersPage mode="history" />} />
      <Route path="tables" element={<StaffTablesPage />} />
      <Route path="inventory" element={<StaffInventoryPage />} />
      <Route path="revenue" element={<StaffRevenuePage />} />
    </Route>
    <Route path="/admin" element={<AdminLayout />}>
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="products" element={<AdminProductsPage />} />
      <Route path="employees" element={<AdminEmployeesPage />} />
      <Route path="tables" element={<StaffTablesPage workspace="admin" />} />
      <Route path="orders" element={<StaffOrdersPage mode="history" workspace="admin" />} />
      <Route path="inventory" element={<StaffInventoryPage readOnly />} />
      <Route path="reports" element={<AdminReportsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/staff/pos" replace />} />
  </Routes></MemoryRouter>
</StaffAuthContext.Provider></UIProvider>);

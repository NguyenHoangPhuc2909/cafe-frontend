import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import CustomerLayout from "./layouts/CustomerLayout";
import StaffLayout from "./layouts/StaffLayout";
import CustomerMenu from "./pages/Customer/CustomerMenu";
import CartPage from "./pages/Customer/CartPage";
import TableAccessPage from "./pages/Customer/TableAccessPage";
import POSPage from "./pages/Staff/POSPage";
import CheckoutPage from "./pages/Customer/CheckoutPage";
import StaffOrdersPage from "./pages/Staff/StaffOrdersPage";
import StaffTablesPage from "./pages/Staff/StaffTablesPage";
import { StaffAuthProvider } from "./contexts/StaffAuthProvider";
import StaffLoginPage from "./pages/Staff/StaffLoginPage";
import RequireStaffAuth from "./components/staff/RequireStaffAuth";
import RequireOrderStaff from "./components/staff/RequireOrderStaff";
import StaffInventoryPage from "./pages/Staff/StaffInventoryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<CustomerMenu />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="table/:qrCode" element={<TableAccessPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route
            path="order-status"
            element={<Navigate to="/checkout" replace />}
          />
        </Route>

        {/* Cụm Route dành cho Nhân viên/Quản lý */}
        <Route
          element={
            <StaffAuthProvider>
              <Outlet />
            </StaffAuthProvider>
          }
        >
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route element={<RequireStaffAuth />}>
            <Route path="/staff" element={<StaffLayout />}>
              <Route index element={<Navigate to="pos" replace />} />
              <Route element={<RequireOrderStaff />}>
                <Route path="pos" element={<POSPage />} />
              </Route>
              <Route path="orders" element={<StaffOrdersPage key="orders" />} />
              <Route
                path="kds"
                element={<StaffOrdersPage key="kds" mode="kitchen" />}
              />
              <Route
                path="history"
                element={<StaffOrdersPage key="history" mode="history" />}
              />
              <Route path="tables" element={<StaffTablesPage />} />
              <Route path="inventory" element={<StaffInventoryPage />} />
              <Route
                path="*"
                element={<Navigate to="/staff/pos" replace />}
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

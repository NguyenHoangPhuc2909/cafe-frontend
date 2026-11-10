import { NavLink, Outlet } from "react-router-dom";
import { useStaffAuth } from "../hooks/useStaffAuth";

const adminMenu = [
  { label: "Tổng quan", path: "/admin/dashboard" },
  { label: "Nhân viên", path: "/admin/employees" },
  { label: "Thực đơn", path: "/admin/products" },
  { label: "Bàn", path: "/admin/tables" },
  { label: "Đơn hàng", path: "/admin/orders" },
  { label: "Kho", path: "/admin/inventory" },
  { label: "Báo cáo", path: "/admin/reports" },
];

export default function AdminLayout() {
  const { signOut } = useStaffAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="border-b bg-white p-4 md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="mb-6 text-xl font-bold">
          Café Admin
        </div>

        <nav aria-label="Menu quản trị" className="flex flex-col gap-2">
          {adminMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b bg-white px-6 py-4">
          <h1 className="text-xl font-bold">
            Quản trị quán cà phê
          </h1>

          <button
            type="button"
            onClick={signOut}
            className="shrink-0 rounded-lg border px-4 py-2"
          >
            Đăng xuất
          </button>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
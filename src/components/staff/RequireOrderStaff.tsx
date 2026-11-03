import { Navigate, Outlet } from "react-router-dom";
import { useStaffAuth } from "../../hooks/useStaffAuth";

export default function RequireOrderStaff() {
  const { session } = useStaffAuth();

  if (session?.role !== "STAFF") {
    return <Navigate to="/staff/orders" replace />;
  }

  return <Outlet />;
}
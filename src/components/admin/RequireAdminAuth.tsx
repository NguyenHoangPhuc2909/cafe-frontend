import { Navigate, Outlet } from "react-router-dom";
import { useStaffAuth } from "../../hooks/useStaffAuth";

export default function RequireAdminAuth() {
  const { session } = useStaffAuth();

  if (session?.role !== "ADMIN") {
    return <Navigate to="/staff/pos" replace />;
  }

  return <Outlet />;
}

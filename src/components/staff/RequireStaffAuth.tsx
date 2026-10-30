import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import StaffSessionStatus from './StaffSessionStatus';

export default function RequireStaffAuth() {
  const { session, isAuthenticated } = useStaffAuth();
  const location = useLocation();
  if (!session || !['STAFF', 'ADMIN'].includes(session.role)) {
    return <Navigate to="/staff/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }
  if (!isAuthenticated) return <StaffSessionStatus />;
  return <Outlet />;
}

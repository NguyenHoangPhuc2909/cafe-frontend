import Icon from '../../components/ui/Icon';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { staffReturnPath } from '../../utils/staffRouting';
import StaffSignIn from '../../components/staff/StaffSignIn';
import StaffSessionStatus from '../../components/staff/StaffSessionStatus';

export default function StaffLoginPage() {
  const { session, isAuthenticated } = useStaffAuth();
  const location = useLocation();
  const destination = staffReturnPath(location.state?.from);
  if (isAuthenticated && session) return <Navigate to={destination} replace />;
  if (session) return <StaffSessionStatus />;

  return <main className="staff-theme staff-login">
    <div className="staff-login-card">
      <Link to="/" className="staff-login-brand"><span className="staff-brand__mark"><Icon name="coffee" /></span>L'Atelier Café</Link>
      <StaffSignIn />
      <p className="staff-login-note">Tài khoản do quản trị viên của quán cấp.</p>
      <Link to="/" className="staff-login-back"><Icon name="arrow_back" />Về thực đơn khách</Link>
    </div>
  </main>;
}

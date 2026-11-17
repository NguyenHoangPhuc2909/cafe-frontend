import Icon from "../../components/ui/Icon";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import { staffReturnPath } from "../../utils/staffRouting";
import StaffSignIn from "../../components/staff/StaffSignIn";
import StaffSessionStatus from "../../components/staff/StaffSessionStatus";
import Brand from "../../components/layout/Brand";

export default function StaffLoginPage() {
  const { session, isAuthenticated } = useStaffAuth();
  const location = useLocation();
  const destination =
    session?.role === "ADMIN"
      ? "/admin/dashboard" : staffReturnPath(location.state?.from);
  if (isAuthenticated && session) return <Navigate to={destination} replace />;
  if (session) return <StaffSessionStatus />;

  return (
    <main className="staff-theme staff-login">
      <section className="staff-login-story" aria-label="L’Atelier Café">
        <Link to="/" className="staff-login-story__brand"><Brand subtitle="Không gian dành cho đội ngũ L’Atelier" /></Link>
        <div className="staff-login-story__copy"><p>Mỗi ngày ở L’Atelier</p><h2>Một ly ngon.<br />Một nụ cười.<br />Một ngày trọn vẹn.</h2><span>Cùng chăm chút từng trải nghiệm tại quán.</span></div>
        <img src="/images/caramel_macchiato.png" width={600} height={600} alt="" className="staff-login-story__image" />
      </section>
      <div className="staff-login-form-area">
      <div className="staff-login-card">
        <Link to="/" className="staff-login-brand">
          <Brand subtitle="Không gian làm việc" />
        </Link>
        <StaffSignIn />
        <p className="staff-login-note">
          Tài khoản do quản trị viên của quán cấp.
        </p>
        <Link to="/" className="staff-login-back">
          <Icon name="arrow_back" />
          Về thực đơn khách
        </Link>
      </div>
      </div>
    </main>
  );
}

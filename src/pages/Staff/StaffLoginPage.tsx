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

  return <main className="staff-theme flex min-h-screen items-center justify-center bg-[#F6F2EE] px-4 py-8 sm:px-8">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-xl lg:grid-cols-2">
      <section className="relative overflow-hidden bg-[#2C1A10] px-6 py-8 text-white sm:p-10 lg:flex lg:flex-col lg:justify-between">
        <div><div className="flex items-center gap-3"><span aria-hidden="true" className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-3xl">coffee</span><div><p className="text-xl font-bold">L'Atelier Café</p><p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/60">Hệ thống vận hành quán</p></div></div>
          <h1 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">Bắt đầu ca làm việc<br className="hidden sm:block" /> tại L'Atelier.</h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">Một nơi để bán hàng, theo dõi đơn, quản lý bàn và phối hợp phục vụ khách.</p>
        </div>
        <div className="mt-9 hidden gap-3 text-xs text-white/80 sm:grid sm:grid-cols-2">{[['point_of_sale', 'Bán hàng tại quầy'], ['receipt_long', 'Đơn hàng và thanh toán'], ['table_restaurant', 'Bàn và phiên phục vụ'], ['local_cafe', 'Quầy pha chế']].map(([icon, label]) => <div key={label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3"><span aria-hidden="true" className="material-symbols-outlined text-xl text-[#ffdeaa]">{icon}</span>{label}</div>)}</div>
      </section>
      <div className="px-5 py-6 sm:p-9"><StaffSignIn /><p className="mt-5 text-center text-xs leading-relaxed text-on-surface-variant">Tài khoản do quản trị viên của quán cấp.</p><Link to="/" className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline">Quay lại thực đơn khách</Link></div>
    </div>
  </main>;
}

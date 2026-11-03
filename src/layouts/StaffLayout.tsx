import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useStaffAuth } from '../hooks/useStaffAuth';

const STAFF_NAV = [
  { path: '/staff/pos', label: 'Bán hàng', icon: 'point_of_sale' },
  { path: '/staff/orders', label: 'Đơn hàng', icon: 'receipt_long' },
  { path: '/staff/kds', label: 'Pha chế', icon: 'coffee' },
  { path: '/staff/tables', label: 'Sơ đồ bàn', icon: 'table_restaurant' },
  { path: '/staff/history', label: 'Lịch sử đơn', icon: 'history' },
  { path: '/staff/inventory', label: 'Kho & thực đơn', icon: 'inventory_2' },
  { path: '/staff/settings', label: 'Cài đặt', icon: 'settings' },
];

export default function StaffLayout() {
  const { pathname } = useLocation();
  const { session, signOut } = useStaffAuth();
  const [clock, setClock] = useState('');
  const visibleNav = STAFF_NAV.filter(item => item.path !== '/staff/pos' || session?.role === 'STAFF');
  const active = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date()));
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  return <div className="staff-theme staff-shell">
    <header className="staff-topbar">
      <Link to="/staff" className="staff-brand"><span className="staff-brand__mark"><Icon name="coffee" /></span><span>L'Atelier Café</span></Link>
      <span className="staff-topbar__area">Không gian làm việc</span>
      <div className="staff-topbar__right"><span className="staff-clock"><Icon name="schedule" />{clock}</span><button type="button" onClick={signOut} aria-label="Đăng xuất" className="ui-icon-button md:hidden"><Icon name="logout" /></button></div>
    </header>
    <div className="staff-workspace">
      <aside className="staff-sidebar">
        <div><p className="staff-nav-label">Vận hành</p><nav aria-label="Điều hướng nhân viên" className="staff-nav">
          {visibleNav.map(item => <Link key={item.path} to={item.path} aria-current={active(item.path) ? 'page' : undefined} className="staff-nav-link"><Icon name={item.icon} /><span>{item.label}</span></Link>)}
        </nav></div>
        <div className="staff-profile"><span className="staff-profile__avatar"><Icon name="person" /></span><span className="staff-profile__info"><strong>{session?.username ?? 'Nhân viên'}</strong><small>{session?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</small></span><button type="button" disabled={!session} onClick={signOut} aria-label="Đăng xuất" className="staff-signout"><Icon name="logout" /></button></div>
      </aside>
      <main className="staff-main"><Outlet /></main>
    </div>
    <nav aria-label="Điều hướng nhân viên trên điện thoại" className="staff-mobile-nav">
      {visibleNav.filter(item => !['/staff/inventory', '/staff/settings'].includes(item.path)).map(item => <Link key={item.path} to={item.path} aria-current={active(item.path) ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}
    </nav>
  </div>;
}

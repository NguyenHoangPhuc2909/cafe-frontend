import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useStaffAuth } from '../hooks/useStaffAuth';
import Brand from '../components/layout/Brand';
import Icon from '../components/ui/Icon';

const adminMenu = [
  { label: 'Tổng quan', path: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Nhân viên', path: '/admin/employees', icon: 'person' },
  { label: 'Thực đơn', path: '/admin/products', icon: 'restaurant_menu' },
  { label: 'Danh mục', path: '/admin/categories', icon: 'restaurant_menu' },
  { label: 'Nguyên liệu', path: '/admin/ingredients', icon: 'inventory_2' },
  { label: 'Sơ đồ bàn', path: '/admin/tables', icon: 'table_restaurant' },
  { label: 'Lịch sử đơn hàng', path: '/admin/orders', icon: 'history' },
  { label: 'Tồn kho', path: '/admin/inventory', icon: 'inventory_2' },
  { label: 'Báo cáo', path: '/admin/reports', icon: 'chart' },
];

export default function AdminLayout() {
  const { session, signOut } = useStaffAuth();
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);
  const activePage = adminMenu.find(item => pathname.startsWith(item.path));

  return <div className="staff-theme admin-shell">
    <a href="#admin-content" className="skip-link">Đến nội dung chính</a>
    <aside className="admin-sidebar">
      <Link to="/admin/dashboard" className="admin-brand"><Brand subtitle="Không gian quản trị" /></Link>
      <p className="staff-nav-label">Quản lý quán</p>
      <nav ref={navRef} aria-label="Menu quản trị" className="staff-nav admin-nav">
        {adminMenu.map(item => <NavLink key={item.path} to={item.path} className="staff-nav-link"><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}
      </nav>
      <div className="admin-sidebar__bottom">
        <div className="staff-profile"><span className="staff-profile__avatar"><Icon name="person" /></span><span className="staff-profile__info"><strong>{session?.username ?? 'Quản trị viên'}</strong><small>Quản trị viên</small></span><button type="button" onClick={signOut} aria-label="Đăng xuất" className="staff-signout"><Icon name="logout" /></button></div>
      </div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-topbar">
        <span className="admin-breadcrumb">Quản trị <Icon name="chevron_right" /><strong>{activePage?.label ?? 'L’Atelier Café'}</strong></span>
        <div className="admin-topbar__actions"><Link to="/" className="ui-button" aria-label="Xem thực đơn khách"><Icon name="restaurant_menu" /><span>Xem thực đơn</span></Link><button type="button" onClick={signOut} className="ui-icon-button admin-mobile-signout" aria-label="Đăng xuất"><Icon name="logout" /></button></div>
      </header>
      <main id="admin-content" tabIndex={-1} className="admin-content"><Outlet /></main>
    </div>
  </div>;
}

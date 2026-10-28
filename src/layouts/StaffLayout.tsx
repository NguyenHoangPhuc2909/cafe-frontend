import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../hooks/useStaffAuth';

// ─── Nav config ──────────────────────────────────────────
const STAFF_NAV = [
  { path: '/staff/pos',       label: 'Bán Hàng',   icon: 'point_of_sale'    },
  { path: '/staff/orders',    label: 'Đơn Hàng',   icon: 'receipt_long'     },
  { path: '/staff/kds',       label: 'Pha Chế',    icon: 'local_cafe'       },
  { path: '/staff/tables',    label: 'Sơ Đồ Bàn',  icon: 'table_restaurant' },
  { path: '/staff/history',   label: 'Lịch Sử Đơn', icon: 'history'        },
  { path: '/staff/inventory', label: 'Kho / Menu',  icon: 'inventory_2'      },
  { path: '/staff/settings',  label: 'Cài Đặt',    icon: 'settings'         },
];

const DAYS_VI = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];

// ─── Component ───────────────────────────────────────────
const StaffLayout: React.FC = () => {
  const location = useLocation();
  const { session, signOut } = useStaffAuth();
  const [clock, setClock]           = useState('');
  const [dayLabel, setDayLabel]     = useState('');
  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`);
      setDayLabel(DAYS_VI[now.getDay()]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="staff-theme h-screen w-screen overflow-hidden bg-[#F6F2EE]
      text-on-surface font-body-md select-none flex flex-col antialiased">

      {/* ══ Top Header ══════════════════════════════════════ */}
      <header className="flex justify-between items-center h-[60px] px-4 w-full
        bg-surface border-b border-outline-variant/40 shadow-sm shrink-0 z-30">

        {/* Left */}
        <div className="flex items-center gap-4">
          <Link to="/staff" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center
              shadow-[0_4px_14px_rgba(161,61,23,0.3)] group-hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-on-primary text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>coffee</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-headline-md text-[16px] text-primary font-bold tracking-tight
                group-hover:text-secondary transition-colors">L'Atelier Café</span>
            </div>
          </Link>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl
            bg-surface-container border border-outline-variant/40">
            <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
            <span className="font-data-md text-[13px] font-bold tracking-widest tabular-nums text-on-surface">
              {clock}
            </span>
            <span className="text-[10px] font-label-caps text-on-surface-variant ml-0.5">{dayLabel}</span>
          </div>

        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-secondary-fixed px-3 py-1 text-[10px] font-semibold text-on-secondary-container sm:inline">Bản thử UI Staff</span>
          <Link to="/" target="_blank" rel="noopener noreferrer" className="flex min-h-9 items-center rounded-xl border border-outline-variant/40 px-3 text-xs font-semibold text-primary">Trang khách</Link>
        </div>
      </header>

      {/* ══ Main Workspace ══════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative pb-[60px] md:pb-0">

        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex h-full flex-col justify-between py-4 px-3
          bg-[#2C1A10] border-r border-white/5 w-[200px] shrink-0">

          <div className="space-y-4">
            {/* Staff profile */}
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <span aria-hidden="true" className="material-symbols-outlined text-white">person</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate leading-tight">{session?.username ?? 'Nhân viên'}</p>
                <p className="text-[10px] font-label-caps text-white/50 truncate">{session?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="space-y-1">
              {STAFF_NAV.map((item, idx) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/staff' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                      font-label-caps text-[11px] font-semibold transition-all duration-150
                      ${isActive
                        ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(161,61,23,0.4)]'
                        : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                      {item.icon}
                    </span>
                    <span>
                      <span className="text-[9px] opacity-60 mr-1">{String(idx + 1).padStart(2,'0')}</span>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <button disabled={!session} onClick={signOut} title="Đăng xuất khỏi hệ thống nhân viên trong tab này" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-white/5 border border-white/10 text-white/50 font-label-caps text-[11px]
              hover:bg-error/20 hover:text-red-400 hover:border-red-400/30 transition-all">
              <span className="material-symbols-outlined text-[15px]">logout</span>
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Page content */}
        <div className="flex-1 overflow-hidden relative">
          <Outlet />
        </div>
      </div>

      {/* ══ Mobile Bottom Nav ════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-surface
        border-t border-outline-variant/30 flex items-center justify-around z-40
        shadow-[0_-4px_16px_rgba(0,0,0,0.05)] px-2">
        {STAFF_NAV.filter(item => !['/staff/inventory', '/staff/settings'].includes(item.path)).map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/staff' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors
                ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="text-[9px] font-label-caps font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default StaffLayout;

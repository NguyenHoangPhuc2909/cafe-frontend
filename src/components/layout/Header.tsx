import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const CART_COUNT = 3; // TODO: replace with CartContext

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ── Top Utility Bar ─────────────────────────────── */}
      <div className="bg-primary text-on-primary hidden md:flex items-center justify-between px-margin py-2 text-[11px] font-label-sm tracking-wide animate-slide-down">
        <span className="opacity-70 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          Chào mừng đến L'Atelier Café — Specialty Roastery Hà Nội
        </span>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">store</span>
            <span>48 Tràng Tiền, Hoàn Kiếm</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-80">
            <span className="material-symbols-outlined text-[14px]">call</span>
            <strong>1900 8868</strong>
          </div>
          <div className="flex items-center gap-1.5 opacity-80">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>07:00 – 22:30</span>
          </div>
        </div>
      </div>

      {/* ── Main Header ─────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 px-margin h-16 md:h-[72px] flex items-center justify-between
          ${scrolled
            ? 'bg-surface/95 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(49,25,8,0.12)] border-b border-outline-variant/30'
            : 'bg-surface border-b border-surface-container-high'
          }`}
      >
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0 focus-ring">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_14px_rgba(49,25,8,0.25)] group-hover:shadow-[0_6px_20px_rgba(49,25,8,0.32)] transition-all duration-200 group-hover:scale-105">
            <span
              className="material-symbols-outlined text-on-primary text-[18px] md:text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              coffee
            </span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-headline-md text-[17px] md:text-[20px] text-primary font-bold tracking-tight group-hover:text-secondary transition-colors duration-200">
              L'Atelier Café
            </span>
            <span className="font-label-sm text-[9px] md:text-[10px] text-on-surface-variant tracking-[0.18em] uppercase hidden sm:block mt-0.5">
              Specialty Coffee &amp; Roastery
            </span>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Table badge — desktop */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-xl border border-outline-variant/40 cursor-pointer hover:bg-surface-container hover:border-outline-variant transition-all group">
            <span className="material-symbols-outlined text-secondary text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>table_restaurant</span>
            <span className="font-label-md text-[12px] text-primary font-semibold group-hover:text-secondary transition-colors">Bàn 06</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot ml-0.5"></span>
          </div>

          {/* Cart button */}
          <Link
            to="/cart"
            className={`hidden md:flex relative items-center gap-2 px-4 py-2.5 rounded-xl font-label-lg text-[13.5px] font-semibold transition-all duration-200 active:scale-95 shadow-md focus-ring
              ${isActive('/cart')
                ? 'bg-primary text-on-primary shadow-[0_4px_18px_rgba(49,25,8,0.28)]'
                : 'bg-primary-container text-on-primary hover:bg-primary hover:shadow-[0_6px_22px_rgba(49,25,8,0.28)]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
            <span>Giỏ hàng</span>
            {CART_COUNT > 0 && (
              <span className="animate-badge-pop bg-secondary-container text-on-secondary-container text-[10px] font-label-sm font-bold px-2 py-0.5 rounded-full ml-0.5">
                {CART_COUNT}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <button className="hidden md:flex w-9 h-9 md:w-10 md:h-10 rounded-xl items-center justify-center border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container hover:border-outline-variant text-primary transition-all active:scale-90 focus-ring">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation ─────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-warm border-t border-outline-variant/25 shadow-[0_-8px_32px_-4px_rgba(49,25,8,0.1)]">
        <div className="flex items-center justify-around h-16 px-2">

          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 rounded-xl mx-0.5 transition-colors active:scale-90
              ${isActive('/') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/') ? "'FILL' 1" : "'FILL' 0" }}>home</span>
            <span className={`text-[10px] font-label-sm font-medium ${isActive('/') ? 'font-bold' : ''}`}>Trang chủ</span>
          </Link>

          {/* Menu */}
          <Link
            to="/"
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 rounded-xl mx-0.5 text-on-surface-variant hover:text-primary transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
            <span className="text-[10px] font-label-sm font-medium">Menu</span>
          </Link>

          {/* Cart — center elevated */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center flex-1 h-full relative gap-0.5 rounded-xl mx-0.5 transition-all active:scale-90
              ${isActive('/cart') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <div className="relative">
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive('/cart') ? "'FILL' 1" : "'FILL' 0" }}
              >
                shopping_bag
              </span>
              {CART_COUNT > 0 && (
                <span className="animate-badge-pop absolute -top-1.5 -right-2 bg-error text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full leading-none px-1">
                  {CART_COUNT}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-label-sm font-medium ${isActive('/cart') ? 'font-bold' : ''}`}>Giỏ hàng</span>
          </Link>

          {/* Account */}
          <button className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 rounded-xl mx-0.5 text-on-surface-variant hover:text-primary transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[22px]">person</span>
            <span className="text-[10px] font-label-sm font-medium">Tài khoản</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Header;

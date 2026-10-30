import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerCart } from '../../hooks/useCustomerCart';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { itemCount } = useCustomerCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ── Top Utility Bar ─────────────────────────────── */}
      <div className="bg-primary text-on-primary hidden xl:flex items-center justify-between px-8 py-2 text-[11px] font-label-sm tracking-wide animate-slide-down">
        <span className="opacity-70 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          Chào mừng đến L'Atelier Café — Specialty Roastery
        </span>
        <div className="flex items-center gap-5">
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
        className={`sticky top-0 z-40 transition-all duration-300 px-4 sm:px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between gap-3
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
            {itemCount > 0 && (
              <span className="animate-badge-pop bg-secondary-container text-on-secondary-container text-[10px] font-label-sm font-bold px-2 py-0.5 rounded-full ml-0.5">
                {itemCount}
              </span>
            )}
          </Link>

          <Link to="/" className="hidden md:flex min-h-11 items-center px-3 text-[13px] font-label-md text-primary focus-ring">Thực đơn</Link>
          {isActive('/cart') ? (
            <Link to="/" className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-primary md:hidden"><span aria-hidden="true" className="material-symbols-outlined text-lg">restaurant_menu</span>Thực đơn</Link>
          ) : (
            <Link to="/cart" aria-label={`Giỏ hàng, ${itemCount} món`} className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant/40 text-primary md:hidden">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">shopping_bag</span>
              {itemCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-5 text-on-primary">{itemCount}</span>}
            </Link>
          )}
        </div>
      </header>


    </>
  );
};

export default Header;

import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-surface/90 backdrop-blur-md text-primary sticky top-0 z-50 shadow-[0_4px_20px_-2px_rgba(74,46,27,0.05)] border-b border-outline-variant/40">
      <div className="w-full mx-auto px-margin md:px-space-xl flex justify-between items-center max-w-7xl h-20">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-headline-sm transition-all duration-200 group-hover:scale-105">
            <span className="material-symbols-outlined text-[18px]">coffee</span>
          </span>
          <span className="text-headline-md font-semibold tracking-tight text-primary">L'Atelier Café</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-primary font-semibold border-b-2 border-primary pb-1 text-label-lg">Menu</Link>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-label-lg">Roastery</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-label-lg">Workshop</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-label-lg">Vị trí</a>
        </nav>

        {/* Trailing Actions */}
        <div className="flex items-center space-x-4">
          <a className="hidden lg:flex items-center gap-1.5 text-secondary hover:text-primary transition-colors text-label-md bg-secondary-fixed/40 px-3 py-1.5 rounded-full" href="tel:19006868">
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>Hotline: 1900 6868</span>
          </a>
          
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" title="Tìm kiếm">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          <Link to="/cart" className="relative w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm hover:opacity-95 transition-opacity" title="Giỏ hàng">
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            <span className="absolute -top-1 -right-1 bg-secondary text-on-secondary text-label-sm rounded-full w-5 h-5 flex items-center justify-center border-2 border-surface">3</span>
          </Link>

          {/* User Icon */}
          <button className="w-10 h-10 rounded-full border border-outline-variant/60 flex items-center justify-center text-primary bg-surface-container-low hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[22px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-low w-full mt-auto border-t border-outline-variant/40">
      <div className="max-w-7xl mx-auto px-margin md:px-space-xl py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <a className="text-headline-md font-semibold text-primary block tracking-tight" href="#">
              L'Atelier Café
            </a>
            <p className="text-body-sm text-on-surface-variant">
              Không gian trải nghiệm cà phê đặc sản thủ công, tuyển chọn từ những đồi cà phê chất lượng cao nhất tại Việt Nam và thế giới.
            </p>
            <div className="flex items-center space-x-3 text-secondary">
              <a className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-secondary-fixed transition-colors" href="#">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              </a>
              <a className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-secondary-fixed transition-colors" href="#">
                <span className="material-symbols-outlined text-[18px]">public</span>
              </a>
              <a className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-secondary-fixed transition-colors" href="#">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div className="space-y-3">
            <h4 className="text-label-lg text-primary uppercase tracking-wider font-semibold">Cà Phê & Menu</h4>
            <ul className="space-y-2 text-body-sm">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Provenance & Direct Trade</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Single-Origin Beans</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Espresso & Brew Bar</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="space-y-3">
            <h4 className="text-label-lg text-primary uppercase tracking-wider font-semibold">Trải Nghiệm</h4>
            <ul className="space-y-2 text-body-sm">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Roastery Workshops</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Store Locations</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Table Reservations</a></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div className="space-y-3">
            <h4 className="text-label-lg text-primary uppercase tracking-wider font-semibold">CSKH</h4>
            <ul className="space-y-2 text-body-sm">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Điều khoản</a></li>
              <li><span className="text-on-surface-variant">Hotline: 1900 6868</span></li>
              <li><span className="text-on-surface-variant">contact@lateliercafe.vn</span></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between text-label-sm text-on-surface-variant gap-4">
          <p>© 2025 L'Atelier Café. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a className="hover:text-primary transition-colors" href="#">Bảo mật</a>
            <a className="hover:text-primary transition-colors" href="#">Tiêu chuẩn</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

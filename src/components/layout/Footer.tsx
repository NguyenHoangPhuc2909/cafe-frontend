import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="mt-20 bg-surface-container-low border-t border-outline-variant/30">

      {/* ── Top brand strip ─────────────────────────── */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-margin py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>coffee</span>
            </div>
            <div>
              <p className="font-headline-sm font-bold text-on-primary text-[18px]">L'Atelier Café</p>
              <p className="text-[10px] font-label-sm text-on-primary/60 tracking-widest uppercase">Specialty Coffee & Roastery</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-on-primary/70 font-label-sm">
            {['Thực đơn', 'Workshop', 'Hệ thống cửa hàng', 'Liên hệ'].map(item => (
              <a key={item} href="#" className="hover:text-on-primary transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            {[
              { icon: 'public',       label: 'Website' },
              { icon: 'chat',         label: 'Chat' },
              { icon: 'photo_camera', label: 'Instagram' },
            ].map(({ icon, label }) => (
              <button
                key={icon}
                title={label}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-on-primary transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-[17px]">{icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer grid ────────────────────────── */}
      <div className="max-w-7xl mx-auto px-margin py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand about */}
        <div className="space-y-3 lg:col-span-1">
          <h4 className="font-label-md font-bold uppercase tracking-wider text-primary text-[11px]">Về chúng tôi</h4>
          <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">
            Không gian thưởng thức specialty coffee đậm chất nghệ thuật roastery thủ công. Tôn vinh nguồn hạt nông sản Việt Nam chất lượng cao.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
            <span className="text-[11.5px] font-label-sm text-on-surface-variant">Đang mở cửa · 07:00 – 22:30</span>
          </div>
        </div>

        {/* Menu links */}
        <div className="space-y-3">
          <h4 className="font-label-md font-bold uppercase tracking-wider text-primary text-[11px]">Thực đơn & Trải nghiệm</h4>
          <ul className="space-y-2 font-body-sm text-[13px] text-on-surface-variant">
            {[
              'Hạt cà phê Single Origin',
              'Dòng Cà Phê Ủ Lạnh 18H',
              'Trà Thảo Mộc & Sữa Hạt',
              'Workshop Cupping Cuối Tuần',
              'Gói Gift Box Roastery',
            ].map(item => (
              <li key={item}>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="material-symbols-outlined text-[12px] text-outline group-hover:text-primary transition-colors">arrow_forward_ios</span>
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Locations */}
        <div className="space-y-3">
          <h4 className="font-label-md font-bold uppercase tracking-wider text-primary text-[11px]">Hệ Thống Cửa Hàng</h4>
          <div className="space-y-4 font-body-sm text-[13px] text-on-surface-variant">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              <div>
                <strong className="text-on-surface block text-[12.5px]">Chi nhánh 1 (Flagship)</strong>
                <span>48 Tràng Tiền, Hoàn Kiếm, Hà Nội</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              <div>
                <strong className="text-on-surface block text-[12.5px]">Chi nhánh 2</strong>
                <span>128 Nam Kỳ Khởi Nghĩa, Q.1, TP.HCM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer service */}
        <div className="space-y-3">
          <h4 className="font-label-md font-bold uppercase tracking-wider text-primary text-[11px]">Dịch Vụ Khách Hàng</h4>
          <div className="space-y-2.5 font-body-sm text-[13px] text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-secondary">call</span>
              <span>Hotline: <strong className="text-primary font-semibold">1900 8868</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-secondary">mail</span>
              <span>contact@lateliercafe.vn</span>
            </div>
          </div>

          {/* Newsletter mini */}
          <div className="pt-2">
            <p className="text-[11.5px] font-label-sm text-on-surface-variant mb-2">Nhận thông tin ưu đãi mới nhất:</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 min-w-0 px-3 py-2 text-[12px] rounded-xl bg-surface border border-outline-variant/40 focus:outline-none focus:border-primary/50 text-on-surface placeholder:text-outline transition-colors"
              />
              <button className="px-3 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-label-sm font-semibold hover:bg-primary-container transition-all active:scale-95 shrink-0">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────── */}
      <div className="border-t border-outline-variant/25 px-margin py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px] text-outline font-label-sm">
          <span>© 2024 L'Atelier Café. All Rights Reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="#" className="hover:text-primary transition-colors">Chính sách bảo mật</Link>
            <Link to="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

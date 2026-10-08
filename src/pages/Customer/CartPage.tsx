import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { INITIAL_CART, UPSELL_ITEMS } from '../../constants/mockData';
import { formatCurrency } from '../../utils/format';

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState(INITIAL_CART);

  const updateQty = (id: string, delta: number) =>
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );

  const removeItem = (id: string) =>
    setCartItems(items => items.filter(item => item.id !== id));

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax      = subtotal * 0.08;
  const total    = subtotal + tax;

  return (
    <div className="animate-fade-up pb-24 md:pb-0">

      {/* ── Breadcrumb ─────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-[12px] font-label-sm text-on-surface-variant mb-5">
        <Link className="hover:text-primary transition-colors" to="/">Trang chủ</Link>
        <span className="material-symbols-outlined text-[13px]">chevron_right</span>
        <Link className="hover:text-primary transition-colors" to="/">Menu</Link>
        <span className="material-symbols-outlined text-[13px]">chevron_right</span>
        <span className="text-primary font-semibold">Giỏ hàng</span>
      </nav>

      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-6 mb-8 border-b border-outline-variant/25">
        <div>
          <h1 className="font-headline-lg text-[26px] md:text-[30px] font-bold text-primary tracking-tight leading-tight">
            Giỏ Hàng Của Bạn{' '}
            <span className="text-secondary font-headline-sm text-[18px]">
              ({cartItems.length.toString().padStart(2, '0')} món)
            </span>
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1 text-[13.5px]">
            Hương vị thủ công được rang xay &amp; pha chế tươi trực tiếp khi xác nhận đơn.
          </p>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={() => setCartItems([])}
            className="self-start md:self-auto inline-flex items-center gap-1.5 text-[12px] font-label-md text-outline hover:text-error transition-colors py-1.5 px-3 rounded-xl hover:bg-error-container/20"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            Xóa tất cả
          </button>
        )}
      </div>

      {/* ── Main Layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT — Cart Items */}
        <div className="lg:col-span-8 space-y-8">

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[36px]">shopping_bag</span>
              </div>
              <p className="font-headline-sm text-primary font-semibold">Giỏ hàng đang trống</p>
              <p className="text-body-sm text-on-surface-variant text-[13px]">Hãy thêm vài món từ thực đơn nhé!</p>
              <Link
                to="/"
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg font-semibold hover:bg-primary-container transition-all active:scale-95 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
                Xem thực đơn
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, i) => (
                <article
                  key={item.id}
                  className="animate-fade-up bg-surface-container-lowest rounded-2xl border border-outline-variant/30 hover:border-outline-variant/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex gap-0 sm:gap-0">
                    {/* Image */}
                    <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden">
                      <img
                        className="w-full h-full object-cover"
                        src={item.imageUrl}
                        alt={item.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-headline-sm font-bold text-primary leading-tight line-clamp-1">{item.name}</h3>
                            <p className="text-[11px] font-label-sm text-secondary uppercase tracking-wider mt-0.5 line-clamp-1">{item.origin}</p>
                          </div>
                          <span className="font-headline-sm text-primary font-bold whitespace-nowrap shrink-0 text-[15px]">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>

                        {/* Option chips */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {item.options.map((opt, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-full text-[10.5px] font-label-sm border
                                ${opt.startsWith('+')
                                  ? 'bg-secondary-fixed/30 text-on-secondary-fixed-variant border-secondary-fixed/40'
                                  : 'bg-surface text-on-surface-variant border-outline-variant/30'
                                }`}
                            >
                              {opt}
                            </span>
                          ))}
                        </div>

                        {/* Note */}
                        {item.note && (
                          <div className="mt-2 flex items-start gap-1.5 text-[11.5px] text-on-surface-variant bg-surface-container-low px-2.5 py-1.5 rounded-lg border border-outline-variant/20">
                            <span className="material-symbols-outlined text-[14px] text-secondary mt-0.5">edit_note</span>
                            <span>Ghi chú: <em className="text-on-surface">"{item.note}"</em></span>
                          </div>
                        )}
                      </div>

                      {/* Footer actions */}
                      <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Qty stepper */}
                          <div className="inline-flex items-center bg-surface border border-outline-variant/40 rounded-xl overflow-hidden shadow-inner">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors active:scale-90"
                            >
                              <span className="material-symbols-outlined text-[15px]">remove</span>
                            </button>
                            <span className="w-7 text-center font-label-lg font-bold text-primary text-[13px]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors active:scale-90"
                            >
                              <span className="material-symbols-outlined text-[15px]">add</span>
                            </button>
                          </div>

                          <button className="inline-flex items-center gap-1 text-[11.5px] font-label-sm text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-container">
                            <span className="material-symbols-outlined text-[14px]">tune</span>
                            <span className="hidden sm:inline">Tùy chỉnh</span>
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-outline hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/20 active:scale-90"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Continue shopping */}
          {cartItems.length > 0 && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[13px] font-label-md text-primary hover:text-secondary transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[17px]">arrow_back</span>
              Tiếp tục chọn thêm món
            </Link>
          )}

          {/* ── Upsell section ───────────────────────── */}
          <div className="animate-fade-up delay-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-headline-sm text-primary font-bold">Gợi Ý Thêm Kèm</h2>
                <p className="text-body-sm text-on-surface-variant text-[12px]">Sự kết hợp tinh tế nâng tầm trải nghiệm</p>
              </div>
              <span className="text-[10px] font-label-sm uppercase tracking-wider text-secondary bg-secondary-fixed/40 px-2.5 py-1 rounded-full">
                Curated Pairings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {UPSELL_ITEMS.map(upsell => (
                <div
                  key={upsell.id}
                  className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl flex items-center gap-3 hover:border-secondary/50 hover:shadow-md transition-all duration-200 card-hover"
                >
                  <div className="w-16 h-16 rounded-xl bg-surface overflow-hidden shrink-0">
                    <img className="w-full h-full object-cover" src={upsell.imageUrl} alt={upsell.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-label-lg text-primary font-semibold leading-snug text-[13px] line-clamp-1">{upsell.name}</h4>
                    <p className="text-body-sm text-on-surface-variant text-[11.5px]">{upsell.desc}</p>
                    <p className="font-label-md text-secondary font-semibold mt-0.5 text-[12px]">{formatCurrency(upsell.price)}</p>
                  </div>
                  <button className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-secondary/50 text-secondary hover:bg-primary hover:border-primary hover:text-on-primary transition-all text-[11.5px] font-label-sm active:scale-95">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Thêm
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Order Summary */}
        <div className="lg:col-span-4 sticky top-28">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-[0_16px_40px_-8px_rgba(49,25,8,0.12)]">

            {/* Gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary-container" />

            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/25">
                <h2 className="font-headline-sm text-primary font-bold text-[17px]">Tóm Tắt Đơn Hàng</h2>
                <span className="text-[10.5px] font-label-sm bg-surface-container px-2.5 py-1 rounded-full text-on-surface-variant font-mono tracking-wider">
                  #ATL-8924
                </span>
              </div>

              {/* Price breakdown */}
              <div className="py-4 space-y-2.5 text-[13.5px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">
                    Tạm tính ({cartItems.length.toString().padStart(2, '0')} món)
                  </span>
                  <span className="font-medium text-primary">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Phí dịch vụ</span>
                  <span className="font-medium text-green-600">Miễn phí</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Thuế VAT (8%)</span>
                  <span className="font-medium text-primary">{formatCurrency(tax)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 pb-5 border-t border-outline-variant/25">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-label-lg text-primary font-bold block">Tổng Thanh Toán</span>
                    <span className="text-[11px] text-outline">(Đã bao gồm VAT)</span>
                  </div>
                  <span className="font-headline-md text-[22px] text-primary font-bold tracking-tight">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <button className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg font-bold transition-all duration-200 active:scale-95 group shadow-lg shadow-primary/20">
                <span>Đặt Đồ &amp; Thanh Toán</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </button>

              {/* Trust signals */}
              <div className="mt-5 space-y-2">
                {[
                  { icon: 'verified',    text: 'Pha mới 100% khi nhận xác nhận đơn' },
                  { icon: 'thermostat', text: 'Giữ nhiệt nóng & lạnh đúng tiêu chuẩn' },
                  { icon: 'sync',       text: 'Đổi trả tức thì nếu chưa đúng khẩu vị' },
                ].map(({ icon, text }) => (
                  <div key={icon} className="flex items-center gap-2.5 text-[12px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call staff card */}
          <div className="mt-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary border border-outline-variant/30 shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>room_service</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-label-md text-primary font-semibold text-[13px]">Cần Barista tư vấn?</h4>
              <p className="text-body-sm text-on-surface-variant text-[11.5px]">Gọi nhân viên hỗ trợ ngay lập tức.</p>
            </div>
            <button className="shrink-0 px-3 py-1.5 bg-surface text-primary border border-outline-variant/40 rounded-xl text-[12px] font-label-sm hover:bg-surface-container-high transition-colors active:scale-95">
              Gọi NV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

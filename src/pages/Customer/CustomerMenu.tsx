import React, { useState } from 'react';
import ProductCard from '../../components/common/ProductCard';
import type { Product } from '../../types/product';
import ProductModal from '../../components/common/ProductModal';

import {
  MOCK_PRODUCTS,
  CATEGORY_MAP,
  CATEGORIES,
  SORT_LABELS,
  SORT_CYCLE,
  type SortMode
} from '../../constants/mockData';

const CustomerMenu: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [sortMode, setSortMode]               = useState<SortMode>('default');
  const searchRef = React.useRef<HTMLInputElement>(null);

  const getCategoryCount = (label: string) => {
    const kw = CATEGORY_MAP[label] ?? '';
    if (!kw) return MOCK_PRODUCTS.length;
    return MOCK_PRODUCTS.filter(p => p.category.toLowerCase().includes(kw)).length;
  };

  // ── Filter by category
  const keyword = CATEGORY_MAP[activeCategory] ?? '';
  const byCategory = keyword === ''
    ? MOCK_PRODUCTS
    : MOCK_PRODUCTS.filter(p =>
        p.category.toLowerCase().includes(keyword)
      );

  // ── Filter by search query
  const bySearch = searchQuery.trim() === ''
    ? byCategory
    : byCategory.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // ── Sort
  const filteredProducts = [...bySearch].sort((a, b) => {
    if (sortMode === 'price_asc')  return a.price - b.price;
    if (sortMode === 'price_desc') return b.price - a.price;
    if (sortMode === 'name_asc')   return a.name.localeCompare(b.name, 'vi');
    return 0; // default: keep insertion order
  });

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(sortMode);
    setSortMode(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  return (
    <>
      {/* ── Sticky Category + Search Bar ─────────────────── */}
      <div className="bg-surface/90 glass-warm border-b border-outline-variant/25 sticky top-[72px] z-30 -mx-margin md:-mx-space-xl px-margin md:px-space-xl py-3 mb-8 animate-slide-down space-y-2.5">
        {/* Category pills */}
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto pb-0.5 custom-scroll">
          {CATEGORIES.map((cat, i) => {
            const active = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={`animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-xl font-label-md text-[13px] font-semibold transition-all duration-200 shrink-0 border
                  ${active
                    ? 'bg-primary text-on-primary border-transparent shadow-md'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:border-primary/40 hover:text-primary hover:bg-surface-container-low'
                  }`}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-label-sm ${active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {getCategoryCount(cat.label)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search bar — always visible, fully functional */}
        <div className="max-w-7xl mx-auto">
          <div className="relative flex items-center">
            <span className={`material-symbols-outlined absolute left-3.5 text-[19px] pointer-events-none transition-colors duration-200 ${searchQuery ? 'text-primary' : 'text-outline'}`}>
              search
            </span>
            <input
              ref={searchRef}
              id="menu-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm tên món, mô tả, nguồn gốc…"
              className="w-full pl-10 pr-20 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-[13px] font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                className="absolute right-11 p-1 rounded-lg text-outline hover:text-error transition-colors"
                title="Xoá tìm kiếm"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
            )}
            {/* Sort button */}
            <button
              onClick={cycleSort}
              title={`Sắp xếp: ${SORT_LABELS[sortMode]}`}
              className={`absolute right-2.5 p-1.5 rounded-xl transition-all ${
                sortMode !== 'default'
                  ? 'text-primary bg-primary/10'
                  : 'text-outline hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {sortMode === 'price_asc' ? 'arrow_upward' : sortMode === 'price_desc' ? 'arrow_downward' : 'sort'}
              </span>
            </button>
          </div>
          {/* Active sort label */}
          {sortMode !== 'default' && (
            <p className="text-[11px] text-secondary font-label-sm mt-1 ml-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Đang sắp xếp: <strong>{SORT_LABELS[sortMode]}</strong>
              <button onClick={() => setSortMode('default')} className="ml-1 underline hover:text-primary transition-colors">Đặt lại</button>
            </p>
          )}
        </div>
      </div>

      <div className="space-y-10">
        {/* ── Hero Feature Banner ─────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl noise-overlay animate-fade-up">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a1508] via-[#3d2312] to-[#1a0c04]" />
          {/* Decorative circle */}
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-48 h-48 rounded-full bg-primary-fixed/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 p-7 md:p-9 flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
            {/* Image — luôn bên phải trên desktop, trên cùng trên mobile */}
            <div className="relative w-56 h-56 md:w-64 md:h-64 shrink-0 animate-float">
              <div className="absolute inset-0 rounded-2xl bg-secondary/20 blur-2xl scale-90" />
              <img
                className="relative z-10 w-full h-full object-cover rounded-2xl border border-white/15 shadow-2xl"
                alt="Cà Phê Trứng"
                src="/images/ca_phe_trung.png"
              />
              <div className="absolute -bottom-2 -right-2 z-20 bg-white text-primary text-[10px] font-label-sm font-bold px-2.5 py-1.5 rounded-xl border border-surface-container shadow-md">
                100% Robusta Fine
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-label-md text-tertiary-fixed tracking-wide">
                <span className="material-symbols-outlined text-[14px] text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                Món Tinh Hoa Trong Ngày
              </div>

              <h2 className="font-headline-lg text-[26px] md:text-[30px] font-bold text-white leading-tight">
                Cà Phê Trứng<br />
                <span className="shimmer-text">Hoàng Kim Hà Nội</span>
              </h2>

              <p className="font-body-md text-white/70 text-[13.5px] leading-relaxed line-clamp-3">
                Lớp kem trứng thơm ngậy đánh bông thủ công phủ trên nền espresso Robusta Lâm Đồng ủ lạnh đậm đà và hạt hạnh nhân nướng giòn.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="text-[28px] font-bold font-headline-md text-tertiary-fixed">
                  65.000₫
                </div>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-label-lg font-bold hover:bg-primary-fixed transition-all active:scale-95 shadow-lg">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Thêm vào đơn
                </button>
                <button className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[12px] font-label-sm transition-colors">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Chi tiết
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section Header ──────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-up delay-150">
          <div>
            <h3 className="font-headline-md text-[20px] text-primary font-bold">Thực Đơn Đồ Uống &amp; Tráng Miệng</h3>
            <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
              Pha chế tươi thủ công khi nhận order — giữ trọn hương vị nguyên bản
            </p>
          </div>
          <span className="self-start md:self-auto font-label-md text-[12px] text-on-surface-variant">
            {searchQuery && <em className="ml-1 not-italic text-primary font-semibold">Kết quả cho "{searchQuery}"</em>}
          </span>
        </div>

        {/* ── Product Grid ────────────────────────────────── */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 animate-fade-up">
            <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
            <p className="font-headline-sm text-primary font-semibold">Không tìm thấy món nào</p>
            <p className="text-body-sm text-on-surface-variant text-[13px]">Thử tìm với từ khoá khác hoặc chọn danh mục khác.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('Tất cả'); }}
              className="mt-1 px-4 py-2 rounded-xl border border-primary text-primary text-[13px] font-label-md hover:bg-primary hover:text-on-primary transition-all active:scale-95"
            >
              Xem tất cả món
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product, i) => (
              <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <ProductCard
                  product={product}
                  onClick={(p) => setSelectedProduct(p)}
                  onAddToCart={() => alert(`Đã thêm ${product.name}`)}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Barista Promise Banner ──────────────────────── */}
        <div className="animate-fade-up delay-300 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
            </div>
            <div>
              <p className="font-label-lg text-primary font-bold">Tùy biến độ ngọt, lượng đá &amp; loại sữa hạt</p>
              <p className="font-body-sm text-on-surface-variant mt-0.5 text-[12.5px]">
                Bấm trực tiếp vào từng món trong giỏ để tinh chỉnh công thức theo khẩu vị riêng.
              </p>
            </div>
          </div>
          <button className="shrink-0 w-full md:w-auto px-5 py-2.5 rounded-xl border-2 border-primary-container text-primary font-label-md hover:bg-primary hover:text-on-primary hover:border-primary transition-all text-[13px]">
            Tìm hiểu thêm
          </button>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={selectedProduct !== null}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p) => alert(`Đã thêm ${p.name} từ Modal!`)}
      />
    </>
  );
};

export default CustomerMenu;

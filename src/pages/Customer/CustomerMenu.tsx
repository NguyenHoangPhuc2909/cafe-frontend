import React, { useState } from 'react';
import BaseProductCard from '../../components/common/BaseProductCard';
import type { Product } from '../../types/product';
import BaseProductModal from '../../components/common/BaseProductModal';
import { Link } from 'react-router-dom';
import { useCustomerCart } from '../../hooks/useCustomerCart';

import {
  SORT_LABELS,
  SORT_CYCLE,
  type SortMode
} from '../../constants/menu';

const CustomerMenu: React.FC = () => {
  const { products, isLoading, menuError, reloadMenu, addItem, addItemWithOptions } = useCustomerCart();
  const [notice, setNotice] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [sortMode, setSortMode]               = useState<SortMode>('default');
  const searchRef = React.useRef<HTMLInputElement>(null);

  const getCategoryCount = (label: string) => {
    return label === 'Tất cả' ? products.length : products.filter(p => p.category === label).length;
  };

  // ── Filter by category
  const categories = ['Tất cả', ...new Set(products.map(p => p.category))]
    .map(label => ({ label, icon: label === 'Tất cả' ? 'restaurant_menu' : 'local_cafe' }));
  const byCategory = activeCategory === 'Tất cả'
    ? products : products.filter(p => p.category === activeCategory);

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
      <div className="bg-surface/90 glass-warm border-b border-outline-variant/25 sticky top-16 md:top-[72px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-5 md:mb-8 animate-slide-down space-y-2.5">
        {/* Category pills */}
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto pb-0.5 custom-scroll">
          {categories.map((cat, i) => {
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
              aria-label="Tìm món trong thực đơn"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm tên món, mô tả…"
              className="w-full pl-10 pr-24 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-base sm:text-[13px] font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                className="absolute right-11 flex h-11 w-11 items-center justify-center rounded-lg text-outline hover:text-error transition-colors"
                title="Xoá tìm kiếm"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
            )}
            {/* Sort button */}
            <button
              onClick={cycleSort}
              title={`Sắp xếp: ${SORT_LABELS[sortMode]}`}
              className={`absolute right-0 flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
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

      {menuError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error-container/30 p-4 text-sm text-on-surface">
        <p>{menuError}</p>
        <button onClick={reloadMenu} disabled={isLoading} className="min-h-11 rounded-xl border border-primary px-4 font-semibold text-primary disabled:opacity-50">{isLoading ? 'Đang tải…' : 'Thử lại'}</button>
      </div>}
      <p role="status" aria-live="polite" className="sr-only">{notice}</p>
      {notice && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-secondary-fixed/50 px-4 py-3 text-sm text-primary"><span>{notice}</span><Link className="shrink-0 font-semibold underline underline-offset-4" to="/cart">Xem giỏ</Link></div>}
      <div className="space-y-7 md:space-y-10">
        <section aria-label="Lời chào từ quán" className="flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a1508] to-[#4a2e1b] p-4 text-on-primary sm:p-6">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-fixed-dim sm:text-xs">Một chút thư thả tại quán</p>
            <h1 className="font-headline-lg text-xl font-bold leading-tight sm:text-2xl">Hôm nay bạn muốn uống gì?</h1>
            <p className="mt-2 text-xs leading-relaxed text-white/75 sm:text-sm">Chọn món yêu thích, thêm vào giỏ và để quán lo phần còn lại.</p>
          </div>
          <img src="/images/ca_phe_trung.png" alt="" className="hidden h-24 w-24 shrink-0 rounded-xl object-cover sm:block" />
        </section>

        {/* ── Section Header ──────────────────────────────── */}
        <div id="customer-menu" className="scroll-mt-52 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-up delay-150">
          <div>
            <h3 className="font-headline-md text-[20px] text-primary font-bold">Thực đơn hôm nay</h3>
            <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
              {products.length} món đang phục vụ · Chọn món để xem chi tiết
            </p>
          </div>
          <span className="self-start md:self-auto font-label-md text-[12px] text-on-surface-variant">
            {searchQuery && <em className="ml-1 not-italic text-primary font-semibold">Kết quả cho "{searchQuery}"</em>}
          </span>
        </div>

        {/* ── Product Grid ────────────────────────────────── */}
        {isLoading && products.length === 0 ? (
          <div aria-label="Đang tải thực đơn" role="status" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-container" />)}
          </div>
        ) : menuError && products.length === 0 ? null : filteredProducts.length === 0 ? (
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
                <BaseProductCard
                  product={product}
                  variant="customer"
                  onCardClick={(p) => setSelectedProduct(p)}
                  onActionPrimary={(p) => { addItem(p); setNotice(`Đã thêm ${p.name} vào giỏ.`); }}
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
              <p className="font-label-lg text-primary font-bold">Chọn món theo nhịp của bạn</p>
              <p className="font-body-sm text-on-surface-variant mt-0.5 text-[12.5px]">
                Xem lại món và điều chỉnh số lượng trong giỏ trước khi đặt.
              </p>
            </div>
          </div>
          <Link to="/cart" className="shrink-0 min-h-11 text-center w-full md:w-auto px-5 py-2.5 rounded-xl border-2 border-primary-container text-primary font-label-md hover:bg-primary hover:text-on-primary hover:border-primary transition-all text-[13px]">Xem giỏ hàng</Link>
        </div>
      </div>

      {/* Product Modal */}
      <BaseProductModal
        isOpen={selectedProduct !== null}
        product={selectedProduct}
        variant="customer"
        onClose={() => setSelectedProduct(null)}
        onConfirm={(p, _options, qty) => { addItemWithOptions(p, '', qty); setNotice(`Đã thêm ${qty} ${p.name} vào giỏ.`); }}
      />
    </>
  );
};

export default CustomerMenu;

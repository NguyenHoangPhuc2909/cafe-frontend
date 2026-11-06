import SelectField from '../../components/ui/SelectField';
import Icon from '../../components/ui/Icon';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BaseProductCard from '../../components/common/BaseProductCard';
import BaseProductModal from '../../components/common/BaseProductModal';
import { ProductGridSkeleton } from '../../components/ui/Skeleton';
import { useCustomerCart } from '../../hooks/useCustomerCart';
import type { Product } from '../../types/product';
import { SORT_LABELS, SORT_CYCLE, type SortMode } from '../../constants/menu';

export default function CustomerMenu() {
  const { products, isLoading, menuError, addItem, addItemWithOptions } = useCustomerCart();
  const [notice, setNotice] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const searchRef = useRef<HTMLInputElement>(null);
  const categories = ['Tất cả', ...new Set(products.map(product => product.category))];
  const category = categories.includes(activeCategory) ? activeCategory : 'Tất cả';
  const query = searchQuery.trim().toLocaleLowerCase('vi');
  const filtered = products.filter(product => (category === 'Tất cả' || product.category === category)
    && (!query || `${product.name} ${product.description}`.toLocaleLowerCase('vi').includes(query)))
    .sort((a, b) => sortMode === 'price_asc' ? a.price - b.price : sortMode === 'price_desc' ? b.price - a.price : sortMode === 'name_asc' ? a.name.localeCompare(b.name, 'vi') : 0);
  const initialLoading = isLoading && products.length === 0;
  const modalProduct = selectedProduct && (products.find(product => String(product.id) === String(selectedProduct.id)) ?? { ...selectedProduct, isActive: false });

  return <>
    <section className="menu-hero" aria-label="Lời chào từ quán">
      <div className="min-w-0"><p className="ui-eyebrow">L'Atelier · Một chút thư thả</p>
        <h1>Món quen, một ngày mới.</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant">Chọn một ly yêu thích. Ngồi lại một chút, để quán lo phần còn lại.</p>
        <a href="#customer-menu" className="mt-4 inline-flex min-h-control items-center gap-2 text-sm font-semibold text-primary">Khám phá thực đơn <span aria-hidden="true" className="icon-slot text-lg"><Icon name="arrow_downward" /></span></a>
      </div>
      <img src="/images/ca_phe_trung.png" alt="Cà phê trứng tại L’Atelier" className="menu-hero__image" />
    </section>

    <div className="menu-toolbar space-y-3">
      <div className="flex gap-1 overflow-x-auto custom-scroll" aria-label="Danh mục thực đơn">
        {categories.map(label => <button type="button" key={label} aria-pressed={category === label} className="menu-category" onClick={() => setActiveCategory(label)}>
          {label}<span className="rounded-md bg-current/5 px-1.5 text-[10px] opacity-75">{initialLoading ? '—' : label === 'Tất cả' ? products.length : products.filter(product => product.category === label).length}</span>
        </button>)}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <span aria-hidden="true" className="icon-slot pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-outline"><Icon name="search" /></span>
          <input ref={searchRef} id="menu-search" type="search" aria-label="Tìm món trong thực đơn" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Tìm món bạn thích…" className="min-h-control w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-11 pr-12 text-base sm:text-sm" />
          {searchQuery && <button type="button" aria-label="Xóa tìm kiếm" className="absolute right-0 top-0 flex h-control w-control items-center justify-center text-outline" onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}><span aria-hidden="true" className="icon-slot text-xl"><Icon name="close" /></span></button>}
        </div>
        <SelectField label="Sắp xếp thực đơn" value={sortMode} onChange={setSortMode} className="w-full sm:w-44 sm:shrink-0" options={SORT_CYCLE.map(mode => ({ value: mode, label: SORT_LABELS[mode] }))} />
      </div>
    </div>

    {menuError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error-container/30 p-4 text-sm"><p>{menuError}</p></div>}
    <div role="status" aria-live="polite" className={notice ? 'mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-secondary/20 bg-secondary-fixed/30 px-4 py-2 text-sm text-primary' : 'sr-only'}>
      <span>{notice}</span>{notice && <Link className="inline-flex min-h-control items-center gap-2 font-semibold" to="/cart">Xem giỏ <span aria-hidden="true" className="icon-slot text-lg"><Icon name="arrow_forward" /></span></Link>}
    </div>
    <section id="customer-menu" className="scroll-mt-64" aria-labelledby="menu-title" aria-busy={isLoading}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2"><div><p className="ui-eyebrow mb-2">Pha chế từ sự tận tâm</p><h2 id="menu-title" className="text-2xl font-bold text-primary">{category === 'Tất cả' ? 'Thực đơn hôm nay' : category}</h2></div>
        <p className="text-xs text-on-surface-variant">{initialLoading ? 'Đang chuẩn bị thực đơn…' : isLoading ? 'Đang cập nhật thực đơn…' : menuError && products.length === 0 ? 'Chưa tải được thực đơn' : `${filtered.length} món${searchQuery ? ` · Kết quả cho “${searchQuery}”` : ' đang phục vụ'}`}</p>
      </div>
      {initialLoading ? <ProductGridSkeleton /> : menuError && products.length === 0 ? null : filtered.length === 0 ? <div className="ui-panel flex flex-col items-center gap-3 px-5 py-14 text-center">
        <span aria-hidden="true" className="icon-slot text-4xl text-outline"><Icon name={products.length === 0 ? 'local_cafe' : 'search_off'} /></span>
        <h3 className="font-semibold text-primary">{products.length === 0 ? 'Thực đơn đang được chuẩn bị' : 'Chưa tìm thấy món phù hợp'}</h3>
        <p className="text-sm text-on-surface-variant">{products.length === 0 ? 'Bạn có thể tải lại sau hoặc liên hệ nhân viên của quán.' : 'Thử từ khóa khác hoặc xem lại tất cả món nhé.'}</p>
        {products.length > 0 && <button type="button" className="ui-button mt-2" onClick={() => { setSearchQuery(''); setActiveCategory('Tất cả'); }}>Xem tất cả món</button>}
      </div> : <div className="menu-grid">{filtered.map(product => <BaseProductCard key={product.id} product={product} onCardClick={setSelectedProduct} actionsDisabled={isLoading || !!menuError} onActionPrimary={product => { if (product.sizes?.length) { setSelectedProduct(product); return; } addItem(product); setNotice(`Đã thêm ${product.name} vào giỏ.`); }} />)}</div>}
    </section>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/50 bg-surface px-5 py-4">
      <div className="flex items-center gap-3"><span aria-hidden="true" className="icon-slot flex h-control w-control shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-primary"><Icon name="shopping_bag" /></span><div><p className="text-sm font-semibold text-primary">Đủ món yêu thích rồi chứ?</p><p className="mt-1 text-xs leading-relaxed text-on-surface-variant">Xem lại món và số lượng trước khi đặt.</p></div></div><Link to="/cart" className="ui-button">Xem giỏ hàng <span aria-hidden="true" className="icon-slot text-lg"><Icon name="arrow_forward" /></span></Link>
    </div>
    <BaseProductModal isOpen={selectedProduct !== null} product={modalProduct} variant="customer" disabled={isLoading || !!menuError || modalProduct?.isActive === false} disabledMessage={menuError ?? (modalProduct?.isActive === false ? 'Món đang ngừng bán.' : isLoading ? 'Đang cập nhật thực đơn…' : undefined)} onClose={() => setSelectedProduct(null)} onConfirm={(product, qty, size, customization) => { addItemWithOptions(product, qty, size, customization); setNotice(`Đã thêm ${qty} ${product.name}${size ? ` · Size ${size}` : ''} vào giỏ.`); }} />
  </>;
}

import Icon from '../../components/ui/Icon';
import { ProductGridSkeleton } from '../../components/ui/Skeleton';
import React, { useCallback, useState } from 'react';
import BaseProductCard from '../../components/common/BaseProductCard';
import BaseProductModal from '../../components/common/BaseProductModal';
import OrderTicket from '../../components/staff/OrderTicket';
import { useCart } from '../../hooks/useCart';
import type { Product } from '../../types/product';
import type { OrderMode } from '../../types/staff';
import { usePosMenu } from '../../hooks/usePosMenu';
import { filterPosMenu, posMenuCategories } from '../../utils/posMenu';

const POSPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [orderMode, setOrderMode] = useState<OrderMode>('dinein');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Modal state
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const {
    cart, addItem, addItemWithOptions, updateQty, removeItem, clearCart, syncProducts,
    subtotal, total, itemCount,
  } = useCart();

  const onMenuLoaded = useCallback((menu: Product[]) => {
    syncProducts(menu);
    setActiveCategory(current => current && menu.some(product => product.category === current) ? current : null);
    setModalProduct(current => current ? menu.find(product => String(product.id) === String(current.id)) ?? null : null);
  }, [syncProducts]);
  const { products, isLoading, error } = usePosMenu(onMenuLoaded);
  const closeModal = useCallback(() => setModalProduct(null), []);
  const categories = [
    { value: null as string | null, label: 'Tất cả', icon: 'restaurant_menu', count: products.length },
    ...posMenuCategories(products).map(category => ({ ...category, value: category.label })),
  ];
  const selectedCategory = products.some(product => product.category === activeCategory) ? activeCategory : null;
  const filteredProducts = filterPosMenu(products, selectedCategory, searchQuery);
  const addCurrentProduct = (product: Product, options = '', quantity = 1) => {
    if (isLoading || error) return;
    const current = products.find(candidate => String(candidate.id) === String(product.id));
    if (!current || current.isActive === false) return;
    if (options || quantity !== 1) addItemWithOptions(current, options, quantity);
    else addItem(current);
  };

  const getCartQty = (product: Product) =>
    cart.filter(i => String(i.productId) === String(product.id))
        .reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex-1 flex flex-col md:grid md:grid-cols-12 h-full overflow-hidden bg-background relative">

      {/* ════════ LEFT 65% — MENU CATALOG ════════ */}
      <section className="pos-catalog min-w-0 flex-1 md:col-span-7 lg:col-span-8 flex flex-col h-full border-r border-outline-variant/40 overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-4 pb-3 bg-surface border-b border-outline-variant/30 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span aria-hidden="true" className="icon-slot text-on-primary text-[15px]"
                  ><Icon name="restaurant_menu" /></span>
              </div>
              <h1 className="font-headline-md text-base sm:text-[18px] font-bold text-on-surface">
                Thực đơn
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-md bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-secondary">{isLoading ? 'Đang tải…' : error ? 'Mất kết nối' : `${filteredProducts.length} món`}</span>

            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center">
            <span aria-hidden="true" className={`icon-slot absolute left-3.5 text-[18px] pointer-events-none transition-colors ${
              searchQuery ? 'text-primary' : 'text-outline'
            }`}><Icon name="search" /></span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Tìm món trong thực đơn"
              placeholder="Tìm tên món, mô tả…"
              className="min-h-control w-full pl-10 pr-10 py-0 bg-surface-container-lowest border border-outline-variant/40
                rounded-xl text-base sm:text-[13px] font-body-md text-on-surface placeholder:text-outline
                focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                aria-label="Xóa tìm kiếm" className="absolute right-0 flex h-control w-control items-center justify-center text-outline hover:text-error transition-colors">
                <span aria-hidden="true" className="icon-slot text-[17px]"><Icon name="close" /></span>
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scroll">
            {categories.map((cat) => {
              const active = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value === null ? 'all' : `category:${cat.value}`}
                  onClick={() => setActiveCategory(cat.value)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 min-h-control px-3.5 py-2 rounded-xl
                    font-label-caps text-[11px] font-semibold transition-all duration-200 shrink-0 border
                    ${active
                      ? 'bg-primary text-on-primary border-transparent'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:border-primary/40 hover:text-primary'
                    }`}
                >
                  <span aria-hidden="true" className="icon-slot text-[14px]"
                    ><Icon name={cat.icon} /></span>
                  {cat.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                    active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>{cat.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {isLoading && products.length === 0 ? (
          <ProductGridSkeleton staff />
        ) : error ? (
          <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span aria-hidden="true" className="icon-slot text-5xl text-error"><Icon name="cloud_off" /></span>
            <p className="max-w-md text-sm text-error">{error}</p>

          </div>
        ) : products.length === 0 ? (
          <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <h2 className="font-semibold text-primary">Chưa có món đang bán</h2>
            <p className="text-sm text-on-surface-variant">Thực đơn hiện chưa có sản phẩm được bật bán.</p>

          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <span aria-hidden="true" className="icon-slot text-[48px] text-outline opacity-40"><Icon name="search_off" /></span>
            <p className="font-headline-sm text-primary font-semibold">Không tìm thấy món nào</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory(null); }}
              className="mt-1 px-4 py-2 rounded-xl border border-primary text-primary text-[13px]
                font-label-caps hover:bg-primary hover:text-on-primary transition-all active:scale-95"
            >
              Xem tất cả món
            </button>
          </div>
        ) : (
          <div className="pos-product-grid flex-1 overflow-y-auto p-4 pb-24 md:pb-4 custom-scroll">
            {filteredProducts.map((product) => (
              <BaseProductCard
                key={product.id}
                product={product}
                variant="staff"
                cartQty={getCartQty(product)}
                onCardClick={setModalProduct}
                onActionPrimary={product => addCurrentProduct(product)}
                onActionSecondary={setModalProduct}
              />
            ))}
          </div>
        )}

        {/* ── Mobile Cart Summary FAB ── */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 z-20">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full flex items-center justify-between bg-primary text-on-primary
              px-5 py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(161,61,23,0.35)]
              active:scale-95 transition-all font-label-caps"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-[12px] font-bold">
                {itemCount}
              </div>
              <span className="font-bold text-[14px]">Phiếu tạm</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[15px]">
              {total.toLocaleString('vi-VN')}đ
              <span aria-hidden="true" className="icon-slot text-[18px]"><Icon name="shopping_bag" /></span>
            </div>
          </button>
        </div>

        {/* Status bar (Desktop only) */}
        <div className="hidden md:flex h-9 border-t border-outline-variant/30 bg-surface items-center justify-between px-4
          text-[10px] font-label-caps text-on-surface-variant shrink-0">
          <div className="flex items-center gap-4">
            <span>Thực đơn tại quầy</span>
          </div>
          <div className={`flex items-center gap-1.5 font-semibold ${error ? 'text-error' : 'text-on-surface-variant'}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${error ? 'bg-error' : isLoading ? 'bg-outline' : 'bg-green-500'}`} />
            {isLoading ? 'Đang tải thực đơn' : error ? 'Chưa tải được thực đơn' : 'Giá theo thực đơn của quán'}
          </div>
        </div>
      </section>

      {/* ════════ RIGHT 35% — ORDER TICKET (Desktop or Mobile Drawer) ════════ */}
      <section className={`
        absolute inset-0 z-50 bg-surface md:static md:z-auto
        flex flex-col h-full overflow-hidden transition-transform duration-300
        min-w-0 md:col-span-5 lg:col-span-4
        ${showMobileCart ? 'visible translate-y-0' : 'invisible translate-y-full md:visible md:translate-y-0'}
      `}>
        {/* Mobile close button header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-outline-variant/30 bg-surface shrink-0">
          <h2 className="font-headline-sm text-[18px] font-bold text-on-surface">Phiếu tạm</h2>
          <button
            onClick={() => setShowMobileCart(false)}
            aria-label="Đóng giỏ hàng"
            className="w-control h-control flex items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <span aria-hidden="true" className="icon-slot text-[20px]"><Icon name="close" /></span>
          </button>
        </div>

        <OrderTicket
          cart={cart}
          orderMode={orderMode}
          subtotal={subtotal}
          total={total}
          itemCount={itemCount}
          onSetMode={setOrderMode}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onClear={clearCart}
          checkoutDisabled={isLoading || !!error}
          onCheckout={() => {
            alert('Chức năng tạo đơn và thanh toán POS chưa được kết nối.');
            setShowMobileCart(false);
          }}
        />
      </section>

      {/* ════════ Customize Modal ════════ */}
      <BaseProductModal
        product={modalProduct}
        isOpen={modalProduct !== null}
        variant="staff"
        allowSizeSelection={false}
        disabled={isLoading || !!error}
        disabledMessage={error ?? (isLoading ? 'Đang cập nhật thực đơn, vui lòng chờ trước khi thêm món.' : undefined)}
        onClose={closeModal}
        onConfirm={addCurrentProduct}
      />
    </div>
  );
};

export default POSPage;

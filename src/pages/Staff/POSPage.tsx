import Icon from "../../components/ui/Icon";
import { ProductGridSkeleton } from "../../components/ui/Skeleton";
import React, { useCallback, useState, useRef, useEffect } from "react";
import BaseProductCard from "../../components/common/BaseProductCard";
import BaseProductModal from "../../components/common/BaseProductModal";
import OrderTicket from "../../components/staff/OrderTicket";
import { useCart } from "../../hooks/useCart";
import type { Product } from "../../types/product";
import type { OrderMode } from "../../types/staff";
import { usePosMenu } from "../../hooks/usePosMenu";
import { filterPosMenu, posMenuCategories } from "../../utils/posMenu";
import { useStaffAuth } from "../../hooks/useStaffAuth";
import type { DrinkSize } from "../../types/productSize";
import type { DrinkCustomization } from "../../types/drinkOptions";
import { Link, useNavigate } from "react-router-dom";
import { createStaffOrder, staffErrorMessage } from "../../services/staffApi";
import { isOrderDefinitelyRejected } from "../../services/guest";
import { buildGuestOrder } from "../../utils/guest";
import { restoreCustomerCart } from '../../utils/cart';

const POSPage: React.FC = () => {
  const { session } = useStaffAuth();
  const draftKey = `cafe.pos-cart.${session?.username ?? ''}`;
  const [initialCart] = useState(() => {
    try { return restoreCustomerCart(sessionStorage.getItem(draftKey)).items; }
    catch { return []; }
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [orderMode, setOrderMode] = useState<OrderMode>(() => {
    try { return JSON.parse(sessionStorage.getItem(draftKey) ?? 'null')?.orderType === 'TAKEAWAY' ? 'takeaway' : 'dinein'; }
    catch { return 'dinein'; }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Modal state
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const {
    cart,
    addItem,
    addItemWithOptions,
    updateQty,
    removeItem,
    clearCart,
    consumeSubmittedItems,
    syncProducts,
    subtotal,
    total,
    itemCount,
  } = useCart(initialCart);

  useEffect(() => {
    try { sessionStorage.setItem(draftKey, JSON.stringify({ items: cart, note: '', orderType: orderMode === 'takeaway' ? 'TAKEAWAY' : 'DINE_IN' })); }
    catch { /* Sending checks storage again before making a POST. */ }
  }, [cart, draftKey, orderMode]);

  const navigate = useNavigate();
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const attemptKey = `cafe.pos-attempt.${session?.username ?? ''}`;
  const [unresolved, setUnresolved] = useState(() => {
    try { return sessionStorage.getItem(attemptKey) !== null; }
    catch { return true; }
  });

  const onMenuLoaded = useCallback(
    (menu: Product[]) => {
      syncProducts(menu);
      setActiveCategory((current) =>
        current && menu.some((product) => product.category === current)
          ? current
          : null,
      );
      setModalProduct((current) =>
        current
          ? (menu.find(
              (product) => String(product.id) === String(current.id),
            ) ?? null)
          : null,
      );
    },
    [syncProducts],
  );
  const {
    products,
    isLoading,
    error,
    setProductActive,
    updatingId,
    updateError,
    notice,
  } = usePosMenu(session?.accessToken, onMenuLoaded);
  const saving = updatingId !== null;
  const closeModal = useCallback(() => setModalProduct(null), []);
  const categories = [
    {
      value: null as string | null,
      label: "Tất cả",
      icon: "restaurant_menu",
      count: products.length,
    },
    ...posMenuCategories(products).map((category) => ({
      ...category,
      value: category.label,
    })),
  ];
  const selectedCategory = products.some(
    (product) => product.category === activeCategory,
  )
    ? activeCategory
    : null;
  const filteredProducts = filterPosMenu(
    products,
    selectedCategory,
    searchQuery,
  );
  const addCurrentProduct = (
    product: Product,
    quantity = 1,
    size?: DrinkSize,
    customization?: DrinkCustomization,
  ) => {
    if (isLoading || error || saving || submittingRef.current || unresolved) return;
    const current = products.find(
      (candidate) => String(candidate.id) === String(product.id),
    );
    if (!current || current.isActive === false) return;
    if (quantity !== 1 || size || customization)
      addItemWithOptions(current, quantity, size, customization);
    else addItem(current);
  };

  const handleCheckout = async () => {
    if (!session || session.role !== 'STAFF' || submittingRef.current ||
        isLoading || error || saving || unresolved) return;

    setCheckoutError(null);

    submittingRef.current = true;
    setSubmitting(true);
    const submittedItems = [...cart];
    let sent = false;
    try {
      if (sessionStorage.getItem(attemptKey)) {
        setUnresolved(true);
        return;
      }
      const request = {
        ...buildGuestOrder(submittedItems, ''),
        orderType: orderMode === 'dinein' ? 'DINE_IN' as const : 'TAKEAWAY' as const,
      };
      sessionStorage.setItem(attemptKey, JSON.stringify({
        startedAt: new Date().toISOString(), request,
      }));
      sent = true;
      const order = await createStaffOrder(session.accessToken, request);
      consumeSubmittedItems(submittedItems);
      // A storage failure must not turn a known success into a failed POST.
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ items: [], note: '' }));
        sessionStorage.removeItem(attemptKey);
      }
      catch { setUnresolved(true); }
      navigate(`/staff/orders?filter=all&order=${order.id}`);
    } catch (cause) {
      if (sent && !isOrderDefinitelyRejected(cause)) {
        setUnresolved(true);
        setCheckoutError('Chưa xác định được kết quả tạo đơn. Đối chiếu danh sách đơn trước khi gửi lại.');
      } else {
        if (sent) {
          try { sessionStorage.removeItem(attemptKey); }
          catch { setUnresolved(true); }
        }
        setCheckoutError(staffErrorMessage(cause));
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const resolveAttempt = (wasCreated: boolean) => {
    if (submittingRef.current) return;
    try {
      sessionStorage.removeItem(attemptKey);
      if (wasCreated) clearCart();
      setUnresolved(false);
      setCheckoutError(null);
    } catch {
      setCheckoutError('Chưa xóa được trạng thái gửi đơn. Vui lòng cho phép lưu trữ trong trình duyệt.');
    }
  };

  const getCartQty = (product: Product) =>
    cart
      .filter((i) => String(i.productId) === String(product.id))
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
                <span
                  aria-hidden="true"
                  className="icon-slot text-on-primary text-[15px]"
                >
                  <Icon name="restaurant_menu" />
                </span>
              </div>
              <h1 className="font-headline-md text-base sm:text-[18px] font-bold text-on-surface">
                Thực đơn
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-md bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-secondary">
                {isLoading
                  ? "Đang tải…"
                  : error
                    ? "Mất kết nối"
                    : `${filteredProducts.length} món · ${products.filter((product) => product.isActive !== false).length} đang bán`}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center">
            <span
              aria-hidden="true"
              className={`icon-slot absolute left-3.5 text-[18px] pointer-events-none transition-colors ${
                searchQuery ? "text-primary" : "text-outline"
              }`}
            >
              <Icon name="search" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm món trong thực đơn"
              placeholder="Tìm tên món, mô tả…"
              className="min-h-control w-full pl-10 pr-10 py-0 bg-surface-container-lowest border border-outline-variant/40
                rounded-xl text-base sm:text-[13px] font-body-md text-on-surface placeholder:text-outline
                focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-0 flex h-control w-control items-center justify-center text-outline hover:text-error transition-colors"
              >
                <span aria-hidden="true" className="icon-slot text-[17px]">
                  <Icon name="close" />
                </span>
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scroll">
            {categories.map((cat) => {
              const active = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value === null ? "all" : `category:${cat.value}`}
                  onClick={() => setActiveCategory(cat.value)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 min-h-control px-3.5 py-2 rounded-xl
                    font-label-caps text-[11px] font-semibold transition-all duration-200 shrink-0 border
                    ${
                      active
                        ? "bg-primary text-on-primary border-transparent"
                        : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:border-primary/40 hover:text-primary"
                    }`}
                >
                  <span aria-hidden="true" className="icon-slot text-[14px]">
                    <Icon name={cat.icon} />
                  </span>
                  {cat.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                      active
                        ? "bg-on-primary/20 text-on-primary"
                        : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {updateError && (
          <p role="alert" className="pos-menu-notice pos-menu-notice--error">
            {updateError}
          </p>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {notice}
        </p>

        {/* Product Grid */}
        {isLoading && products.length === 0 ? (
          <ProductGridSkeleton staff />
        ) : error ? (
          <div
            role="alert"
            className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
          >
            <span aria-hidden="true" className="icon-slot text-5xl text-error">
              <Icon name="cloud_off" />
            </span>
            <p className="max-w-md text-sm text-error">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div
            role="status"
            className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
          >
            <h2 className="font-semibold text-primary">
              Chưa có món trong thực đơn
            </h2>
            <p className="text-sm text-on-surface-variant">
              Thêm sản phẩm vào thực đơn để quản lý trạng thái bán.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <span
              aria-hidden="true"
              className="icon-slot text-[48px] text-outline opacity-40"
            >
              <Icon name="search_off" />
            </span>
            <p className="font-headline-sm text-primary font-semibold">
              Không tìm thấy món nào
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory(null);
              }}
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
                onActionPrimary={(product) =>
                  product.sizes?.length
                    ? setModalProduct(product)
                    : addCurrentProduct(product)
                }
                onActionSecondary={setModalProduct}
                onActiveChange={(product, active) =>
                  void setProductActive(product, active)
                }
                activeUpdating={String(updatingId) === String(product.id)}
                activeDisabled={submitting || unresolved || isLoading || !!error || saving}
                actionsDisabled={submitting || unresolved || isLoading || !!error || saving}
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
              {total.toLocaleString("vi-VN")}đ
              <span aria-hidden="true" className="icon-slot text-[18px]">
                <Icon name="shopping_bag" />
              </span>
            </div>
          </button>
        </div>

        {/* Status bar (Desktop only) */}
        <div
          className="hidden md:flex h-9 border-t border-outline-variant/30 bg-surface items-center justify-between px-4
          text-[10px] font-label-caps text-on-surface-variant shrink-0"
        >
          <div className="flex items-center gap-4">
            <span>Thực đơn tại quầy</span>
          </div>
          <div
            className={`flex items-center gap-1.5 font-semibold ${error ? "text-error" : "text-on-surface-variant"}`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${error ? "bg-error" : isLoading ? "bg-outline" : "bg-green-500"}`}
            />
            {isLoading
              ? "Đang tải thực đơn"
              : error
                ? "Chưa tải được thực đơn"
                : "Giá theo thực đơn của quán"}
          </div>
        </div>
      </section>

      {/* ════════ RIGHT 35% — ORDER TICKET (Desktop or Mobile Drawer) ════════ */}
      <section
        className={`
        absolute inset-0 z-50 bg-surface md:static md:z-auto
        flex flex-col h-full overflow-hidden transition-transform duration-300
        min-w-0 md:col-span-5 lg:col-span-4
        ${showMobileCart ? "visible translate-y-0" : "invisible translate-y-full md:visible md:translate-y-0"}
      `}
      >
        {/* Mobile close button header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-outline-variant/30 bg-surface shrink-0">
          <h2 className="font-headline-sm text-[18px] font-bold text-on-surface">
            Phiếu tạm
          </h2>
          <button
            onClick={() => setShowMobileCart(false)}
            aria-label="Đóng giỏ hàng"
            className="w-control h-control flex items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <span aria-hidden="true" className="icon-slot text-[20px]">
              <Icon name="close" />
            </span>
          </button>
        </div>

        {(checkoutError || unresolved) && (
          <div role="alert" className="shrink-0 space-y-2 border-b p-4 text-sm text-error">
            <p>{checkoutError ?? 'Có lần gửi đơn chưa xác định kết quả. Đối chiếu danh sách đơn trước khi tiếp tục.'}</p>
            <Link to="/staff/orders?filter=all" className="block underline">Xem danh sách đơn</Link>
            {unresolved && <>
              <p>Sau khi đối chiếu đúng món, hình thức phục vụ và thời điểm gửi:</p>
              <button type="button" onClick={() => resolveAttempt(true)} className="ui-button w-full">
                Đơn đã tạo — xóa phiếu tạm
              </button>
              <button type="button" onClick={() => resolveAttempt(false)} className="ui-button w-full">
                Đã xác nhận đơn chưa được tạo
              </button>
            </>}
          </div>
        )}

        <OrderTicket
          cart={cart}
          orderMode={orderMode}
          subtotal={subtotal}
          total={total}
          itemCount={itemCount}
          onSetMode={(mode) => {
            if (submittingRef.current || unresolved) return;
            setOrderMode(mode);
          }}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onClear={clearCart}
          checkoutDisabled={
            submitting || unresolved ||
            isLoading ||
            !!error ||
            saving
          }
          onCheckout={() => void handleCheckout()}
          submitting={submitting}
          editingDisabled={submitting || unresolved}
        />
      </section>

      {/* ════════ Customize Modal ════════ */}
      <BaseProductModal
        product={modalProduct}
        isOpen={modalProduct !== null}
        variant="staff"
        disabled={
          submitting || unresolved || isLoading || !!error || saving || modalProduct?.isActive === false
        }
        disabledMessage={
          error ??
          (modalProduct?.isActive === false
            ? "Món đang ngừng bán."
            : saving
              ? "Đang lưu trạng thái món…"
              : isLoading
                ? "Đang cập nhật thực đơn, vui lòng chờ trước khi thêm món."
                : undefined)
        }
        onClose={closeModal}
        onConfirm={addCurrentProduct}
      />
    </div>
  );
};

export default POSPage;

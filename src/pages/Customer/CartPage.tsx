import { Link } from 'react-router-dom';
import QuantityStepper from '../../components/ui/QuantityStepper';
import { useCustomerCart } from '../../hooks/useCustomerCart';
import { formatCurrency } from '../../utils/format';
import { PRODUCT_PLACEHOLDER } from '../../utils/products';

export default function CartPage() {
  const { cart, updateQty, removeItem, clearCart, subtotal, total, itemCount,
    note, setNote, menuError, isLoading, reloadMenu } = useCustomerCart();
  const hasUnavailable = cart.some(item => item.isAvailable === false);

  return (
    <div className="animate-fade-up min-w-0">
      <nav aria-label="Đường dẫn" className="mb-5 flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/" className="hover:text-primary">Thực đơn</Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-primary">Giỏ hàng</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/30 pb-5 md:mb-8">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold tracking-tight text-primary md:text-3xl">Giỏ hàng của bạn</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{itemCount > 0 ? `${itemCount} sản phẩm đã chọn. Một chút ngon lành đang chờ bạn.` : 'Chọn một món yêu thích để bắt đầu nhé.'}</p>
        </div>
        {cart.length > 0 && <button onClick={() => { clearCart(); setNote(''); }} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm text-on-surface-variant hover:bg-error-container/30 hover:text-error">
          <span aria-hidden="true" className="material-symbols-outlined text-lg">delete_sweep</span>Xóa giỏ
        </button>}
      </div>

      {menuError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/20 bg-error-container/30 p-4 text-sm">
        <p>{menuError} Giá và tình trạng món sẽ được cập nhật khi kết nối lại.</p>
        <button onClick={reloadMenu} disabled={isLoading} className="min-h-11 rounded-lg border border-primary px-4 font-semibold text-primary disabled:opacity-50">{isLoading ? 'Đang cập nhật…' : 'Thử lại'}</button>
      </div>}

      {cart.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-14 text-center md:py-20">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5 text-secondary"><span aria-hidden="true" className="material-symbols-outlined text-4xl">shopping_bag</span></div>
          <h2 className="font-headline-md text-xl font-semibold text-primary">Giỏ hàng đang trống</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant">Khám phá thực đơn và thêm những món bạn muốn thưởng thức.</p>
          <Link to="/" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-primary-container"><span aria-hidden="true" className="material-symbols-outlined text-xl">restaurant_menu</span>Xem thực đơn</Link>
        </div>
      ) : (
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <section aria-label="Các món trong giỏ" className="min-w-0 space-y-4 lg:col-span-8">
            {hasUnavailable && <p role="status" className="rounded-xl border border-error/20 bg-error-container/30 p-4 text-sm text-error">Một số món hiện đã ngừng bán. Bạn vui lòng xóa hoặc chọn món khác.</p>}
            {cart.map(item => (
              <article key={item.id} className="min-w-0 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <img src={item.imageUrl || PRODUCT_PLACEHOLDER} alt={item.name}
                    onError={event => { if (!event.currentTarget.src.endsWith(PRODUCT_PLACEHOLDER)) event.currentTarget.src = PRODUCT_PLACEHOLDER; }}
                    className="h-20 w-20 shrink-0 rounded-xl bg-surface-container object-cover sm:h-24 sm:w-24" />
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wider text-secondary sm:text-xs">{item.category}</p>
                    <h2 className="break-words font-headline-md text-sm font-bold leading-snug text-primary sm:text-base">{item.name}</h2>
                    <p className="mt-2 text-sm text-on-surface-variant">{formatCurrency(item.price)} <span className="text-xs">/ sản phẩm</span></p>
                    {item.isAvailable === false && <span className="mt-2 inline-block rounded-full bg-error-container px-2 py-1 text-xs font-semibold text-error">Tạm ngừng bán</span>}
                  </div>
                  <button onClick={() => removeItem(item.id)} aria-label={`Xóa ${item.name} khỏi giỏ`} className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-outline hover:bg-error-container/30 hover:text-error"><span aria-hidden="true" className="material-symbols-outlined text-xl">close</span></button>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 pt-4">
                  <QuantityStepper quantity={item.quantity} size="sm" disabled={item.isAvailable === false}
                    label={`Số lượng ${item.name}`} onChange={quantity => updateQty(item.id, quantity - item.quantity)} />
                  <span className="font-headline-md text-base font-bold text-primary sm:text-lg">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </article>
            ))}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-5">
              <label htmlFor="order-note" className="mb-2 block text-sm font-semibold text-primary">Ghi chú cho quán</label>
              <textarea id="order-note" value={note} onChange={event => setNote(event.target.value)} maxLength={500} rows={3}
                placeholder="Bạn có điều gì muốn nhắn với quán?"
                className="w-full resize-y rounded-xl border border-outline-variant/40 bg-surface p-3 text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:text-sm" />
            </div>
            <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:text-secondary"><span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_back</span>Tiếp tục chọn món</Link>
          </section>

          <aside aria-label="Tổng giỏ hàng" className="min-w-0 lg:sticky lg:top-24 lg:col-span-4">
            <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
              <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary-container" />
              <div className="p-5 sm:p-6">
                <h2 className="font-headline-md text-lg font-bold text-primary">Món bạn đã chọn</h2>
                <div className="my-5 flex justify-between gap-3 text-sm text-on-surface-variant"><span>Tạm tính ({itemCount} sản phẩm)</span><span className="shrink-0 font-semibold text-primary">{formatCurrency(subtotal)}</span></div>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-outline-variant/30 py-5"><span className="font-semibold text-primary">Tổng tiền</span><strong className="font-headline-md text-2xl text-primary">{formatCurrency(total)}</strong></div>
                <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface-variant"><span aria-hidden="true" className="material-symbols-outlined mt-0.5 shrink-0 text-xl text-secondary">qr_code_2</span><div><p className="font-semibold text-primary">Chưa xác định bàn</p><p>Quét mã QR tại bàn để bắt đầu đặt món tại quán.</p></div></div>
                <p className="mt-4 text-xs leading-relaxed text-on-surface-variant">Giá và tình trạng món được cập nhật theo thực đơn của quán. Tổng tiền sẽ được xác nhận khi gửi đơn.</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

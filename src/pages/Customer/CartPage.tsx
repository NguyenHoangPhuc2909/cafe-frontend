import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import QuantityStepper from '../../components/ui/QuantityStepper';
import { useCustomerCart } from '../../hooks/useCustomerCart';
import { useGuestSession } from '../../hooks/useGuestSession';
import { useCheckout } from '../../hooks/useCheckout';
import { formatCurrency } from '../../utils/format';
import { PRODUCT_PLACEHOLDER } from '../../utils/products';
import { formatDrinkOptions } from '../../utils/drinkOptions';
import type { CartItem } from '../../types/cart';
import GuestOrderResult from '../../components/common/GuestOrderResult';
import CustomerFlowSteps from '../../components/common/CustomerFlowSteps';

const itemLabel = (item: CartItem) => [item.name, item.size ? `size ${item.size}` : '', formatDrinkOptions(item)].filter(Boolean).join(' · ');

export default function CartPage() {
  const { cart, updateQty, removeItem, clearCart, subtotal, total, itemCount, note, setNote, menuError, isLoading } = useCustomerCart();
  const { session, isChecking, attempt, isSubmitting, orderError } = useGuestSession();
  const { order, startCheckout, error } = useCheckout();
  const navigate = useNavigate();
  const hasUnavailable = cart.some(item => item.isAvailable === false);
  const locked = isSubmitting || attempt?.state === 'unknown' || attempt?.state === 'sending' || !!order;
  const checkoutDisabled = !order && (!session || isChecking || isLoading || !!menuError || hasUnavailable || isSubmitting || !!attempt);
  const checkout = async () => { if (await startCheckout()) navigate('/checkout'); };

  return <div className="customer-flow-page">
    <CustomerFlowSteps current={1} />
    <header className="customer-page-heading"><div><h1>Giỏ hàng của bạn</h1><p>{itemCount > 0 ? `${itemCount} món đã chọn. Kiểm tra lại trước khi gửi đến quán.` : 'Chọn món yêu thích để bắt đầu.'}</p></div><Link to="/" className="customer-text-link"><Icon name="arrow_back" />Tiếp tục chọn món</Link></header>

    {menuError && <div role="alert" className="customer-notice customer-notice--error"><Icon name="cloud_off" /><p>{menuError} Giá và tình trạng món sẽ được cập nhật khi kết nối lại.</p></div>}
    <GuestOrderResult key={attempt?.startedAt ?? 'none'} />
    {order && cart.length > 0 && <div role="status" className="customer-notice"><Icon name="receipt_long" /><div><p>Đơn #{order.id} đã gửi đến quán.</p><Link to="/checkout" className="customer-text-link">Xem đơn và trạng thái thanh toán<Icon name="arrow_forward" /></Link></div></div>}
    {error && <div role="alert" className="customer-notice customer-notice--error"><Icon name="help" /><p>{error}</p></div>}
    {orderError && <div role="alert" className="customer-notice customer-notice--error"><Icon name="help" /><p>{orderError}</p></div>}

    {cart.length === 0 ? <section className="customer-empty-state">
      <span className="customer-empty-state__icon"><Icon name={order ? 'receipt_long' : 'shopping_bag'} /></span>
      <h2>{order ? `Đơn #${order.id} đã được gửi` : 'Giỏ hàng đang trống'}</h2>
      <p>{order ? 'Bạn có thể theo dõi thanh toán và quá trình chuẩn bị món của quán.' : 'Khám phá thực đơn và thêm những món bạn muốn thưởng thức.'}</p>
      <Link to={order ? '/checkout' : '/'} className="ui-button ui-button--primary"><Icon name={order ? 'receipt_long' : 'restaurant_menu'} />{order ? 'Theo dõi đơn hàng' : 'Xem thực đơn'}</Link>
    </section> : <div className="customer-cart-grid">
      <fieldset disabled={locked} aria-label="Các món trong giỏ" className="customer-cart-items">
        <div className="customer-panel">
          <div className="customer-panel-heading"><h2>Món đã chọn</h2><button type="button" onClick={() => { clearCart(); setNote(''); }} className="customer-remove-cart"><Icon name="delete" />Xóa giỏ</button></div>
          {hasUnavailable && <p role="status" className="customer-unavailable-note">Một số món đã ngừng bán. Vui lòng xóa hoặc chọn món khác để tiếp tục.</p>}
          {isLoading && <p role="status" className="customer-unavailable-note customer-unavailable-note--loading">Đang kiểm tra giá và tình trạng món…</p>}
          {cart.map(item => <article key={item.id} className="customer-cart-item">
            <div className="customer-cart-item__main">
              <img src={item.imageUrl || PRODUCT_PLACEHOLDER} alt={item.name} onError={event => { if (!event.currentTarget.src.endsWith(PRODUCT_PLACEHOLDER)) event.currentTarget.src = PRODUCT_PLACEHOLDER; }} />
              <div className="customer-cart-item__info"><h3>{item.name}</h3><p>{item.size && <span className="mr-2 font-semibold text-secondary">Size {item.size}</span>}{formatCurrency(item.price)}<span> / món</span></p>{formatDrinkOptions(item) && <p className="text-xs text-secondary">{formatDrinkOptions(item)}</p>}{item.isAvailable === false && <span className="customer-unavailable-badge">Tạm ngừng bán</span>}</div>
              <button type="button" aria-label={`Xóa ${itemLabel(item)} khỏi giỏ`} onClick={() => removeItem(item.id)} className="customer-remove-item"><Icon name="close" /></button>
            </div>
            <div className="customer-cart-item__controls"><QuantityStepper quantity={item.quantity} size="sm" disabled={item.isAvailable === false} label={`Số lượng ${itemLabel(item)}`} onChange={quantity => updateQty(item.id, quantity - item.quantity)} /><strong>{formatCurrency(item.price * item.quantity)}</strong></div>
          </article>)}
        </div>
        <div className="customer-panel customer-cart-note"><label htmlFor="order-note">Ghi chú cho quán <span>Không bắt buộc</span></label><textarea id="order-note" value={note} onChange={event => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Ví dụ: mang ra cùng lúc, cần thêm khăn giấy…" /><p>{note.length}/500</p></div>
      </fieldset>

      <aside className="customer-panel customer-cart-summary" aria-label="Tổng giỏ hàng">
        <h2>Tóm tắt giỏ hàng</h2>
        <div className="customer-cart-subtotal"><span>Tạm tính · {itemCount} món</span><strong>{formatCurrency(subtotal)}</strong></div>
        <div className="customer-cart-total"><span>Tổng tiền</span><strong>{formatCurrency(total)}</strong></div>
        <div className="customer-table-hint"><Icon name={session ? 'table_restaurant' : 'qr_code_2'} /><div><strong>{session ? session.tableName : 'Chưa xác định bàn'}</strong><p>{session ? 'Đơn sẽ gửi vào phiên phục vụ của bàn này.' : 'Quét mã QR tại bàn để kết nối trước khi đặt món.'}</p></div></div>
        <button type="button" onClick={() => void checkout()} disabled={checkoutDisabled} aria-busy={isSubmitting} className="ui-button ui-button--primary w-full"><span>{isSubmitting ? 'Đang gửi đơn…' : order ? 'Theo dõi đơn hàng' : 'Gửi đơn & thanh toán'}</span><Icon name="arrow_forward" /></button>
        <p className="customer-help-text">{isSubmitting ? 'Vui lòng chờ kết quả gửi đơn.' : 'Sau khi gửi đơn, thanh toán tiền mặt hoặc chuyển khoản với nhân viên.'}</p>
      </aside>
    </div>}
  </div>;
}

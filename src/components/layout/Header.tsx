import Icon from '../ui/Icon';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerCart } from '../../hooks/useCustomerCart';

export default function Header() {
  const { pathname } = useLocation();
  const { itemCount } = useCustomerCart();
  return <header className="customer-header sticky top-0 z-40">
    <div className="customer-header__inner">
      <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="L’Atelier Café · Về thực đơn">
        <span aria-hidden="true" className="icon-slot flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl text-on-primary"><Icon name="coffee" /></span>
        <span><span className="block text-sm font-bold tracking-tight text-primary sm:text-lg">L'Atelier Café</span><span className="mt-0.5 hidden text-[9px] uppercase tracking-[0.15em] text-on-surface-variant sm:block">Coffee &amp; slow moments</span></span>
      </Link>
      <nav aria-label="Điều hướng khách" className="flex items-center gap-2 sm:gap-4">
        <Link to="/" aria-current={pathname === '/' ? 'page' : undefined} className="hidden min-h-control items-center gap-2 px-2 text-sm font-semibold text-primary sm:inline-flex">Thực đơn</Link>
        <Link to="/cart" aria-current={pathname === '/cart' ? 'page' : undefined} aria-label={`Giỏ hàng, ${itemCount} món`} className="ui-button ui-button--primary">
          <span aria-hidden="true" className="icon-slot text-xl"><Icon name="shopping_bag" /></span><span className="hidden sm:inline">Giỏ hàng</span>
          {itemCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-white/15 px-1 text-[10px]">{itemCount}</span>}
        </Link>
      </nav>
    </div>
  </header>;
}

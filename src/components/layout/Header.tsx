import Icon from '../ui/Icon';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerCart } from '../../hooks/useCustomerCart';
import Brand from './Brand';

export default function Header() {
  const { pathname } = useLocation();
  const { itemCount } = useCustomerCart();
  return <header className="customer-header sticky top-0 z-40">
    <a href="#main-content" className="skip-link">Đến nội dung chính</a>
    <div className="customer-header__inner">
      <Link to="/" aria-label="L’Atelier Café · Về thực đơn"><Brand /></Link>
      <nav aria-label="Điều hướng khách" className="flex items-center gap-2 sm:gap-4">
        <Link to="/" aria-current={pathname === '/' ? 'page' : undefined} className="customer-header__link hidden sm:inline-flex">Thực đơn</Link>
        <Link to="/cart" aria-current={pathname === '/cart' ? 'page' : undefined} aria-label={`Giỏ hàng, ${itemCount} món`} className="ui-button ui-button--primary">
          <span aria-hidden="true" className="icon-slot text-xl"><Icon name="shopping_bag" /></span><span className="hidden sm:inline">Giỏ hàng</span>
          {itemCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-white/15 px-1 text-[10px]">{itemCount}</span>}
        </Link>
      </nav>
    </div>
  </header>;
}

import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { CustomerCartProvider } from '../contexts/CustomerCartProvider';
import { useCustomerCart } from '../hooks/useCustomerCart';
import { formatCurrency } from '../utils/format';

function CustomerShell() {
  const { itemCount, total } = useCustomerCart();
  const { pathname } = useLocation();
  const showCartBar = pathname === '/' && itemCount > 0;

  return (
    <div className={`customer-shell min-h-screen min-w-0 flex flex-col selection:bg-secondary-fixed selection:text-primary ${showCartBar ? 'customer-shell--with-cart' : ''}`}>
      <Header />
      <main className="flex-grow min-w-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 md:py-8">
        <Outlet />
      </main>
      <Footer />
      {showCartBar && <nav aria-label="Giỏ hàng đã chọn" className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/30 bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <Link to="/cart" className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-on-primary shadow-lg transition-colors hover:bg-primary-container">
          <span className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="material-symbols-outlined text-2xl">shopping_bag</span>
            <span className="min-w-0"><span className="block text-[11px] text-white/75">{itemCount} món đã chọn</span><strong className="block text-base tabular-nums">{formatCurrency(total)}</strong></span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">Xem giỏ<span aria-hidden="true" className="material-symbols-outlined text-xl">arrow_forward</span></span>
        </Link>
      </nav>}
    </div>
  );
}

function CustomerLayout() {
  return <CustomerCartProvider><CustomerShell /></CustomerCartProvider>;
}

export default CustomerLayout;

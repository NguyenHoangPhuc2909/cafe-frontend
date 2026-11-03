import { Skeleton } from '../components/ui/Skeleton';
import Icon from '../components/ui/Icon';
import { Link, Outlet, useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { CustomerCartProvider } from "../contexts/CustomerCartProvider";
import { useCustomerCart } from "../hooks/useCustomerCart";
import { formatCurrency } from "../utils/format";
import { GuestSessionProvider } from "../contexts/GuestSessionProvider";
import { useGuestSession } from "../hooks/useGuestSession";
import { CheckoutProvider } from "../contexts/CheckoutProvider";
import { useCheckout } from "../hooks/useCheckout";

function CustomerShell() {
  const { itemCount, total } = useCustomerCart();
  const { pathname } = useLocation();
  const {
    session,
    isChecking,
    sessionError,
    attempt,
  } = useGuestSession();
  const showCartBar = pathname === "/" && itemCount > 0;
  const { order } = useCheckout();

  return (
    <div
      className={`customer-shell min-h-screen min-w-0 flex flex-col selection:bg-secondary-fixed selection:text-primary ${showCartBar ? "customer-shell--with-cart" : ""}`}
    >
      <Header />
      <main className={`flex-grow min-w-0 mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 md:py-8 ${pathname === "/" ? "max-w-7xl" : "max-w-[1104px]"}`}>
        <div
          className="customer-session-strip"
          aria-live="polite"
        >
          <p className="flex min-w-0 items-center gap-2.5 break-words text-primary"><span aria-hidden="true" className="icon-slot shrink-0 text-xl text-secondary"><Icon name={session ? "table_restaurant" : "qr_code_2"} /></span><span>
            {isChecking
              ? <span role="status"><span className="sr-only">Đang kiểm tra phiên bàn…</span><Skeleton className="h-4 w-44 max-w-full" /></span>
              : session
                ? `Đặt món tại ${session.tableName}`
                : (sessionError ?? "Quét QR tại bàn để bắt đầu đặt món.")}
          </span></p>
          {attempt && attempt.state !== "success" && pathname !== "/cart" && (
            <Link
              to="/cart"
              className="customer-text-link"
            >
              Xem kết quả gửi đơn
            </Link>
          )}
          {order && pathname !== "/checkout" && (
            <Link
              to="/checkout"
              className="customer-text-link"
            >
              {order.paymentStatus === "PAID"
                ? "Xem đơn đã thanh toán"
                : "Xem trạng thái đơn"}
            </Link>
          )}
        </div>
        <Outlet />
      </main>
      <Footer />
      {showCartBar && (
        <nav
          aria-label="Giỏ hàng đã chọn"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/30 bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
        >
          <Link
            to="/cart"
            className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-on-primary shadow-lg transition-colors hover:bg-primary-container"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="icon-slot text-2xl"
              ><Icon name="shopping_bag" /></span>
              <span className="min-w-0">
                <span className="block text-[11px] text-white/75">
                  {itemCount} món đã chọn
                </span>
                <strong className="block text-base tabular-nums">
                  {formatCurrency(total)}
                </strong>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
              Xem giỏ
              <span
                aria-hidden="true"
                className="icon-slot text-xl"
              ><Icon name="arrow_forward" /></span>
            </span>
          </Link>
        </nav>
      )}
    </div>
  );
}

function CustomerLayout() {
  return (
    <CustomerCartProvider>
      <GuestSessionProvider>
        <CheckoutProvider>
          <CustomerShell />
        </CheckoutProvider>
      </GuestSessionProvider>
    </CustomerCartProvider>
  );
}

export default CustomerLayout;

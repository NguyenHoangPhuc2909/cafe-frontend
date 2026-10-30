import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types/product';
import type { CartItem } from '../types/cart';
import { useCart } from '../hooks/useCart';
import { getPublicMenu } from '../services/products';
import { restoreCustomerCart } from '../utils/cart';
import { subtractSubmittedItems } from '../utils/guest';
import { CustomerCartContext } from './customerCart';

const STORAGE_KEY = 'cafe.customer-cart.v1';
function readStoredCart() {
  try { return restoreCustomerCart(localStorage.getItem(STORAGE_KEY)); }
  catch { return { items: [], note: '' }; }
}

export function CustomerCartProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readStoredCart);
  const cartState = useCart(initial.items);
  const { cart, syncProducts, consumeSubmittedItems } = cartState;
  const [note, setNote] = useState(initial.note);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const reloadMenu = useCallback(() => {
    setIsLoading(true); setMenuError(null); setVersion(current => current + 1);
  }, []);

  const completeSubmittedOrder = useCallback((items: CartItem[], submittedNote: string) => {
    // Persist immediately: the response may arrive after navigating away from CustomerLayout.
    try {
      const stored = readStoredCart();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: subtractSubmittedItems(stored.items, items),
        note: stored.note === submittedNote ? '' : stored.note,
      }));
    } catch { /* In-memory completion still works when local storage is unavailable. */ }
    consumeSubmittedItems(items);
    setNote(current => current === submittedNote ? '' : current);
  }, [consumeSubmittedItems]);

  useEffect(() => {
    const controller = new AbortController();
    getPublicMenu(controller.signal).then(menu => {
      if (controller.signal.aborted) return;
      setProducts(menu); syncProducts(menu);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setMenuError('Chưa tải được thực đơn. Bạn vui lòng thử lại sau ít phút.');
      }
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [version, syncProducts]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: cart, note })); }
    catch { /* Keep the in-memory cart usable if storage is unavailable. */ }
  }, [cart, note]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') reloadMenu(); };
    window.addEventListener('focus', reloadMenu);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', reloadMenu);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reloadMenu]);

  return <CustomerCartContext.Provider value={{
    ...cartState, products, isLoading, menuError, reloadMenu, note, setNote, completeSubmittedOrder,
  }}>{children}</CustomerCartContext.Provider>;
}

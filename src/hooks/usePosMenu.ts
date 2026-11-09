import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '../types/product';
import { getStaffProducts, updateProductActive } from '../services/staffProducts';
import { staffErrorMessage } from '../services/staffApi';

export function usePosMenu(token: string | undefined, onLoaded: (products: Product[]) => void) {
  const [products, setProducts] = useState<Product[]>([]);
  const menuRef = useRef<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState<Product['id'] | null>(null);
  const mutation = useRef<AbortController | null>(null);
  const queuedReload = useRef(false);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => {
    // A focus refresh must not race the PATCH and restore an older state.
    if (mutation.current) { queuedReload.current = true; return; }
    loadingRef.current = true;
    setIsLoading(true); setError(null); setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (!token) return () => controller.abort();
    getStaffProducts(token, controller.signal).then(menu => {
      if (controller.signal.aborted) return;
      menuRef.current = menu;
      setProducts(menu);
      onLoaded(menu);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(staffErrorMessage(cause));
    }).finally(() => {
      if (!controller.signal.aborted) { loadingRef.current = false; setIsLoading(false); }
    });
    return () => controller.abort();
  }, [token, version, onLoaded]);

  useEffect(() => () => {
    mutation.current?.abort();
    mutation.current = null;
    queuedReload.current = false;
  }, [token]);

  const setProductActive = async (product: Product, active: boolean) => {
    if (!token || loadingRef.current || mutation.current || error) return;
    const controller = new AbortController();
    mutation.current = controller;
    setUpdatingId(product.id); setUpdateError(null); setNotice('');
    try {
      const updated = await updateProductActive(token, product.id, active, controller.signal);
      if (controller.signal.aborted) return;
      const next = menuRef.current.map(item => String(item.id) === String(updated.id) ? updated : item);
      menuRef.current = next;
      setProducts(next);
      onLoaded(next);
      setNotice(`${updated.name}: ${updated.isActive ? 'đã bật bán' : 'đã ngừng bán'}.`);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setUpdateError(`Không thể cập nhật ${product.name}. ${staffErrorMessage(cause)}`);
        // The response may have been lost after BE saved the change.
        queuedReload.current = true;
      }
    } finally {
      if (mutation.current === controller) {
        mutation.current = null;
        setUpdatingId(null);
        if (queuedReload.current) { queuedReload.current = false; reload(); }
      }
    }
  };

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  return { products, isLoading, error, setProductActive, updatingId, updateError, notice };
}

import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../types/product';
import { getPublicMenu } from '../services/products';

export function usePosMenu(onLoaded: (products: Product[]) => void) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => {
    setIsLoading(true); setError(null); setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getPublicMenu(controller.signal).then(menu => {
      if (controller.signal.aborted) return;
      const active = menu.filter(product => product.isActive !== false);
      setProducts(active);
      onLoaded(active);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Chưa tải được thực đơn của quán. Vui lòng kiểm tra BE và thử lại.');
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [version, onLoaded]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  return { products, isLoading, error, reload };
}

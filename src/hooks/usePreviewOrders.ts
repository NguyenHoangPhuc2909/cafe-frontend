import { useEffect, useSyncExternalStore } from 'react';
import { previewSnapshot, subscribePreview, tickPreviews } from '../services/previewOrders';

export function usePreviewOrders() {
  const orders = useSyncExternalStore(subscribePreview, previewSnapshot, previewSnapshot);
  useEffect(() => {
    tickPreviews();
    const timer = window.setInterval(tickPreviews, 1000);
    window.addEventListener('focus', tickPreviews);
    document.addEventListener('visibilitychange', tickPreviews);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tickPreviews);
      document.removeEventListener('visibilitychange', tickPreviews);
    };
  }, []);
  return orders;
}

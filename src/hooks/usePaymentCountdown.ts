import { useEffect, useState } from 'react';

export function usePaymentCountdown(expiresAt: number | undefined) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const remainingSeconds =
    expiresAt !== undefined && Number.isFinite(expiresAt)
      ? Math.max(0, Math.ceil((expiresAt - now) / 1000))
      : 0;

  const countdown =
    `${Math.floor(remainingSeconds / 60)}:`
    + String(remainingSeconds % 60).padStart(2, '0');

  return { countdown, remainingSeconds };
}
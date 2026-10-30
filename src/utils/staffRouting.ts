export function staffReturnPath(value: unknown): string {
  const fallback = '/staff/orders';
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')
    || /[\\\p{Cc}]/u.test(value)) return fallback;
  try {
    const url = new URL(value, 'https://staff.local');
    const decodedPath = decodeURIComponent(url.pathname).replace(/\/+$/, '');
    if (url.origin !== 'https://staff.local' || !(url.pathname === '/staff' || url.pathname.startsWith('/staff/'))
      || decodedPath.toLowerCase() === '/staff/login') return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}

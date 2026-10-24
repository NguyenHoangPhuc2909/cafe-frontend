import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { OrderAttempt, TableAccess, TableSessionResponse } from '../types/guest';
import { buildGuestOrder, restoreOrderAttempt, restoreTableAccess } from '../utils/guest';
import { createGuestOrder, getGuestSession, grantTableAccess, guestErrorMessage, isOrderDefinitelyRejected, isSessionRejected, isTokenRejected } from '../services/guest';
import { useCustomerCart } from '../hooks/useCustomerCart';
import { GuestSessionContext } from './guestSession';

const ACCESS_KEY = 'cafe.guest-access.v1';
const ATTEMPT_KEY = 'cafe.guest-order-attempt.v1';
function readStorage(key: string) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const { cart, note, setNote, clearCart, completeSubmittedOrder, isLoading, menuError, reloadMenu } = useCustomerCart();
  const [access, setAccess] = useState(() => restoreTableAccess(readStorage(ACCESS_KEY)));
  const accessRef = useRef(access);
  const [session, setSession] = useState<TableSessionResponse | null>(null);
  const [isChecking, setIsChecking] = useState(!!access);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(() => restoreOrderAttempt(readStorage(ATTEMPT_KEY)));
  const attemptRef = useRef(attempt);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const busy = useRef(false);
  const connecting = useRef(false);
  const refreshVersion = useRef(0);

  const saveAccess = useCallback((next: TableAccess | null) => {
    accessRef.current = next;
    setAccess(next);
    try {
      if (next) sessionStorage.setItem(ACCESS_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(ACCESS_KEY);
    } catch { /* The current tab can still use the in-memory access. */ }
  }, []);

  const saveAttempt = useCallback((next: OrderAttempt | null, requireStorage = false) => {
    try {
      if (next) sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(ATTEMPT_KEY);
    } catch (cause) {
      if (requireStorage) throw new Error('Trình duyệt chưa cho phép lưu phiên. Vui lòng bật lưu trữ để gửi đơn an toàn.', { cause });
    }
    attemptRef.current = next;
    setAttempt(next);
  }, []);

  const refreshSession = useCallback(async () => {
    const current = accessRef.current;
    if (!current || connecting.current) return;
    const version = ++refreshVersion.current;
    setIsChecking(true);
    try {
      const verified = await getGuestSession(current);
      if (accessRef.current !== current || version !== refreshVersion.current) return;
      setSession(verified);
      setSessionError(null);
    } catch (error) {
      if (accessRef.current !== current || version !== refreshVersion.current) return;
      setSession(null);
      setSessionError(isSessionRejected(error) ? `${guestErrorMessage(error)}. Vui lòng quét lại QR tại bàn.` : guestErrorMessage(error));
      if (isSessionRejected(error)) saveAccess(null);
    } finally {
      if (version === refreshVersion.current) setIsChecking(false);
    }
  }, [saveAccess]);

  useEffect(() => {
    const versionRef = refreshVersion;
    void refreshSession();
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshSession(); };
    const onFocus = () => { void refreshSession(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      ++versionRef.current;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshSession]);

  const connectTable = async (qrCode: string) => {
    if (connecting.current || busy.current) return;
    if (attemptRef.current) throw new Error('Vui lòng xử lý kết quả đơn trong giỏ trước khi chọn lại bàn.');
    connecting.current = true;
    ++refreshVersion.current;
    setIsChecking(true);
    setSessionError(null);
    try {
      const next = await grantTableAccess(qrCode);
      const verified = await getGuestSession(next);
      const previous = accessRef.current;
      if (previous && previous.sessionId !== next.sessionId) { clearCart(); setNote(''); }
      saveAccess(next);
      setSession(verified);
      setOrderError(null);
    } catch (error) {
      const message = guestErrorMessage(error);
      setSessionError(message);
      throw new Error(message, { cause: error });
    } finally {
      connecting.current = false;
      setIsChecking(false);
    }
  };

  const submitOrder = async () => {
    if (busy.current || connecting.current || attemptRef.current) return;
    setOrderError(null);
    const current = accessRef.current;
    if (!current) { setOrderError('Vui lòng quét QR tại bàn trước khi gửi đơn.'); return; }
    if (isLoading || menuError) { setOrderError('Vui lòng tải lại thực đơn trước khi gửi đơn.'); return; }
    busy.current = true;
    setIsSubmitting(true);
    let sent = false;
    let pending: OrderAttempt | null = null;
    try {
      const payload = buildGuestOrder(cart, note);
      // Always verify with BE, including after the tab has been idle or the token has expired.
      const verified = await getGuestSession(current);
      setSession(verified);
      setSessionError(null);
      pending = { state: 'sending', tableName: verified.tableName, sessionId: verified.id, startedAt: new Date().toISOString() };
      saveAttempt(pending, true);
      sent = true;
      const order = await createGuestOrder(current, payload);
      completeSubmittedOrder(cart, note);
      saveAttempt({ ...pending, state: 'success', order });
      reloadMenu();
    } catch (error) {
      if (sent && pending && !isOrderDefinitelyRejected(error)) {
        saveAttempt({ ...pending, state: 'unknown' });
      } else {
        if (sent) saveAttempt(null);
        setOrderError(guestErrorMessage(error));
        if (sent) { reloadMenu(); void refreshSession(); }
      }
      // Only session validation failures and a rejected token invalidate the session.
      if ((!sent && isSessionRejected(error)) || (sent && isTokenRejected(error))) {
        saveAccess(null); setSession(null); setSessionError('Phiên bàn không còn hợp lệ. Vui lòng quét lại QR tại bàn.');
      }
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  };

  const dismissAttempt = () => {
    if (busy.current || attemptRef.current?.state !== 'success') return;
    saveAttempt(null);
    setOrderError(null);
  };

  const resolveUnknownOrder = (wasCreated: boolean) => {
    if (busy.current || attemptRef.current?.state !== 'unknown') return;
    if (wasCreated) { clearCart(); setNote(''); }
    // If clearing storage fails, keep the unresolved attempt locked after reload.
    try { saveAttempt(null, true); setOrderError(null); }
    catch (error) { setOrderError(guestErrorMessage(error)); }
  };

  return <GuestSessionContext.Provider value={{ session, isChecking, sessionError, canRefreshSession: !!access, refreshSession,
    connectTable, attempt, isSubmitting, orderError, submitOrder, dismissAttempt, resolveUnknownOrder }}>{children}</GuestSessionContext.Provider>;
}

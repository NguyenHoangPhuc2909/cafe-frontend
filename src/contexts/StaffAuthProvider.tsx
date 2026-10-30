import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { restoreStaffSession } from '../utils/staffTables';
import { getStaffTables, isCurrentStaffAuthFailure, isStaffAccessError, signInStaff, staffErrorMessage } from '../services/staffApi';
import { http } from '../services/http';
import { StaffAuthContext } from './staffAuth';

const KEY = 'cafe.staff-session.v1';
function readSession() {
  try { return restoreStaffSession(sessionStorage.getItem(KEY)); } catch { return null; }
}

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readSession);
  const sessionRef = useRef(session);
  const signingIn = useRef(false);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [verificationVersion, setVerificationVersion] = useState(0);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearSession = useCallback((message: string | null = null) => {
    try { sessionStorage.removeItem(KEY); } catch { /* Clear memory even when storage is unavailable. */ }
    sessionRef.current = null;
    setSession(null); setVerifiedToken(null); setVerificationError(null); setError(message);
  }, []);
  const signOut = useCallback(() => clearSession(), [clearSession]);
  const retryVerification = useCallback(() => {
    setVerificationError(null);
    setVerificationVersion(version => version + 1);
  }, []);

  const signIn = async (username: string, password: string) => {
    if (signingIn.current) return false;
    signingIn.current = true;
    setIsSigningIn(true); setError(null);
    try {
      const next = await signInStaff(username, password);
      try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Allow this session in memory. */ }
      sessionRef.current = next;
      setVerifiedToken(null); setVerificationError(null); setSession(next);
      return true;
    } catch (cause) { setError(staffErrorMessage(cause)); return false; }
    finally { signingIn.current = false; setIsSigningIn(false); }
  };

  // Confirm a stored token with BE before exposing any Staff page.
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const token = session.accessToken;
    getStaffTables(token, controller.signal).then(() => {
      if (controller.signal.aborted || sessionRef.current?.accessToken !== token) return;
      setVerifiedToken(token); setVerificationError(null);
    }).catch(cause => {
      if (controller.signal.aborted || sessionRef.current?.accessToken !== token) return;
      if (isStaffAccessError(cause)) clearSession(staffErrorMessage(cause));
      else setVerificationError(staffErrorMessage(cause));
    });
    return () => controller.abort();
  }, [session, verificationVersion, clearSession]);

  // Ignore auth failures from public requests and requests using an old account token.
  useEffect(() => {
    if (!session) return;
    const token = session.accessToken;
    const interceptor = http.interceptors.response.use(response => response, cause => {
      if (sessionRef.current?.accessToken === token && isCurrentStaffAuthFailure(cause, token)) {
        clearSession(staffErrorMessage(cause));
      }
      return Promise.reject(cause);
    });
    return () => http.interceptors.response.eject(interceptor);
  }, [session, clearSession]);

  // Recheck when returning to the tab. Network outages do not unmount an active POS.
  useEffect(() => {
    if (!session) return;
    const recheck = () => { if (document.visibilityState === 'visible') retryVerification(); };
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    const timer = window.setInterval(recheck, 60_000);
    return () => {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
      window.clearInterval(timer);
    };
  }, [session, retryVerification]);

  return <StaffAuthContext.Provider value={{ session, signIn, signOut, isSigningIn, error,
    isAuthenticated: !!session && verifiedToken === session.accessToken, verificationError, retryVerification,
  }}>{children}</StaffAuthContext.Provider>;
}

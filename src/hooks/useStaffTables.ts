import { useCallback, useEffect, useState } from 'react';
import type { StaffSession, StaffTableOverview } from '../types/staffApi';
import { getStaffTableOverview, isStaffAccessError, staffErrorMessage } from '../services/staffApi';

export function useStaffTables(session: StaffSession | null) {
  const [result, setResult] = useState<{ token: string | null; rows: StaffTableOverview[]; error: string | null; denied: boolean }>({ token: null, rows: [], error: null, denied: false });
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => { setLoading(true); setVersion(value => value + 1); }, []);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    getStaffTableOverview(session.accessToken, controller.signal).then(rows => {
      if (!controller.signal.aborted) setResult({ token: session.accessToken, rows, error: null, denied: false });
    }).catch(cause => {
      if (!controller.signal.aborted) setResult({ token: session.accessToken, rows: [], error: staffErrorMessage(cause), denied: isStaffAccessError(cause) });
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session, version]);

  useEffect(() => {
    if (!session) return;
    const visible = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('focus', reload); document.removeEventListener('visibilitychange', visible); };
  }, [session, reload]);

  const belongsToSession = !!session && result.token === session.accessToken;
  return { rows: belongsToSession ? result.rows : [], error: belongsToSession ? result.error : null,
    accessDenied: belongsToSession && result.denied, isLoading: !!session && (loading || !belongsToSession), reload };
}

import { useRef, useState } from 'react';
import axios from 'axios';
import { staffErrorMessage } from '../services/staffApi';
import { clearCashPending, readCashPending, writeCashPending } from '../utils/cash';

export function useCashSubmission<T extends { requestId: string; businessDate: string }, R>(
  username: string, operation: string, send: (request: T) => Promise<R>,
) {
  const [restored] = useState(() => {
    try { return { request: readCashPending<T>(username, operation), error: '' }; }
    catch { return { request: null, error: 'Chưa đọc được yêu cầu tiền mặt đang chờ. Kiểm tra bộ nhớ trình duyệt trước khi tiếp tục.' }; }
  });
  const [pending, setPending] = useState<T | null>(restored.request);
  const [error, setError] = useState(restored.error);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const submit = async (makeRequest: () => T): Promise<R | null> => {
    if (busyRef.current || restored.error) return null;
    busyRef.current = true; setBusy(true); setError('');
    let request: T | null = null;
    try {
      request = pending ?? readCashPending<T>(username, operation) ?? makeRequest();
      // Persist the exact request before POST so retries also survive a reload or date change.
      writeCashPending(username, operation, request);
      setPending(request);
      const result = await send(request);
      clearCashPending(username, operation); setPending(null);
      return result;
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      if (request && [400, 404, 409, 422].includes(status ?? 0)) {
        try { clearCashPending(username, operation); setPending(null); }
        catch { setError('Chưa xóa được yêu cầu đã bị từ chối. Kiểm tra bộ nhớ trình duyệt rồi gửi lại.'); return null; }
      }
      setError(staffErrorMessage(cause));
      return null;
    } finally { busyRef.current = false; setBusy(false); }
  };
  return { pending, error, busy, blocked: !!restored.error, submit };
}

import { useCallback, useEffect, useState } from "react";
import type { PageResponse } from "../types/api";
import type { OrderResponse } from "../types/order";
import type { StaffOrderQuery, StaffSession } from "../types/staffApi";
import { getStaffOrders, staffErrorMessage } from "../services/staffApi";

interface Result {
  token: string | null;
  key: string;
  filterKey: string;
  data: PageResponse<OrderResponse> | null;
  error: string | null;
}

export function useStaffOrders(
  session: StaffSession | null,
  query: StaffOrderQuery = {},
) {
  const { status, paymentStatus, sessionId, page = 0, size = 20 } = query;

  const token = session?.accessToken ?? null;
  const filterKey = JSON.stringify([status ?? null, paymentStatus ?? null, sessionId ?? null, size]);
  const queryKey = JSON.stringify([
    status ?? null,
    paymentStatus ?? null,
    sessionId ?? null,
    page,
    size,
  ]);

  const [result, setResult] = useState<Result>({
    token: null,
    key: "",
    filterKey: "",
    data: null,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    let active = true;
    let timer: number | undefined;

    const load = async () => {
      try {
        const data = await getStaffOrders(
          token,
          { status, paymentStatus, sessionId, page, size },
          controller.signal,
        );

        if (!active) return;

        setResult({
          token,
          key: queryKey,
          filterKey,
          data,
          error: null,
        });
      } catch (cause) {
        if (active && !controller.signal.aborted) {
          setResult({
            token,
            key: queryKey,
            filterKey,
            data: null,
            error: staffErrorMessage(cause),
          });
        }
      } finally {
        if (active) {
          setLoading(false);
          timer = window.setTimeout(() => void load(), 5000);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [token, status, paymentStatus, sessionId, page, size, queryKey, filterKey, version]);

  const matches = !!token && result.token === token && result.key === queryKey;

  return {
    data: matches ? result.data : null,
    pagination: !!token && result.token === token && result.filterKey === filterKey && result.data
      ? { totalPages: result.data.totalPages, totalElements: result.data.totalElements }
      : null,
    error: matches ? result.error : null,
    isLoading: !!token && (loading || !matches),
    reload,
  };
}

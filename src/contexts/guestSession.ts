import { createContext } from "react";
import type { PageResponse } from '../types/api';
import type {
  OrderAttempt,
  TableSessionResponse,
  GuestOrderResponse,
} from "../types/guest";

export interface GuestSessionValue {
  session: TableSessionResponse | null;
  isChecking: boolean;
  sessionError: string | null;
  connectTable: (qrCode: string) => Promise<void>;
  attempt: OrderAttempt | null;
  isSubmitting: boolean;
  orderError: string | null;
  readOrder: (
    orderId: number,
    signal?: AbortSignal,
  ) => Promise<GuestOrderResponse>;
  submitOrder: () => Promise<GuestOrderResponse | null>;
  readOrders: (page: number, signal?: AbortSignal) => Promise<PageResponse<GuestOrderResponse>>;
  dismissAttempt: () => boolean;
  resolveUnknownOrder: (wasCreated: boolean) => void;
}

export const GuestSessionContext = createContext<GuestSessionValue | null>(
  null,
);

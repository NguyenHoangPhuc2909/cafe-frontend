import { createContext } from 'react';
import type { OrderAttempt, TableSessionResponse } from '../types/guest';

export interface GuestSessionValue {
  session: TableSessionResponse | null;
  isChecking: boolean;
  sessionError: string | null;
  canRefreshSession: boolean;
  refreshSession: () => Promise<void>;
  connectTable: (qrCode: string) => Promise<void>;
  attempt: OrderAttempt | null;
  isSubmitting: boolean;
  orderError: string | null;
  submitOrder: () => Promise<void>;
  dismissAttempt: () => void;
  resolveUnknownOrder: (wasCreated: boolean) => void;
}

export const GuestSessionContext = createContext<GuestSessionValue | null>(null);

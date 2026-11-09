import { createContext } from "react";
import type { GuestOrderResponse } from "../types/guest";

export interface CheckoutValue {
  order: GuestOrderResponse | null;
  orders: GuestOrderResponse[];
  page: number;
  totalPages: number;
  isLoadingOrders: boolean;
  selectOrder: (id: number) => void;
  setPage: (page: number) => void;
  reloadOrders: () => void;
  startCheckout: () => Promise<boolean>;
  startNewOrder: () => boolean;
  error: string | null;
}

export const CheckoutContext = createContext<CheckoutValue | null>(null);

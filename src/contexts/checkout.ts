import { createContext } from "react";
import type { GuestOrderResponse } from "../types/guest";

export interface CheckoutValue {
  order: GuestOrderResponse | null;
  startCheckout: () => Promise<boolean>;
  refreshOrder: () => void;
  startNewOrder: () => boolean;
  error: string | null;
}

export const CheckoutContext = createContext<CheckoutValue | null>(null);

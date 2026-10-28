import { createContext } from 'react';
import type { CheckoutEvent, CheckoutOrder } from '../utils/checkout';

export interface CheckoutValue {
  order: CheckoutOrder | null;
  startCheckout: () => boolean;
  dispatch: (event: CheckoutEvent) => void;
  returnToCart: () => Promise<boolean>;
  finishOrder: () => void;
  error: string | null;
}

export const CheckoutContext = createContext<CheckoutValue | null>(null);

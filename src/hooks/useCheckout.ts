import { useContext } from 'react';
import { CheckoutContext } from '../contexts/checkout';

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error('CheckoutProvider is missing');
  return context;
}

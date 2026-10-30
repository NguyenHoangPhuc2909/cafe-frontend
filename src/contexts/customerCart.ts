import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Product } from '../types/product';
import type { CartItem } from '../types/cart';
import type { useCart } from '../hooks/useCart';

export interface CustomerCartValue extends ReturnType<typeof useCart> {
  products: Product[];
  isLoading: boolean;
  menuError: string | null;
  reloadMenu: () => void;
  note: string;
  setNote: Dispatch<SetStateAction<string>>;
  completeSubmittedOrder: (items: CartItem[], submittedNote: string) => void;
}

export const CustomerCartContext = createContext<CustomerCartValue | null>(null);

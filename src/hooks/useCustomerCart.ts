import { useContext } from 'react';
import { CustomerCartContext } from '../contexts/customerCart';

export function useCustomerCart() {
  const context = useContext(CustomerCartContext);
  if (!context) throw new Error('useCustomerCart requires CustomerCartProvider');
  return context;
}

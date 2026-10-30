import type { Product } from './product';

export interface CartItem {
  id: string;
  productId: Product['id'];
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category?: string;
  options?: string;
  note?: string;
  isAvailable?: boolean;
}

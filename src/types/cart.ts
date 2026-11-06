import type { Product } from './product';
import type { DrinkSize } from './productSize';
import type { DrinkCustomization } from './drinkOptions';

export interface CartItem extends DrinkCustomization {
  id: string;
  productId: Product['id'];
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category?: string;
  size?: DrinkSize;
  isAvailable?: boolean;
}

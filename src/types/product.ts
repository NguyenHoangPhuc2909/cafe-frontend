import type { ProductSizeOption } from './productSize';

export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  categoryId?: number | null;
  isActive?: boolean;
  sizes?: ProductSizeOption[];
  origin?: string;
  badge?: 'Mới' | 'Best Seller' | 'Signature' | 'Đặc sản' | 'Cổ điển' | null;
}

export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  categoryId?: number | null;
  isActive?: boolean;
  origin?: string;
  options?: string;
  badge?: 'Mới' | 'Best Seller' | 'Signature' | 'Đặc sản' | 'Cổ điển' | null;
}

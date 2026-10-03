export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  origin?: string;
  badge?: 'Mới' | 'Best Seller' | 'Signature' | 'Đặc sản' | 'Cổ điển' | null;
}
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ProductResponse {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: number | null;
  categoryName: string | null;
}

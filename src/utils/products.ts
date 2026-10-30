import type { Product } from '../types/product';
import type { ProductResponse } from '../types/api';

export const PRODUCT_PLACEHOLDER = '/images/product-placeholder.svg';

export function toProduct(dto: ProductResponse): Product {
  if (!Number.isSafeInteger(dto.id) || dto.id <= 0
    || typeof dto.name !== 'string' || !dto.name.trim()
    || !Number.isFinite(dto.price) || dto.price < 0) {
    throw new Error('Dữ liệu thực đơn chưa hợp lệ. Vui lòng thử lại sau.');
  }
  return {
    id: dto.id, name: dto.name.trim(), price: dto.price,
    description: dto.description ?? '',
    imageUrl: dto.imageUrl?.trim() || PRODUCT_PLACEHOLDER,
    category: dto.categoryName?.trim() || 'Danh mục khác',
    categoryId: dto.categoryId, isActive: dto.isActive,
  };
}

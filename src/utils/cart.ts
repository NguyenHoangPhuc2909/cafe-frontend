import type { CartItem } from '../types/cart';
import type { Product } from '../types/product';
import type { DrinkSize } from '../types/productSize';
import type { DrinkCustomization } from '../types/drinkOptions';
import { drinkOptionsKey, isDrinkOptionLevel, normalizeDrinkOptions } from './drinkOptions.ts';

export const MAX_CART_QUANTITY = 99;

export function addCartItem(items: CartItem[], product: Product, quantity = 1, requestedSize?: DrinkSize, customization: DrinkCustomization = {}): CartItem[] {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return items;
  if (!isDrinkOptionLevel(customization.iceLevel) || !isDrinkOptionLevel(customization.sweetnessLevel)) return items;
  const drinkOptions = normalizeDrinkOptions(customization);
  if (drinkOptionsKey(drinkOptions) && !product.sizes?.length) return items;
  const size = requestedSize ?? product.sizes?.find(option => option.size === 'M')?.size;
  const sizeOption = product.sizes?.find(option => option.size === size);
  if (size && !sizeOption) return items;
  const price = sizeOption?.price ?? product.price;
  const id = `${product.id}${size === 'L' ? ':size=L' : ''}${drinkOptionsKey(drinkOptions)}`;
  const existing = items.find(item => item.id === id);
  if (existing) return items.map(item => item.id === id
    ? { ...item, size, price, quantity: Math.min(MAX_CART_QUANTITY, item.quantity + quantity) } : item);
  return [...items, {
    id, productId: product.id, name: product.name, price, size, ...drinkOptions,
    imageUrl: product.imageUrl, category: product.category,
    quantity: Math.min(MAX_CART_QUANTITY, quantity),
    isAvailable: true,
  }];
}

export function changeCartQuantity(items: CartItem[], id: string, delta: number): CartItem[] {
  if (!Number.isSafeInteger(delta)) return items;
  return items.map(item => item.id === id
    ? { ...item, quantity: Math.min(MAX_CART_QUANTITY, item.quantity + delta) }
    : item).filter(item => item.quantity > 0);
}

export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, total: subtotal, itemCount };
}

export function reconcileCart(items: CartItem[], products: Product[]): CartItem[] {
  const menu = new Map(products.map(product => [String(product.id), product]));
  return items.map(item => {
    const product = menu.get(String(item.productId));
    const size = item.size ?? product?.sizes?.find(option => option.size === 'M')?.size;
    const sizeOption = product?.sizes?.find(option => option.size === size);
    return product ? {
      ...item, size, name: product.name, price: sizeOption?.price ?? (size ? item.price : product.price), imageUrl: product.imageUrl,
      category: product.category, isAvailable: product.isActive !== false && (!size || !!sizeOption) && (!drinkOptionsKey(item) || !!product.sizes?.length),
    } : { ...item, isAvailable: false };
  });
}

export function restoreCustomerCart(raw: string | null): { items: CartItem[]; note: string } {
  try {
    const parsed: unknown = JSON.parse(raw ?? 'null');
    if (!parsed || typeof parsed !== 'object' || !('items' in parsed)
      || !Array.isArray(parsed.items)) return { items: [], note: '' };
    const items: CartItem[] = [];
    for (const candidate of parsed.items) {
      if (!candidate || typeof candidate !== 'object'
        || !Number.isSafeInteger(candidate.productId) || candidate.productId <= 0
        || typeof candidate.name !== 'string'
        || !Number.isFinite(candidate.price) || candidate.price < 0
        || !Number.isSafeInteger(candidate.quantity) || candidate.quantity < 1) continue;
      if (candidate.size != null && candidate.size !== 'M' && candidate.size !== 'L') continue;
      const size: DrinkSize | undefined = candidate.size ?? undefined;
      if (!isDrinkOptionLevel(candidate.iceLevel) || !isDrinkOptionLevel(candidate.sweetnessLevel)) continue;
      const customization = normalizeDrinkOptions(candidate);
      const id = `${candidate.productId}${size === 'L' ? ':size=L' : ''}${drinkOptionsKey(customization)}`;
      if (items.some(item => item.id === id)) continue;
      items.push({
        id, productId: candidate.productId, size, ...customization,
        name: candidate.name, price: candidate.price,
        quantity: Math.min(MAX_CART_QUANTITY, candidate.quantity),
        imageUrl: typeof candidate.imageUrl === 'string' ? candidate.imageUrl : undefined,
        category: typeof candidate.category === 'string' ? candidate.category : undefined,
      });
    }
    const note = 'note' in parsed && typeof parsed.note === 'string' ? parsed.note : '';
    return { items, note };
  } catch { return { items: [], note: '' }; }
}

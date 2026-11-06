import { useState, useCallback } from 'react';
import type { CartItem } from '../types/cart';
import type { Product } from '../types/product';
import type { DrinkSize } from '../types/productSize';
import type { DrinkCustomization } from '../types/drinkOptions';
import { addCartItem, changeCartQuantity, cartTotals, reconcileCart } from '../utils/cart';
import { subtractSubmittedItems } from '../utils/guest';

export const useCart = (initialItems: CartItem[] = []) => {
  const [cart, setCart] = useState<CartItem[]>(initialItems);

  /** Quick-add: increment if same id already in cart (no options) */
  const addItem = useCallback((product: Product) => {
    setCart(prev => addCartItem(prev, product));
  }, []);

  /** Add with customization options & qty (from modal) */
  const addItemWithOptions = useCallback((product: Product, qty = 1, size?: DrinkSize, customization?: DrinkCustomization) => {
    setCart(prev => addCartItem(prev, product, qty, size, customization));
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => changeCartQuantity(prev, id, delta));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const consumeSubmittedItems = useCallback((items: CartItem[]) => {
    setCart(current => subtractSubmittedItems(current, items));
  }, []);

  const syncProducts = useCallback((products: Product[]) => {
    setCart(prev => reconcileCart(prev, products));
  }, []);

  return { cart, addItem, addItemWithOptions, updateQty, removeItem, clearCart, consumeSubmittedItems, syncProducts, ...cartTotals(cart) };
};

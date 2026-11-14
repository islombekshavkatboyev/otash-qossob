'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { CartItem, Product } from '../data/products';
import { calcItemPrice } from '../lib/storage';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, weightG: number) => void;
  removeItem: (productId: string) => void;
  updateWeight: (productId: string, weightG: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product: Product, weightG: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        // mavjud bo'lsa — vaznni qo'shamiz
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, weightG: i.weightG + weightG }
            : i
        );
      }
      return [...prev, { product, weightG }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateWeight = useCallback((productId: string, weightG: number) => {
    if (weightG <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId ? { ...i, weightG } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart  = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = useMemo(
    () => items.reduce((acc, i) => acc + i.weightG, 0),
    [items]
  );

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (acc, i) => acc + calcItemPrice(i.product.price, i.weightG),
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateWeight,
        clearCart,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}


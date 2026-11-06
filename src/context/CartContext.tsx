import React, { createContext, useContext, useState } from 'react';
import { CartItem, Product, PromoCode } from '../types';
import { PROMO_CODES } from '../database/seedData';
import { formatNaira } from '../utils/currency';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  appliedPromo: PromoCode | null;
  applyPromo: (code: string) => { success: boolean; message: string };
  removePromo: () => void;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([
    // Initial sample cart item for preview
    {
      id: 'cart_init_1',
      product: {
        id: 'prod_1',
        title: 'Sony WH-1000XM5 Wireless Headphones',
        category: 'Audio & Gear',
        categoryId: 'cat_audio',
        price: 349.99,
        originalPrice: 399.99,
        rating: 4.8,
        reviewsCount: 1240,
        description: 'Industry-leading noise cancellation.',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        stock: 25,
        brand: 'Sony',
      },
      quantity: 1,
    }
  ]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const addToCart = (product: Product, quantity: number = 1, selectedColor?: string, selectedSize?: string) => {
    setItems(currentItems => {
      const existingIndex = currentItems.findIndex(i => i.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...currentItems];
        const newQty = next[existingIndex].quantity + quantity;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: Math.min(newQty, product.stock),
        };
        return next;
      }
      return [
        ...currentItems,
        {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          product,
          quantity: Math.min(quantity, product.stock),
          selectedColor,
          selectedSize,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(current => current.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(current =>
      current.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: Math.min(quantity, item.product.stock),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromo(null);
  };

  const applyPromo = (code: string) => {
    const clean = code.trim().toUpperCase();
    const promo = PROMO_CODES.find(p => p.code === clean);
    if (!promo) {
      return { success: false, message: 'Invalid promo code.' };
    }
    const currentSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    if (promo.minOrder && currentSubtotal < promo.minOrder) {
      return {
        success: false,
        message: `This coupon requires a minimum spend of ${formatNaira(promo.minOrder)}.`,
      };
    }
    setAppliedPromo(promo);
    return { success: true, message: `Promo code ${promo.code} applied! (-${promo.discountPercentage}%)` };
  };

  const removePromo = () => {
    setAppliedPromo(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= 100000 || items.length === 0 ? 0 : 3500;
  const discount = appliedPromo ? (subtotal * appliedPromo.discountPercentage) / 100 : 0;
  const total = Math.max(0, subtotal - discount + (items.length > 0 ? shippingFee : 0));
  const totalCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedPromo,
        applyPromo,
        removePromo,
        subtotal,
        shippingFee,
        discount,
        total,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}


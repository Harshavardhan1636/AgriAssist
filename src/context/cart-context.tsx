'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { StoreProduct } from '@/lib/types';

export interface CartItem extends StoreProduct {
    quantity: number;
}

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: StoreProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  // Simulation functions
  simulatePurchase: () => Promise<{ success: boolean; orderId: string; message: string }>;
  isPurchasing: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('agriassist_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agriassist_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product: StoreProduct) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      return prevCart.filter((item) => item.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart((prevCart) => {
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Simulate a purchase process
  const simulatePurchase = async (): Promise<{ success: boolean; orderId: string; message: string }> => {
    setIsPurchasing(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate 90% success rate
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const total = getCartTotal();
        
        // Clear cart after successful purchase
        clearCart();
        
        return {
          success: true,
          orderId,
          message: `Order ${orderId} successfully placed! Total amount: ₹${total}. Your products will be delivered within 3-5 business days.`
        };
      } else {
        return {
          success: false,
          orderId: '',
          message: 'Sorry, there was an issue processing your order. Please try again.'
        };
      }
    } catch (error) {
      return {
        success: false,
        orderId: '',
        message: 'An unexpected error occurred. Please try again later.'
      };
    } finally {
      setIsPurchasing(false);
    }
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    simulatePurchase,
    isPurchasing
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
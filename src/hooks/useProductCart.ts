'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, AddOn, TimeSlot } from '@/types/products';
import { calculateTotalPrice } from '@/lib/productUtils';

interface ProductCartState {
  items: CartItem[];
  isOpen: boolean;
  addToCart: (product: Product, options?: {
    selectedAddOns?: { addOn: AddOn; quantity: number }[];
    selectedDate?: Date;
    selectedTimeSlot?: TimeSlot;
    quantity?: number;
  }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useProductCart = create<ProductCartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToCart: (product, options = {}) => {
        const { selectedAddOns = [], selectedDate, selectedTimeSlot, quantity = 1 } = options;
        
        set((state) => {
          // Check if item already exists in cart
          const existingItemIndex = state.items.findIndex(
            item => item.product.id === product.id &&
            JSON.stringify(item.selectedAddOns) === JSON.stringify(selectedAddOns) &&
            item.selectedDate?.getTime() === selectedDate?.getTime() &&
            JSON.stringify(item.selectedTimeSlot) === JSON.stringify(selectedTimeSlot)
          );

          const newItems = [...state.items];

          if (existingItemIndex >= 0) {
            // Update existing item
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: newItems[existingItemIndex].quantity + quantity,
              totalPrice: calculateTotalPrice(product, selectedAddOns.map(sa => ({ id: sa.addOn.id, quantity: sa.quantity }))) * (newItems[existingItemIndex].quantity + quantity)
            };
          } else {
            // Add new item
            const cartItem: CartItem = {
              product,
              quantity,
              selectedAddOns,
              selectedDate,
              selectedTimeSlot,
              totalPrice: calculateTotalPrice(product, selectedAddOns.map(sa => ({ id: sa.addOn.id, quantity: sa.quantity }))) * quantity
            };
            newItems.push(cartItem);
          }

          return { items: newItems };
        });
      },

      removeFromCart: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId)
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set((state) => ({
          items: state.items.map(item => 
            item.product.id === productId 
              ? {
                  ...item,
                  quantity,
                  totalPrice: calculateTotalPrice(
                    item.product, 
                    item.selectedAddOns?.map(sa => ({ id: sa.addOn.id, quantity: sa.quantity }))
                  ) * quantity
                }
              : item
          )
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.totalPrice, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      }
    }),
    {
      name: 'tinkertank-product-cart',
      partialize: (state) => ({ items: state.items })
    }
  )
);

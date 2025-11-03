'use client';

import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { Product, AddOn, TimeSlot } from '@/types/products';
import { StudentDetails as Student } from '@/types/enhancedCart';

export const useCart = () => {
  const store = useEnhancedCartStore();

  const addToCart = (
    product: Product,
    options?: {
      quantity?: number;
      selectedDate?: Date;
      selectedTimeSlot?: TimeSlot;
      selectedAddOns?: { addOn: AddOn; quantity: number }[];
      notes?: string;
    }
  ) => {
    store.addItem(product, options);
  };

  const addStudentToItem = (itemId: string, student: Student) => {
    store.addStudent(itemId, student);
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    store.updateQuantity(itemId, quantity);
  };

  const removeFromCart = (itemId: string) => {
    store.removeItem(itemId);
  };

  const clearCart = () => {
    store.clearCart();
  };

  const canCheckout = () => {
    const validation = store.getValidation();
    return validation.isValid && store.items.length > 0;
  };

  return {
    // State
    items: store.items,
    isLoading: store.isLoading,
    error: store.error,
    
    // Computed
    summary: store.getSummary(),
    validation: store.getValidation(),
    canCheckout: canCheckout(),
    
    // Actions
    addToCart,
    addStudentToItem,
    updateItemQuantity,
    removeFromCart,
    clearCart,
    
    // Store methods
    getItem: store.getItem,
    hasStudent: store.hasStudent,
  };
};

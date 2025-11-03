'use client';

import { useState, useEffect } from 'react';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { CartIcon } from './CartIcon';
import { CartDrawer } from './CartDrawer';

export const Cart = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { loadFromStorage } = useEnhancedCartStore();

  // Load cart from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <>
      <CartIcon 
        onClick={() => setIsDrawerOpen(true)}
        className="fixed top-4 right-4 z-40 bg-white shadow-lg rounded-full"
      />
      
      <CartDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
};

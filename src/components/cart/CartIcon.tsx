'use client';

import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface CartIconProps {
  onClick?: () => void;
  className?: string;
}

export const CartIcon = ({ onClick, className = '' }: CartIconProps) => {
  const itemCount = useEnhancedCartStore(state => state.getSummary().itemCount);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-700 hover:text-gray-900 transition-colors ${className}`}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCartIcon className="w-6 h-6" />
      
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};

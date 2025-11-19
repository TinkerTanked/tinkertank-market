'use client';

import { CartSummary as CartSummaryType } from '@/types/enhancedCart';
import { formatPrice } from '@/utils/formatPrice';

interface CartSummaryProps {
  summary: CartSummaryType;
  showDetails?: boolean;
}

export const CartSummary = ({ summary, showDetails = true }: CartSummaryProps) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
      
      {showDetails && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Items ({summary.itemCount})
            </span>
            <span className="text-gray-900">{formatPrice(summary.subtotal)}</span>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between font-medium">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatPrice(summary.total)}</span>
            </div>
          </div>
        </div>
      )}
      
      {!showDetails && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {summary.itemCount} items, {summary.studentCount} students
          </span>
          <span className="font-medium text-lg text-gray-900">
            {formatPrice(summary.total)}
          </span>
        </div>
      )}
      
      {summary.studentCount > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Total students registered: {summary.studentCount}
        </div>
      )}
    </div>
  );
};

'use client';

import { Product, ProductFilter } from '@/types/products';
import ProductCard from './ProductCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  className?: string;
  emptyMessage?: string;
  title?: string;
}

export default function ProductGrid({ 
  products, 
  onAddToCart, 
  onViewDetails, 
  className,
  emptyMessage = "No products found",
  title
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500 max-w-md">
          Try adjusting your filters or search terms to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {title && (
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}

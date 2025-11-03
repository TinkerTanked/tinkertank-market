'use client';

import { useState, useMemo } from 'react';
import { Product, ProductFilter, ProductCategory } from '@/types/products';
import { products } from '@/data/products';
import { filterProducts, getFeaturedProducts } from '@/lib/productUtils';
import { useProductCart } from '@/hooks/useProductCart';
import ProductGrid from './ProductGrid';
import ProductSearch from './ProductSearch';
import { cn, getCategoryIcon } from '@/lib/utils';

interface ProductCatalogProps {
  className?: string;
  showFeatured?: boolean;
  defaultCategory?: ProductCategory;
  onProductSelect?: (product: Product) => void;
}

export default function ProductCatalog({ 
  className, 
  showFeatured = true,
  defaultCategory,
  onProductSelect 
}: ProductCatalogProps) {
  const [filter, setFilter] = useState<ProductFilter>(
    defaultCategory ? { category: defaultCategory } : {}
  );
  const { addToCart, openCart } = useProductCart();

  const filteredProducts = useMemo(() => {
    return filterProducts(products, filter);
  }, [filter]);

  const featuredProducts = useMemo(() => {
    return showFeatured ? getFeaturedProducts(products, 6) : [];
  }, [showFeatured]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    openCart();
  };

  const handleViewDetails = (product: Product) => {
    onProductSelect?.(product);
  };

  const hasFilters = Object.keys(filter).length > 0;

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          TinkerTank Programs
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover amazing tech adventures for young innovators! From coding camps to birthday parties and weekly programs.
        </p>
      </div>

      {/* Search and Filters */}
      <ProductSearch onFilterChange={setFilter} />

      {/* Featured Products (only shown when no filters are active) */}
      {showFeatured && !hasFilters && featuredProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">⭐ Featured Programs</h2>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
              Staff Picks
            </div>
          </div>
          <ProductGrid
            products={featuredProducts}
            onAddToCart={handleAddToCart}
            onViewDetails={handleViewDetails}
          />
        </section>
      )}

      {/* Category Sections or Filtered Results */}
      {hasFilters ? (
        <ProductGrid
          products={filteredProducts}
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
          title="Search Results"
          emptyMessage="No products match your criteria"
        />
      ) : (
        <div className="space-y-12">
          {/* Camps */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{getCategoryIcon('camps')}</span>
              <h2 className="text-2xl font-bold text-gray-900">Holiday Camps</h2>
              <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                Neutral Bay
              </div>
            </div>
            <ProductGrid
              products={products.filter(p => p.category === 'camps')}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewDetails}
            />
          </section>

          {/* Birthday Parties */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{getCategoryIcon('birthdays')}</span>
              <h2 className="text-2xl font-bold text-gray-900">Birthday Parties</h2>
              <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">
                We Come to You!
              </div>
            </div>
            <ProductGrid
              products={products.filter(p => p.category === 'birthdays')}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewDetails}
            />
          </section>

          {/* Subscriptions */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{getCategoryIcon('subscriptions')}</span>
              <h2 className="text-2xl font-bold text-gray-900">Weekly Programs</h2>
              <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                Ongoing Learning
              </div>
            </div>
            <ProductGrid
              products={products.filter(p => p.category === 'subscriptions')}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewDetails}
            />
          </section>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-sm text-gray-600">Total Programs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              {products.filter(p => p.category === 'camps').length}
            </div>
            <div className="text-sm text-gray-600">Holiday Camps</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-600">
              {products.filter(p => p.category === 'birthdays').length}
            </div>
            <div className="text-sm text-gray-600">Party Options</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => p.category === 'subscriptions').length}
            </div>
            <div className="text-sm text-gray-600">Weekly Programs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

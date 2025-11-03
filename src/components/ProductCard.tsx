'use client';

import { Product, ProductCategory } from '@/types/products';
import { formatPrice, formatDuration, getAgeColor, getCategoryIcon, getCategoryColor, cn } from '@/lib/utils';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  className?: string;
}

export default function ProductCard({ product, onAddToCart, onViewDetails, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleViewDetails = () => {
    onViewDetails?.(product);
  };

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden transition-all duration-300 cursor-pointer',
        'hover:shadow-2xl hover:scale-105 hover:border-blue-200',
        isHovered && 'shadow-2xl scale-105 border-blue-200',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewDetails}
    >
      {/* Category Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-lg',
          getCategoryColor(product.category)
        )}>
          <span className="text-base">{getCategoryIcon(product.category)}</span>
          <span className="capitalize">{product.category}</span>
        </div>
      </div>

      {/* Price Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-lg font-bold shadow-lg">
          {formatPrice(product.price)}
          {product.category === 'subscriptions' && '/week'}
        </div>
      </div>

      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        {!imageError && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <div className="text-6xl">{getCategoryIcon(product.category)}</div>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
          {product.name}
        </h3>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-2">
          <span className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
            getAgeColor(product.ageRange)
          )}>
            👥 {product.ageRange}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            ⏰ {formatDuration(product.duration)}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            📍 {product.location}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
          {product.shortDescription}
        </p>

        {/* Features Preview */}
        <div className="flex flex-wrap gap-1">
          {product.features.slice(0, 3).map((feature, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700"
            >
              ✨ {feature}
            </span>
          ))}
          {product.features.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              +{product.features.length - 3} more
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors duration-200 text-sm"
          >
            View Details
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors duration-200 text-sm shadow-md hover:shadow-lg"
          >
            Add to Cart
          </button>
        </div>

        {/* Add-ons indicator */}
        {product.addOns && product.addOns.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-purple-600">
            <span>🎁</span>
            <span>Add-ons available</span>
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300',
        isHovered && 'opacity-100'
      )} />
    </div>
  );
}

'use client'

import Link from 'next/link'
import { ClockIcon, UserGroupIcon, CalendarIcon } from '@heroicons/react/24/outline'
import type { CatalogProduct } from '@/types/products'

interface ProductCardProps {
  product: CatalogProduct
  featured?: boolean
  showCategory?: boolean
}

export default function ProductCard({ product, featured = false, showCategory = true }: ProductCardProps) {
  const cardSize = featured ? 'lg:col-span-2' : ''
  const imageSize = featured ? 'h-64' : 'h-48'

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'camps': return 'STEM Camp'
      case 'birthdays': return 'Birthday Party'
      case 'subscriptions': return 'Ignite Program'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'camps': return 'bg-blue-100 text-blue-800'
      case 'birthdays': return 'bg-purple-100 text-purple-800'
      case 'subscriptions': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className={`card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${cardSize}`}>
      {/* Product Image */}
      <div className={`relative ${imageSize} bg-gradient-to-br from-primary-100 to-accent-100`}>
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center'>
            <div className='text-6xl'>
              {product.category === 'camps' && '🔬'}
              {product.category === 'birthdays' && '🎉'}
              {product.category === 'subscriptions' && '🚀'}
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        {showCategory && (
          <div className='absolute top-4 left-4'>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(product.category)}`}>
              {getCategoryLabel(product.category)}
            </span>
          </div>
        )}

        {/* Price Badge */}
        <div className='absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1'>
          <span className='font-bold text-primary-600'>{formatPrice(product.price)}</span>
        </div>
      </div>

      {/* Content */}
      <div className='p-6 space-y-4'>
        <div className='space-y-2'>
          <h3 className='font-display font-semibold text-xl text-gray-900'>
            {product.name}
          </h3>
          <p className='text-gray-600 line-clamp-3'>
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Product Details */}
        <div className='flex flex-wrap gap-4 text-sm text-gray-500'>
          <div className='flex items-center space-x-1'>
            <UserGroupIcon className='w-4 h-4' />
            <span>{product.ageRange}</span>
          </div>
          <div className='flex items-center space-x-1'>
            <ClockIcon className='w-4 h-4' />
            <span>{product.duration}</span>
          </div>
          {product.maxCapacity && (
            <div className='flex items-center space-x-1'>
              <CalendarIcon className='w-4 h-4' />
              <span>Max {product.maxCapacity}</span>
            </div>
          )}
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className='space-y-2'>
            <h4 className='font-medium text-gray-900'>What's Included:</h4>
            <ul className='space-y-1'>
              {product.features.slice(0, 3).map((feature, index) => (
                <li key={index} className='text-sm text-gray-600 flex items-start space-x-2'>
                  <span className='text-accent-500 mt-1'>•</span>
                  <span>{feature}</span>
                </li>
              ))}
              {product.features.length > 3 && (
                <li className='text-sm text-gray-500 italic'>
                  +{product.features.length - 3} more features
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <div className='pt-4'>
          <Link
            href={`/${product.category}/${product.id}`}
            className='btn-primary w-full'
          >
            {product.category === 'subscriptions' ? 'Learn More' : 'Book Now'}
          </Link>
        </div>
      </div>
    </div>
  )
}

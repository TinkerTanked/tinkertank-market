'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, CheckIcon, ClockIcon, UserGroupIcon, CalendarIcon } from '@heroicons/react/24/outline'
import type { CatalogProduct } from '@/types/products'

interface ProductCardProps {
  product: CatalogProduct
  featured?: boolean
  showCategory?: boolean
}

export default function ProductCard({ product, featured = false, showCategory = true }: ProductCardProps) {
  const cardSize = featured ? 'lg:col-span-2' : ''
  const imageSize = featured ? 'h-64' : 'h-52'

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'camps': return 'STEAM Camp'
      case 'birthdays': return 'Birthday Party'
      case 'subscriptions': return 'Ignite Program'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'camps': return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'birthdays': return 'bg-orange-50 text-orange-800 border-orange-200'
      case 'subscriptions': return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      default: return 'bg-slate-50 text-slate-800 border-slate-200'
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
    <article className={`card group flex h-full flex-col transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg ${cardSize}`}>
      {/* Product Image */}
      <div className={`relative ${imageSize} overflow-hidden bg-slate-100`}>
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes={featured
              ? '(min-width: 1024px) 66vw, (min-width: 640px) 50vw, calc(100vw - 2rem)'
              : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, calc(100vw - 2rem)'}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]'
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
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/25 to-transparent' />
        
        {/* Category Badge */}
        {showCategory && (
          <div className='absolute top-4 left-4'>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm ${getCategoryColor(product.category)}`}>
              {getCategoryLabel(product.category)}
            </span>
          </div>
        )}

        {/* Price Badge */}
        <div className='absolute right-4 top-4 rounded-lg border border-white/70 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm'>
          <span className='font-bold text-slate-950'>{formatPrice(product.price)}</span>
        </div>
      </div>

      {/* Content */}
      <div className='flex flex-1 flex-col space-y-5 p-6'>
        <div className='space-y-2'>
          <h3 className='font-display text-xl font-semibold tracking-tight text-slate-950'>
            {product.name}
          </h3>
          <p className='line-clamp-3 leading-relaxed text-slate-600'>
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Product Details */}
        <div className='flex flex-wrap gap-x-4 gap-y-2 border-y border-slate-100 py-3 text-sm font-medium text-slate-600'>
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
            <h4 className='text-sm font-semibold text-slate-900'>What&apos;s included</h4>
            <ul className='space-y-1'>
              {product.features.slice(0, 3).map((feature, index) => (
                <li key={index} className='flex items-start space-x-2 text-sm text-slate-600'>
                  <CheckIcon className='mt-0.5 h-4 w-4 shrink-0 text-primary-700' />
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
        <div className='mt-auto pt-2'>
          <Link
            href={product.category === 'subscriptions' ? `/ignite/${product.id}` : `/${product.category}/${product.id}`}
            className='btn-primary w-full'
          >
            {product.category === 'subscriptions' ? `Explore ${product.name}` : `Book ${product.name}`}
            <ArrowRightIcon className='ml-2 h-4 w-4' />
          </Link>
        </div>
      </div>
    </article>
  )
}

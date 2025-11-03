'use client'

import { useState } from 'react'
import { products } from '@/data/products'
import ProductCard from '@/components/ui/ProductCard'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<string>('all')

  const categories = [
    { id: 'all', name: 'All Programs', count: products.length },
    { id: 'camps', name: 'STEM Camps', count: products.filter(p => p.category === 'camps').length },
    { id: 'birthdays', name: 'Birthday Parties', count: products.filter(p => p.category === 'birthdays').length },
    { id: 'subscriptions', name: 'Ignite Programs', count: products.filter(p => p.category === 'subscriptions').length }
  ]

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: 'under-50', name: 'Under $50' },
    { id: '50-150', name: '$50 - $150' },
    { id: '150-300', name: '$150 - $300' },
    { id: 'over-300', name: 'Over $300' }
  ]

  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      
      if (!matchesSearch) return false
    }

    // Category filter
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false
    }

    // Price filter
    if (priceRange !== 'all') {
      const price = product.price
      switch (priceRange) {
        case 'under-50':
          if (price >= 50) return false
          break
        case '50-150':
          if (price < 50 || price >= 150) return false
          break
        case '150-300':
          if (price < 150 || price >= 300) return false
          break
        case 'over-300':
          if (price < 300) return false
          break
      }
    }

    return true
  })

  return (
    <div>
      {/* Hero Section */}
      <section className='py-16 bg-gradient-to-br from-primary-500 to-accent-500 text-white'>
        <div className='container-custom text-center'>
          <h1 className='text-4xl md:text-5xl font-display font-bold mb-4'>
            All STEM Programs
          </h1>
          <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
            Discover the perfect STEM experience for your child from our complete range of programs
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className='py-8 bg-white border-b border-gray-200 sticky top-16 z-40'>
        <div className='container-custom'>
          <div className='flex flex-col lg:flex-row gap-6 items-center'>
            {/* Search */}
            <div className='relative flex-1 max-w-md'>
              <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search programs...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              />
            </div>

            {/* Category Filter */}
            <div className='flex items-center space-x-2'>
              <FunnelIcon className='w-5 h-5 text-gray-400' />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
            >
              {priceRanges.map(range => (
                <option key={range.id} value={range.id}>
                  {range.name}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchQuery || selectedCategory !== 'all' || priceRange !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setPriceRange('all')
                }}
                className='text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200'
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className='py-12'>
        <div className='container-custom'>
          <div className='mb-8'>
            <p className='text-gray-600'>
              Showing {filteredProducts.length} of {products.length} programs
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className='text-center py-20'>
              <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <MagnifyingGlassIcon className='w-12 h-12 text-gray-400' />
              </div>
              <h3 className='text-xl font-display font-semibold text-gray-900 mb-2'>
                No programs found
              </h3>
              <p className='text-gray-600 mb-6'>
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setPriceRange('all')
                }}
                className='btn-outline'
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Popular Categories */}
      {searchQuery === '' && selectedCategory === 'all' && priceRange === 'all' && (
        <section className='py-20 bg-gradient-to-br from-primary-50 to-accent-50'>
          <div className='container-custom'>
            <div className='text-center space-y-4 mb-12'>
              <h2 className='text-3xl font-display font-bold text-gray-900'>
                Browse by Category
              </h2>
              <p className='text-lg text-gray-600'>
                Quick access to our most popular program types
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300'>
                <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <span className='text-4xl'>🔬</span>
                </div>
                <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                  STEM Camps
                </h3>
                <p className='text-gray-600 mb-6'>
                  Day and extended camps with hands-on experiments and projects
                </p>
                <button
                  onClick={() => setSelectedCategory('camps')}
                  className='btn-primary'
                >
                  View Camps
                </button>
              </div>

              <div className='bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300'>
                <div className='w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <span className='text-4xl'>🎉</span>
                </div>
                <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                  Birthday Parties
                </h3>
                <p className='text-gray-600 mb-6'>
                  Themed party packages that make birthdays educational and fun
                </p>
                <button
                  onClick={() => setSelectedCategory('birthdays')}
                  className='btn-primary'
                >
                  View Parties
                </button>
              </div>

              <div className='bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300'>
                <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <span className='text-4xl'>🚀</span>
                </div>
                <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                  Ignite Programs
                </h3>
                <p className='text-gray-600 mb-6'>
                  Weekly subscription programs for ongoing STEM learning
                </p>
                <button
                  onClick={() => setSelectedCategory('subscriptions')}
                  className='btn-primary'
                >
                  View Programs
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

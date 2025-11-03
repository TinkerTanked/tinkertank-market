'use client';

import { useState, useEffect } from 'react';
import { ProductFilter, ProductCategory } from '@/types/products';
import { cn, getCategoryIcon } from '@/lib/utils';

interface ProductSearchProps {
  onFilterChange: (filter: ProductFilter) => void;
  className?: string;
}

const ageRanges = [
  '5-8 years',
  '6-12 years', 
  '7-14 years',
  '8-16 years',
  '9-16 years'
];

const locations = [
  'Neutral Bay',
  'Any location (we come to you!)',
  'Your school',
  'Neutral Bay Studio'
];

const priceRanges = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $150', min: 50, max: 150 },
  { label: '$150 - $300', min: 150, max: 300 },
  { label: '$300+', min: 300, max: 1000 }
];

export default function ProductSearch({ onFilterChange, className }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | ''>('');
  const [selectedAgeRange, setSelectedAgeRange] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const filter: ProductFilter = {};
    
    if (searchQuery.trim()) filter.searchQuery = searchQuery.trim();
    if (selectedCategory) filter.category = selectedCategory;
    if (selectedAgeRange) filter.ageRange = selectedAgeRange;
    if (selectedLocation) filter.location = selectedLocation;
    if (selectedPriceRange) {
      const range = priceRanges.find(r => r.label === selectedPriceRange);
      if (range) filter.priceRange = { min: range.min, max: range.max };
    }

    onFilterChange(filter);
  }, [searchQuery, selectedCategory, selectedAgeRange, selectedLocation, selectedPriceRange, onFilterChange]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAgeRange('');
    setSelectedLocation('');
    setSelectedPriceRange('');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedAgeRange || selectedLocation || selectedPriceRange;

  return (
    <div className={cn('bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6', className)}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search for camps, parties, or programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Quick Category Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors duration-200',
            !selectedCategory
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <span>🌟</span>
          <span>All</span>
        </button>
        {(['camps', 'birthdays', 'subscriptions'] as ProductCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category === selectedCategory ? '' : category)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors duration-200 capitalize',
              selectedCategory === category
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <span>{getCategoryIcon(category)}</span>
            <span>{category}</span>
          </button>
        ))}
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
      >
        <span>Advanced Filters</span>
        <svg 
          className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
          {/* Age Range Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
            <select
              value={selectedAgeRange}
              onChange={(e) => setSelectedAgeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Any age</option>
              {ageRanges.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Any location</option>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Any price</option>
              {priceRanges.map((range) => (
                <option key={range.label} value={range.label}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end mt-4">
          <button
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

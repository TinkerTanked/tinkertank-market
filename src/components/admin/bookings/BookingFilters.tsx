'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BookingFilters {
  search: string;
  status: string;
  location: string;
  dateRange: string;
  productType: string;
}

interface BookingFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
  onClose: () => void;
}

interface FilterOptions {
  locations: Array<{ id: string; name: string }>;
  productTypes: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  dateRanges: Array<{ value: string; label: string }>;
}

export default function BookingFilters({ filters, onFiltersChange, onClose }: BookingFiltersProps) {
  const [options, setOptions] = useState<FilterOptions>({
    locations: [],
    productTypes: [
      { value: 'CAMP', label: 'Camps' },
      { value: 'BIRTHDAY', label: 'Birthday Parties' },
      { value: 'SUBSCRIPTION', label: 'Subscriptions' },
    ],
    statuses: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'CONFIRMED', label: 'Confirmed' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'COMPLETED', label: 'Completed' },
    ],
    dateRanges: [
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: 'this_week', label: 'This Week' },
      { value: 'next_week', label: 'Next Week' },
      { value: 'this_month', label: 'This Month' },
      { value: 'next_month', label: 'Next Month' },
    ],
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/admin/locations');
        if (response.ok) {
          const locations = await response.json();
          setOptions((prev) => ({ ...prev, locations }));
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };

    fetchLocations();
  }, []);

  const handleFilterChange = (key: keyof BookingFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: filters.search, // Keep search term
      status: '',
      location: '',
      dateRange: '',
      productType: '',
    });
  };

  const hasActiveFilters = Object.entries(filters)
    .filter(([key]) => key !== 'search')
    .some(([_, value]) => value !== '');

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            {options.statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            id="location-filter"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          >
            <option value="">All Locations</option>
            {options.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="product-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Product Type
          </label>
          <select
            id="product-filter"
            value={filters.productType}
            onChange={(e) => handleFilterChange('productType', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          >
            <option value="">All Products</option>
            {options.productTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            id="date-filter"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          >
            <option value="">All Dates</option>
            {options.dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {options.statuses.find((s) => s.value === filters.status)?.label}
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Location: {options.locations.find((l) => l.id === filters.location)?.name}
              </span>
            )}
            {filters.productType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Type: {options.productTypes.find((t) => t.value === filters.productType)?.label}
              </span>
            )}
            {filters.dateRange && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Date: {options.dateRanges.find((d) => d.value === filters.dateRange)?.label}
              </span>
            )}
          </div>
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

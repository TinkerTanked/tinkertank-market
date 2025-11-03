'use client';

import { useEffect, useState } from 'react';

interface Filters {
  location: string;
  productType: string;
  status: string;
}

interface CalendarFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

interface FilterOptions {
  locations: Array<{ id: string; name: string }>;
  productTypes: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
}

export default function CalendarFilters({ filters, onFiltersChange }: CalendarFiltersProps) {
  const [options, setOptions] = useState<FilterOptions>({
    locations: [],
    productTypes: [
      { value: 'CAMP', label: 'Camps' },
      { value: 'BIRTHDAY', label: 'Birthdays' },
      { value: 'SUBSCRIPTION', label: 'Subscriptions' },
    ],
    statuses: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'CONFIRMED', label: 'Confirmed' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'COMPLETED', label: 'Completed' },
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

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({ location: '', productType: '', status: '' });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <label htmlFor="location-filter" className="sr-only">
            Filter by location
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

        <div className="flex-1 min-w-0">
          <label htmlFor="product-filter" className="sr-only">
            Filter by product type
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

        <div className="flex-1 min-w-0">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
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

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Clear Filters
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.location && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Location: {options.locations.find((l) => l.id === filters.location)?.name}
            </span>
          )}
          {filters.productType && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Type: {options.productTypes.find((t) => t.value === filters.productType)?.label}
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Status: {options.statuses.find((s) => s.value === filters.status)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

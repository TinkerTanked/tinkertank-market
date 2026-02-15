'use client';

import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import BookingList from '@/components/admin/bookings/BookingList';
import BookingFilters from '@/components/admin/bookings/BookingFilters';

interface BookingFilters {
  search: string;
  status: string;
  location: string;
  dateRange: string;
  productType: string;
}

export default function AdminBookings() {
  const [filters, setFilters] = useState<BookingFilters>({
    search: '',
    status: '',
    location: '',
    dateRange: '',
    productType: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700">
            Add Booking
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search bookings by student name, product, or location..."
          value={filters.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, search: e.target.value })}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <BookingFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Bookings List */}
      <BookingList filters={filters} />
    </div>
  );
}

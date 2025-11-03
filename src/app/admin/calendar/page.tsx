'use client'

import { useState, useEffect } from 'react'
import { useCalendar, useCalendarDateRange } from '@/hooks/useCalendar'
import AdminCalendar from '@/components/calendar/AdminCalendar'
import { AdminCalendarEvent, BookingEvent } from '@/types/booking'
import { 
  CalendarIcon, 
  ChartBarIcon, 
  UsersIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline'

export default function AdminCalendarPage() {
  const [selectedFilters, setSelectedFilters] = useState({
    productType: '',
    locationId: '',
    status: '',
  })

  const { currentDate, getDateRange } = useCalendarDateRange()
  const { start, end } = getDateRange()
  
  const { 
    events, 
    loading, 
    error, 
    updateEvent, 
    createEvent, 
    deleteEvent,
    refreshEvents 
  } = useCalendar(start, end, {
    view: 'admin',
    productType: selectedFilters.productType,
    locationId: selectedFilters.locationId,
    autoRefresh: true,
  })

  const adminEvents = events as AdminCalendarEvent[]

  // Calculate summary statistics
  const stats = {
    totalEvents: adminEvents.length,
    totalBookings: adminEvents.reduce((sum, event) => 
      sum + (event.extendedProps.currentBookings || 0), 0
    ),
    totalCapacity: adminEvents.reduce((sum, event) => 
      sum + (event.extendedProps.capacity || 0), 0
    ),
    revenue: adminEvents.reduce((sum, event) => 
      sum + (event.extendedProps.bookings?.reduce((bookingSum: number, booking: BookingEvent) => 
        bookingSum + booking.amountPaid, 0) || 0), 0
    ),
  }

  const utilizationRate = stats.totalCapacity > 0 
    ? (stats.totalBookings / stats.totalCapacity) * 100 
    : 0

  const handleEventUpdate = async (eventId: string, updates: Partial<BookingEvent>) => {
    try {
      await updateEvent(eventId, updates)
      // Show success notification
    } catch (error) {
      console.error('Failed to update event:', error)
      // Show error notification
    }
  }

  const handleEventCreate = async (eventData: Partial<BookingEvent>) => {
    try {
      await createEvent(eventData)
      // Show success notification
    } catch (error) {
      console.error('Failed to create event:', error)
      // Show error notification
    }
  }

  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      // Show success notification
    } catch (error) {
      console.error('Failed to delete event:', error)
      // Show error notification
    }
  }

  const filterOptions = {
    productTypes: [
      { value: '', label: 'All Programs' },
      { value: 'CAMP', label: 'Holiday Camps' },
      { value: 'BIRTHDAY', label: 'Birthday Parties' },
      { value: 'IGNITE', label: 'Ignite Sessions' },
    ],
    locations: [
      { value: '', label: 'All Locations' },
      { value: '1', label: 'Neutral Bay' },
      { value: '2', label: 'North Sydney' },
    ],
    statuses: [
      { value: '', label: 'All Statuses' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'CONFIRMED', label: 'Confirmed' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ]
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error Loading Calendar</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => refreshEvents()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Calendar</h1>
                <p className="mt-2 text-gray-600">
                  Manage bookings, events, and capacity
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => refreshEvents()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Refresh
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Events
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalEvents}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bookings / Capacity
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalBookings} / {stats.totalCapacity}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Utilization Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {utilizationRate.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.revenue.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Type
              </label>
              <select
                value={selectedFilters.productType}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, productType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.productTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={selectedFilters.locationId}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, locationId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.locations.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedFilters.status}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </div>
        ) : (
          <AdminCalendar
            events={adminEvents}
            onEventUpdate={handleEventUpdate}
            onEventCreate={handleEventCreate}
            onEventDelete={handleEventDelete}
          />
        )}
      </div>
    </div>
  )
}

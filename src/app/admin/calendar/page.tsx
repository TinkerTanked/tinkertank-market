'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCalendar, useCalendarDateRange } from '@/hooks/useCalendar'
import AdminCalendar from '@/components/calendar/AdminCalendar'
import { AdminCalendarEvent, BookingEvent } from '@/types/booking'
import { 
  CalendarIcon, 
  ChartBarIcon, 
  UsersIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

export default function AdminCalendarPage() {
  const [selectedFilters, setSelectedFilters] = useState({
    productType: '',
    locationId: '',
    status: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const { currentDate, getDateRange } = useCalendarDateRange()
  const dateRange = useMemo(() => getDateRange(), [getDateRange])
  
  const { 
    events, 
    loading, 
    error, 
    updateEvent, 
    createEvent, 
    deleteEvent,
    refreshEvents 
  } = useCalendar(dateRange.start, dateRange.end, {
    view: 'admin',
    productType: selectedFilters.productType,
    locationId: selectedFilters.locationId,
    autoRefresh: false,
  })

  const adminEvents = events as AdminCalendarEvent[]

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
        bookingSum + (Number(booking.totalPrice) || 0), 0) || 0), 0
    ),
  }

  const utilizationRate = stats.totalCapacity > 0 
    ? (stats.totalBookings / stats.totalCapacity) * 100 
    : 0

  const handleEventUpdate = async (eventId: string, updates: Partial<BookingEvent>) => {
    try {
      await updateEvent(eventId, updates)
    } catch (error) {
      console.error('Failed to update event:', error)
    }
  }

  const handleEventCreate = async (eventData: Partial<BookingEvent>) => {
    try {
      await createEvent(eventData)
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
    } catch (error) {
      console.error('Failed to delete event:', error)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-red-600 text-xl font-bold mb-2">Error Loading Calendar</div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => refreshEvents()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow-md transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <CalendarIcon className="h-10 w-10 text-primary-600" />
                  Admin Calendar
                </h1>
                <p className="mt-3 text-gray-600 text-lg">
                  Manage bookings, events, and capacity across all programs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all shadow-sm',
                    showFilters 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <FunnelIcon className="h-5 w-5" />
                  Filters
                </button>
                <button
                  onClick={() => refreshEvents()}
                  className="flex items-center gap-2 px-5 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition-all"
                  disabled={loading}
                >
                  <ArrowPathIcon className={clsx('h-5 w-5', loading && 'animate-spin')} />
                  Refresh
                </button>
                <button className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-sm transition-all">
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl">
                  <CalendarIcon className="h-7 w-7 text-blue-600" />
                </div>
                <div className="ml-5 flex-1">
                  <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Total Events
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.totalEvents}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 px-6 py-3">
              <div className="text-xs font-medium text-blue-700">
                Across all programs
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-100 rounded-xl">
                  <UsersIcon className="h-7 w-7 text-green-600" />
                </div>
                <div className="ml-5 flex-1">
                  <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Bookings
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.totalBookings}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-green-50 px-6 py-3">
              <div className="text-xs font-medium text-green-700">
                of {stats.totalCapacity} capacity
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className={clsx(
                  'flex-shrink-0 p-3 rounded-xl',
                  utilizationRate >= 80 ? 'bg-green-100' : 
                  utilizationRate >= 60 ? 'bg-amber-100' : 
                  'bg-red-100'
                )}>
                  <ChartBarIcon className={clsx(
                    'h-7 w-7',
                    utilizationRate >= 80 ? 'text-green-600' : 
                    utilizationRate >= 60 ? 'text-amber-600' : 
                    'text-red-600'
                  )} />
                </div>
                <div className="ml-5 flex-1">
                  <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Utilization
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900 mt-1">
                    {utilizationRate.toFixed(1)}%
                  </dd>
                </div>
              </div>
            </div>
            <div className={clsx(
              'px-6 py-3',
              utilizationRate >= 80 ? 'bg-green-50' : 
              utilizationRate >= 60 ? 'bg-amber-50' : 
              'bg-red-50'
            )}>
              <div className={clsx(
                'text-xs font-medium',
                utilizationRate >= 80 ? 'text-green-700' : 
                utilizationRate >= 60 ? 'text-amber-700' : 
                'text-red-700'
              )}>
                {utilizationRate >= 80 ? 'Excellent' : utilizationRate >= 60 ? 'Good' : 'Needs attention'}
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-purple-100 rounded-xl">
                  <CurrencyDollarIcon className="h-7 w-7 text-purple-600" />
                </div>
                <div className="ml-5 flex-1">
                  <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Revenue
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900 mt-1">
                    ${(stats.revenue / 1000).toFixed(1)}k
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 px-6 py-3">
              <div className="text-xs font-medium text-purple-700">
                ${stats.revenue.toLocaleString()} total
              </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-600" />
                Filters
              </h3>
              <button
                onClick={() => setSelectedFilters({ productType: '', locationId: '', status: '' })}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Program Type
                </label>
                <select
                  value={selectedFilters.productType}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, productType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium"
                >
                  {filterOptions.productTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={selectedFilters.locationId}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, locationId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium"
                >
                  {filterOptions.locations.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedFilters.status}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium"
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
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
            <p className="text-lg font-medium text-gray-600">Loading calendar...</p>
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

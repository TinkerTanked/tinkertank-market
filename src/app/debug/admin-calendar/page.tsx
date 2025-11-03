'use client'

import { useState, useEffect } from 'react'
import AdminCalendar from '@/components/calendar/AdminCalendar'
import { AdminCalendarEvent, BookingEvent } from '@/types/booking'
import { 
  CalendarIcon, 
  ChartBarIcon, 
  UsersIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline'

export default function DebugAdminCalendarPage() {
  const [events, setEvents] = useState<AdminCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch mock events
  useEffect(() => {
    const fetchMockEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/calendar/events-mock?view=admin')
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch mock events')
        }
        
        console.log('📊 Fetched mock events:', data.events)
        setEvents(data.events)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('❌ Error fetching mock events:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMockEvents()
  }, [])

  // Calculate summary statistics
  const stats = {
    totalEvents: events.length,
    totalBookings: events.reduce((sum, event) => 
      sum + (event.extendedProps.currentBookings || 0), 0
    ),
    totalCapacity: events.reduce((sum, event) => 
      sum + (event.extendedProps.capacity || 0), 0
    ),
    revenue: events.reduce((sum, event) => 
      sum + (event.extendedProps.bookings?.reduce((bookingSum: number, booking: BookingEvent) => 
        bookingSum + booking.amountPaid, 0) || 0), 0
    ),
  }

  const utilizationRate = stats.totalCapacity > 0 
    ? (stats.totalBookings / stats.totalCapacity) * 100 
    : 0

  const handleEventUpdate = async (eventId: string, updates: Partial<BookingEvent>) => {
    console.log('🔄 Update event:', eventId, updates)
    // Mock update - in real implementation this would call API
    alert(`Mock update for event ${eventId}`)
  }

  const handleEventCreate = async (eventData: Partial<BookingEvent>) => {
    console.log('➕ Create event:', eventData)
    alert('Mock create event')
  }

  const handleEventDelete = async (eventId: string) => {
    console.log('🗑️ Delete event:', eventId)
    if (confirm(`Delete event ${eventId}?`)) {
      setEvents(prev => prev.filter(e => e.id !== eventId))
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error Loading Calendar</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
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
                <h1 className="text-3xl font-bold text-gray-900">Debug Admin Calendar</h1>
                <p className="mt-2 text-gray-600">
                  Testing calendar with mock data
                </p>
                <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm inline-block">
                  🧪 Using Mock Data - Database Not Connected
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Refresh
                </button>
                <a
                  href="/debug/simple-calendar"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Simple Test
                </a>
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

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Event Data</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(events.map(e => ({
                  id: e.id,
                  title: e.title,
                  start: e.start,
                  bookings: e.extendedProps.currentBookings,
                  capacity: e.extendedProps.capacity
                })), null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">Component State</h4>
              <ul className="text-sm space-y-1">
                <li>Loading: {loading ? '✅' : '❌'}</li>
                <li>Error: {error || '❌'}</li>
                <li>Events Loaded: {events.length} ✅</li>
                <li>Mock API: ✅ Working</li>
                <li>Statistics: ✅ Calculated</li>
              </ul>
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
            events={events}
            onEventUpdate={handleEventUpdate}
            onEventCreate={handleEventCreate}
            onEventDelete={handleEventDelete}
          />
        )}
      </div>
    </div>
  )
}

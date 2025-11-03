'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarEvent, AdminCalendarEvent, BookingEvent } from '@/types/booking'
import { format } from 'date-fns'

interface UseCalendarOptions {
  view?: 'customer' | 'admin'
  productType?: string
  locationId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseCalendarReturn {
  events: CalendarEvent[] | AdminCalendarEvent[]
  loading: boolean
  error: string | null
  refreshEvents: () => Promise<void>
  updateEvent: (eventId: string, updates: Partial<BookingEvent>) => Promise<void>
  createEvent: (eventData: Partial<BookingEvent>) => Promise<void>
  deleteEvent: (eventId: string) => Promise<void>
}

export function useCalendar(
  startDate: Date,
  endDate: Date,
  options: UseCalendarOptions = {}
): UseCalendarReturn {
  const {
    view = 'customer',
    productType,
    locationId,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options

  const [events, setEvents] = useState<CalendarEvent[] | AdminCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        view,
      })

      if (productType) params.append('productType', productType)
      if (locationId) params.append('locationId', locationId)

      const response = await fetch(`/api/calendar/events?${params}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch events')
      }

      setEvents(data.events)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error fetching calendar events:', err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, view, productType, locationId])

  const refreshEvents = useCallback(async () => {
    await fetchEvents()
  }, [fetchEvents])

  const updateEvent = useCallback(async (eventId: string, updates: Partial<BookingEvent>) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update event')
      }

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, ...data.event }
            : event
        )
      )

      return data.event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event')
      throw err
    }
  }, [])

  const createEvent = useCallback(async (eventData: Partial<BookingEvent>) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create event')
      }

      // Add to local state
      setEvents(prevEvents => [...prevEvents, data.event])

      return data.event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      throw err
    }
  }, [])

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete event')
      }

      // Remove from local state
      setEvents(prevEvents => 
        prevEvents.filter(event => event.id !== eventId)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
      throw err
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchEvents, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchEvents])

  return {
    events,
    loading,
    error,
    refreshEvents,
    updateEvent,
    createEvent,
    deleteEvent,
  }
}

// Hook for managing calendar date range
export function useCalendarDateRange(initialDate = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const getDateRange = useCallback(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (view) {
      case 'day':
        end.setDate(start.getDate() + 1)
        break
      case 'week':
        start.setDate(start.getDate() - start.getDay())
        end.setDate(start.getDate() + 7)
        break
      case 'month':
      default:
        start.setDate(1)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        break
    }

    return { start, end }
  }, [currentDate, view])

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      switch (view) {
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
          break
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
          break
        case 'month':
        default:
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
          break
      }
      return newDate
    })
  }, [view])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  return {
    currentDate,
    view,
    setView,
    getDateRange,
    navigateDate,
    goToToday,
    setCurrentDate,
  }
}

// Hook for calendar filters
export function useCalendarFilters() {
  const [filters, setFilters] = useState({
    productType: '',
    locationId: '',
    status: '',
    paymentStatus: '',
  })

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      productType: '',
      locationId: '',
      status: '',
      paymentStatus: '',
    })
  }, [])

  return {
    filters,
    updateFilter,
    clearFilters,
  }
}

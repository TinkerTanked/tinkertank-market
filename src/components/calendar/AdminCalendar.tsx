'use client'

import { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { 
  AdminCalendarEvent, 
  BookingEvent, 
  BookingStatus, 
  PaymentStatus,
  getBookingStatusColor 
} from '@/types/booking'
import { Product } from '@/types/product'
import { clsx } from 'clsx'
import EventModal from './EventModal'
import CalendarControls from './CalendarControls'

interface AdminCalendarProps {
  events: AdminCalendarEvent[]
  onEventUpdate?: (eventId: string, updates: Partial<BookingEvent>) => void
  onEventCreate?: (event: Partial<BookingEvent>) => void
  onEventDelete?: (eventId: string) => void
  className?: string
}

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

export default function AdminCalendar({
  events,
  onEventUpdate,
  onEventCreate,
  onEventDelete,
  className
}: AdminCalendarProps) {
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth')
  const [selectedEvent, setSelectedEvent] = useState<AdminCalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dailyStats, setDailyStats] = useState<Record<string, any>>({})

  // Calculate daily statistics
  useEffect(() => {
    const stats: Record<string, any> = {}
    
    events.forEach(event => {
      const dateKey = event.start.toISOString().split('T')[0]
      
      if (!stats[dateKey]) {
        stats[dateKey] = {
          totalEvents: 0,
          totalBookings: 0,
          totalCapacity: 0,
          revenue: 0,
          statusCounts: {
            [BookingStatus.CONFIRMED]: 0,
            [BookingStatus.PENDING]: 0,
            [BookingStatus.CANCELLED]: 0,
            [BookingStatus.COMPLETED]: 0,
            [BookingStatus.NO_SHOW]: 0,
          }
        }
      }

      const dayStats = stats[dateKey]
      dayStats.totalEvents++
      dayStats.totalBookings += event.extendedProps.currentBookings || 0
      dayStats.totalCapacity += event.extendedProps.capacity || 0

      // Calculate revenue and status counts from bookings
      event.extendedProps.bookings?.forEach((booking: BookingEvent) => {
        dayStats.revenue += booking.amountPaid
        dayStats.statusCounts[booking.status]++
      })
    })

    setDailyStats(stats)
  }, [events])

  const handleEventClick = useCallback((info: any) => {
    const event = events.find(e => e.id === info.event.id)
    if (event) {
      setSelectedEvent(event)
      setIsModalOpen(true)
    }
  }, [events])

  const handleDateClick = useCallback((info: any) => {
    setSelectedDate(new Date(info.date))
    // Could open a "Create Event" modal here
  }, [])

  const handleEventDrop = useCallback((info: any) => {
    if (onEventUpdate) {
      const event = events.find(e => e.id === info.event.id)
      if (event) {
        onEventUpdate(info.event.id, {
          startDateTime: info.event.start,
          endDateTime: info.event.end,
        })
      }
    }
  }, [events, onEventUpdate])

  const handleEventResize = useCallback((info: any) => {
    if (onEventUpdate) {
      onEventUpdate(info.event.id, {
        endDateTime: info.event.end,
      })
    }
  }, [onEventUpdate])

  const eventContent = (eventInfo: any) => {
    const event = events.find(e => e.id === eventInfo.event.id)
    if (!event) return null

    const { currentBookings, capacity, productType, status, paymentStatus } = event.extendedProps
    const spotsLeft = capacity ? capacity - (currentBookings || 0) : 0
    const utilizationPercent = capacity ? Math.round(((currentBookings || 0) / capacity) * 100) : 0

    if (currentView === 'dayGridMonth') {
      return (
        <div className="p-1 text-xs">
          <div className="font-medium truncate">{eventInfo.event.title}</div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-600">{currentBookings || 0}/{capacity || 0}</span>
            <span className={clsx(
              'px-1 py-0.5 rounded text-xs font-medium',
              utilizationPercent >= 100 ? 'bg-red-100 text-red-800' :
              utilizationPercent >= 80 ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            )}>
              {utilizationPercent}%
            </span>
          </div>
        </div>
      )
    }

    // Time grid views (week/day)
    return (
      <div className="p-2">
        <div className="font-medium text-sm">{eventInfo.event.title}</div>
        <div className="text-xs text-gray-600 mt-1">
          <div>Students: {currentBookings || 0}/{capacity || 0}</div>
          <div>Available: {spotsLeft}</div>
          <div className="flex items-center mt-1">
            <div 
              className={clsx(
                'w-2 h-2 rounded-full mr-1',
                status === BookingStatus.CONFIRMED ? 'bg-green-500' :
                status === BookingStatus.PENDING ? 'bg-yellow-500' :
                'bg-gray-500'
              )}
            />
            <span className="capitalize">{status?.toLowerCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  const dayCellContent = (arg: any) => {
    const dateKey = arg.date.toISOString().split('T')[0]
    const dayStats = dailyStats[dateKey]

    if (!dayStats || currentView !== 'dayGridMonth') {
      return null
    }

    return (
      <div className="text-xs">
        <div className="font-medium">{arg.dayNumberText}</div>
        {dayStats.totalEvents > 0 && (
          <div className="mt-1 space-y-1">
            <div className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
              {dayStats.totalBookings}/{dayStats.totalCapacity}
            </div>
            <div className="bg-green-100 text-green-800 px-1 py-0.5 rounded">
              ${dayStats.revenue.toFixed(0)}
            </div>
          </div>
        )}
      </div>
    )
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'dayGridMonth': return 'Month View'
      case 'timeGridWeek': return 'Week View' 
      case 'timeGridDay': return 'Day View'
      default: return 'Calendar View'
    }
  }

  return (
    <div className={clsx('bg-white rounded-lg shadow', className)}>
      <CalendarControls
        currentView={currentView}
        onViewChange={setCurrentView}
        totalEvents={events.length}
        totalBookings={events.reduce((sum, e) => sum + (e.extendedProps.currentBookings || 0), 0)}
        totalCapacity={events.reduce((sum, e) => sum + (e.extendedProps.capacity || 0), 0)}
        revenue={events.reduce((sum, e) => 
          sum + (e.extendedProps.bookings?.reduce((bookingSum: number, b: BookingEvent) => 
            bookingSum + b.amountPaid, 0) || 0), 0
        )}
      />

      <div className="p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          height="600px"
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={eventContent}
          dayCellContent={currentView === 'dayGridMonth' ? dayCellContent : undefined}
          timeZone="Australia/Sydney"
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00"
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
            startTime: '08:00',
            endTime: '18:00',
          }}
          allDaySlot={false}
          nowIndicator={true}
          weekends={true}
          firstDay={1}
          eventOverlap={false}
          selectOverlap={false}
          eventResizableFromStart={true}
          dayMaxEvents={currentView === 'dayGridMonth' ? 2 : false}
          moreLinkClick="popover"
          locale="en-AU"
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
        />
      </div>

      {selectedEvent && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedEvent(null)
          }}
          event={selectedEvent}
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
        />
      )}
    </div>
  )
}

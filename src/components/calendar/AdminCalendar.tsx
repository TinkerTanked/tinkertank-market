'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { 
  AdminCalendarEvent, 
  BookingEvent, 
  BookingStatus, 
  PaymentStatus,
  getBookingStatusColor,
  getPaymentStatusColor 
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

const PRODUCT_TYPE_COLORS = {
  CAMP: {
    bg: '#3B82F6',
    border: '#2563EB',
    hover: '#1D4ED8',
    light: '#DBEAFE',
    text: '#1E40AF'
  },
  BIRTHDAY: {
    bg: '#F97316',
    border: '#EA580C',
    hover: '#C2410C',
    light: '#FFEDD5',
    text: '#C2410C'
  },
  IGNITE: {
    bg: '#8B5CF6',
    border: '#7C3AED',
    hover: '#6D28D9',
    light: '#EDE9FE',
    text: '#6D28D9'
  },
  UNKNOWN: {
    bg: '#6B7280',
    border: '#4B5563',
    hover: '#374151',
    light: '#F3F4F6',
    text: '#4B5563'
  }
}

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
  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    const stats: Record<string, any> = {}
    
    events.forEach(event => {
      const startDate = typeof event.start === 'string' ? new Date(event.start) : event.start
      const dateKey = startDate.toISOString().split('T')[0]
      
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

  const handleViewChange = useCallback((view: CalendarView) => {
    setCurrentView(view)
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.changeView(view)
    }
  }, [])

  const eventContent = (eventInfo: any) => {
    const event = events.find(e => e.id === eventInfo.event.id)
    if (!event) return null

    const { currentBookings, capacity, productType, status, paymentStatus } = event.extendedProps
    const spotsLeft = capacity ? capacity - (currentBookings || 0) : 0
    const utilizationPercent = capacity ? Math.round(((currentBookings || 0) / capacity) * 100) : 0
    const colors = PRODUCT_TYPE_COLORS[productType as keyof typeof PRODUCT_TYPE_COLORS] || PRODUCT_TYPE_COLORS.UNKNOWN

    if (currentView === 'dayGridMonth') {
      return (
        <div 
          className="px-2 py-1.5 rounded-md transition-all hover:shadow-md cursor-pointer border-l-4"
          style={{ 
            backgroundColor: colors.light,
            borderLeftColor: colors.border,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs truncate" style={{ color: colors.text }}>
                {eventInfo.event.title}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-gray-600 font-medium">
                  {currentBookings || 0}/{capacity || 0}
                </span>
                <div 
                  className={clsx(
                    'px-1.5 py-0.5 rounded text-xs font-bold',
                    utilizationPercent >= 100 ? 'bg-red-500 text-white' :
                    utilizationPercent >= 80 ? 'bg-amber-500 text-white' :
                    utilizationPercent >= 60 ? 'bg-blue-500 text-white' :
                    'bg-green-500 text-white'
                  )}
                >
                  {utilizationPercent}%
                </div>
              </div>
            </div>
            {status === BookingStatus.CONFIRMED && (
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-0.5" />
            )}
          </div>
        </div>
      )
    }

    return (
      <div 
        className="p-2 rounded-md h-full border-l-4"
        style={{ 
          backgroundColor: colors.light,
          borderLeftColor: colors.border,
        }}
      >
        <div className="font-semibold text-sm mb-1" style={{ color: colors.text }}>
          {eventInfo.event.title}
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Capacity:</span>
            <span className="font-bold text-gray-900">{currentBookings || 0}/{capacity || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Available:</span>
            <span className={clsx(
              'font-bold',
              spotsLeft === 0 ? 'text-red-600' : 
              spotsLeft <= 3 ? 'text-amber-600' : 
              'text-green-600'
            )}>
              {spotsLeft}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-300">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getBookingStatusColor(status) }}
            />
            <span className="capitalize text-gray-700 text-xs">{status?.toLowerCase()}</span>
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
        <div className="font-bold text-gray-900 mb-1">{arg.dayNumberText}</div>
        {dayStats.totalEvents > 0 && (
          <div className="space-y-1">
            <div className="bg-primary-500 text-white px-1.5 py-0.5 rounded-md text-xs font-semibold">
              {dayStats.totalBookings}/{dayStats.totalCapacity}
            </div>
            {dayStats.revenue > 0 && (
              <div className="bg-green-500 text-white px-1.5 py-0.5 rounded-md text-xs font-semibold">
                ${(dayStats.revenue / 1000).toFixed(1)}k
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={clsx('bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden', className)}>
      <CalendarControls
        currentView={currentView}
        onViewChange={handleViewChange}
        totalEvents={events.length}
        totalBookings={events.reduce((sum, e) => sum + (e.extendedProps.currentBookings || 0), 0)}
        totalCapacity={events.reduce((sum, e) => sum + (e.extendedProps.capacity || 0), 0)}
        revenue={events.reduce((sum, e) => 
          sum + (e.extendedProps.bookings?.reduce((bookingSum: number, b: BookingEvent) => 
            bookingSum + b.amountPaid, 0) || 0), 0
        )}
      />

      <div className="p-6">
        <style>{`
          .fc {
            font-family: 'Inter', sans-serif;
          }
          .fc-toolbar-title {
            font-size: 1.5rem !important;
            font-weight: 700 !important;
            color: #111827 !important;
          }
          .fc-button {
            background-color: white !important;
            border: 1px solid #D1D5DB !important;
            color: #374151 !important;
            font-weight: 600 !important;
            padding: 0.5rem 1rem !important;
            border-radius: 0.5rem !important;
            transition: all 0.2s !important;
          }
          .fc-button:hover {
            background-color: #F3F4F6 !important;
            border-color: #9CA3AF !important;
          }
          .fc-button-active {
            background-color: #0066cc !important;
            border-color: #0066cc !important;
            color: white !important;
          }
          .fc-button-active:hover {
            background-color: #0052a3 !important;
          }
          .fc-day-today {
            background-color: #EFF6FF !important;
          }
          .fc-daygrid-day-number {
            font-weight: 600 !important;
            color: #111827 !important;
            padding: 0.5rem !important;
          }
          .fc-col-header-cell {
            background-color: #F9FAFB !important;
            border: none !important;
            padding: 1rem 0.5rem !important;
          }
          .fc-col-header-cell-cushion {
            font-weight: 700 !important;
            color: #6B7280 !important;
            text-transform: uppercase !important;
            font-size: 0.75rem !important;
            letter-spacing: 0.05em !important;
          }
          .fc-scrollgrid {
            border: none !important;
            border-radius: 0.5rem !important;
            overflow: hidden !important;
          }
          .fc-daygrid-day {
            border: 1px solid #E5E7EB !important;
          }
          .fc-daygrid-day:hover {
            background-color: #F9FAFB !important;
          }
          .fc-event {
            border: none !important;
            margin: 2px !important;
            padding: 0 !important;
          }
          .fc-timegrid-slot {
            height: 3rem !important;
          }
          .fc-timegrid-slot-label {
            font-weight: 600 !important;
            color: #6B7280 !important;
          }
          .fc-more-link {
            color: #0066cc !important;
            font-weight: 600 !important;
          }
          .fc-popover {
            border-radius: 0.5rem !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          height="auto"
          contentHeight={currentView === 'dayGridMonth' ? 700 : 600}
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
            daysOfWeek: [1, 2, 3, 4, 5],
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
          dayMaxEvents={currentView === 'dayGridMonth' ? 3 : false}
          moreLinkClick="popover"
          locale="en-AU"
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
          fixedWeekCount={false}
          expandRows={true}
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

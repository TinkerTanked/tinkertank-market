'use client'

import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { CalendarEvent, BookingStatus, PaymentStatus } from '@/types/booking'
import { Product } from '@/types/product'
import { clsx } from 'clsx'
import { SparklesIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline'

interface BookingCalendarProps {
  products: Product[]
  availableEvents: CalendarEvent[]
  selectedProductType?: string
  onDateSelect: (date: Date, timeSlot?: string) => void
  onEventClick?: (event: CalendarEvent) => void
  className?: string
}

const PRODUCT_TYPE_STYLES = {
  CAMP: {
    bg: '#DBEAFE',
    border: '#3B82F6',
    text: '#1E40AF',
    icon: '🎨',
    gradient: 'from-blue-500 to-blue-600'
  },
  BIRTHDAY: {
    bg: '#FFEDD5',
    border: '#F97316',
    text: '#C2410C',
    icon: '🎉',
    gradient: 'from-orange-500 to-orange-600'
  },
  IGNITE: {
    bg: '#EDE9FE',
    border: '#8B5CF6',
    text: '#6D28D9',
    icon: '⚡',
    gradient: 'from-purple-500 to-purple-600'
  }
}

export default function BookingCalendar({
  products,
  availableEvents,
  selectedProductType,
  onDateSelect,
  onEventClick,
  className
}: BookingCalendarProps) {
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([])
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    let events = availableEvents

    if (selectedProductType) {
      events = events.filter(
        (event) => event.extendedProps.productType === selectedProductType
      )
    }

    events = events.filter((event) => {
      const { capacity, currentBookings } = event.extendedProps
      return !capacity || !currentBookings || currentBookings < capacity
    })

    setFilteredEvents(events)
  }, [availableEvents, selectedProductType])

  const handleDateClick = (info: any) => {
    const clickedDate = new Date(info.date)
    
    if (selectedProductType === 'CAMP') {
      const dayOfWeek = clickedDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return
      }
    }

    onDateSelect(clickedDate)
  }

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      const event = filteredEvents.find(e => e.id === info.event.id)
      if (event) {
        onEventClick(event)
      }
    }
  }

  const dayCellClassNames = (arg: any) => {
    const date = new Date(arg.date)
    const dayOfWeek = date.getDay()
    
    if (selectedProductType === 'CAMP' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return ['bg-gray-100', 'text-gray-400', 'cursor-not-allowed', 'opacity-50']
    }

    const dateKey = arg.date.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
    const dayEvents = filteredEvents.filter(event => {
      const eventKey = new Date(event.start).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
      return eventKey === dateKey
    })

    if (dayEvents.length > 0) {
      const style = PRODUCT_TYPE_STYLES[selectedProductType as keyof typeof PRODUCT_TYPE_STYLES]
      if (style) {
        return ['cursor-pointer', 'hover:shadow-inner', 'transition-all']
      }
      return ['bg-blue-50', 'cursor-pointer', 'hover:bg-blue-100', 'transition-all']
    }

    return ['cursor-pointer', 'hover:bg-gray-50', 'transition-all']
  }

  const eventContent = (eventInfo: any) => {
    const { capacity, currentBookings, productType } = eventInfo.event.extendedProps
    const spotsLeft = capacity ? capacity - (currentBookings || 0) : null
    const utilizationPercent = capacity ? Math.round(((currentBookings || 0) / capacity) * 100) : 0
    const isHovered = hoveredEvent === eventInfo.event.id
    const style = PRODUCT_TYPE_STYLES[productType as keyof typeof PRODUCT_TYPE_STYLES]

    if (!style) return null

    return (
      <div 
        className={clsx(
          'px-2.5 py-2 rounded-lg transition-all border-l-4 cursor-pointer',
          isHovered && 'shadow-md transform scale-105'
        )}
        style={{ 
          backgroundColor: style.bg,
          borderLeftColor: style.border
        }}
        onMouseEnter={() => setHoveredEvent(eventInfo.event.id)}
        onMouseLeave={() => setHoveredEvent(null)}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{style.icon}</span>
          <div className="font-semibold text-xs truncate" style={{ color: style.text }}>
            {eventInfo.event.title}
          </div>
        </div>
        {spotsLeft !== null && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-3 w-3 text-gray-500" />
              <span className={clsx(
                'text-xs font-bold',
                spotsLeft === 0 ? 'text-red-600' : 
                spotsLeft <= 3 ? 'text-amber-600' : 
                'text-green-600'
              )}>
                {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
              </span>
            </div>
            <div 
              className={clsx(
                'px-1.5 py-0.5 rounded text-xs font-bold text-white',
                utilizationPercent >= 90 ? 'bg-red-500' :
                utilizationPercent >= 70 ? 'bg-amber-500' :
                'bg-green-500'
              )}
            >
              {utilizationPercent}%
            </div>
          </div>
        )}
      </div>
    )
  }

  const dayCellContent = (arg: any) => {
    const date = new Date(arg.date)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isToday = arg.isToday

    const dateKey = arg.date.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
    const dayEvents = filteredEvents.filter(event => {
      const eventKey = new Date(event.start).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
      return eventKey === dateKey
    })

    return (
      <div className="relative">
        <div className={clsx(
          'font-bold text-sm p-1',
          isToday && 'bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto',
          !isToday && isWeekend && selectedProductType === 'CAMP' && 'text-gray-400',
          !isToday && !isWeekend && 'text-gray-900'
        )}>
          {arg.dayNumberText}
        </div>
        {dayEvents.length > 0 && !isToday && (
          <div className="absolute top-0 right-1">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={clsx('bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden', className)}>
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-bold">Select Your Date</h3>
            <p className="text-sm text-primary-100 mt-1">Choose an available time slot</p>
          </div>
          <SparklesIcon className="h-8 w-8 text-primary-200" />
        </div>
      </div>

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
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          }
          .fc-button:hover {
            background-color: #F3F4F6 !important;
            border-color: #9CA3AF !important;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1) !important;
          }
          .fc-button-active {
            background-color: #0066cc !important;
            border-color: #0066cc !important;
            color: white !important;
          }
          .fc-day-today {
            background-color: #EFF6FF !important;
          }
          .fc-col-header-cell {
            background-color: #F9FAFB !important;
            border: none !important;
            padding: 1rem 0.5rem !important;
          }
          .fc-col-header-cell-cushion {
            font-weight: 700 !important;
            color: #374151 !important;
            text-transform: uppercase !important;
            font-size: 0.75rem !important;
            letter-spacing: 0.05em !important;
          }
          .fc-scrollgrid {
            border: none !important;
          }
          .fc-daygrid-day {
            border: 1px solid #E5E7EB !important;
          }
          .fc-event {
            border: none !important;
            margin: 2px !important;
            padding: 0 !important;
          }
          .fc-daygrid-day-frame {
            min-height: 120px !important;
            padding: 4px !important;
          }
          .fc-more-link {
            color: #0066cc !important;
            font-weight: 600 !important;
            background-color: #EFF6FF !important;
            padding: 0.25rem 0.5rem !important;
            border-radius: 0.375rem !important;
            margin-top: 0.25rem !important;
          }
          .fc-popover {
            border-radius: 0.75rem !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            border: 1px solid #E5E7EB !important;
          }
          .fc-popover-header {
            background-color: #F9FAFB !important;
            padding: 1rem !important;
            font-weight: 700 !important;
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          contentHeight={650}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={filteredEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          dayCellClassNames={dayCellClassNames}
          dayCellContent={dayCellContent}
          eventContent={eventContent}
          timeZone="Australia/Sydney"
          firstDay={1}
          weekends={selectedProductType !== 'CAMP'}
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventOverlap={false}
          selectOverlap={false}
          unselectAuto={true}
          nowIndicator={true}
          dayHeaders={true}
          fixedWeekCount={false}
          showNonCurrentDates={false}
          buttonText={{
            today: 'Today',
            month: 'Month'
          }}
          locale="en-AU"
          validRange={{
            start: new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
          }}
        />
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(PRODUCT_TYPE_STYLES).map(([type, style]) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border-2"
                style={{ 
                  backgroundColor: style.bg,
                  borderColor: style.border
                }}
              />
              <span className="text-xs font-medium text-gray-700">
                {style.icon} {type.charAt(0) + type.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

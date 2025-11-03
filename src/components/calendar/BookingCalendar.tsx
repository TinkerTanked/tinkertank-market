'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { CalendarEvent, BookingStatus, PaymentStatus } from '@/types/booking'
import { Product } from '@/types/product'
import { clsx } from 'clsx'

interface BookingCalendarProps {
  products: Product[]
  availableEvents: CalendarEvent[]
  selectedProductType?: string
  onDateSelect: (date: Date, timeSlot?: string) => void
  onEventClick?: (event: CalendarEvent) => void
  className?: string
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

  useEffect(() => {
    let events = availableEvents

    // Filter by product type if selected
    if (selectedProductType) {
      events = events.filter(
        (event) => event.extendedProps.productType === selectedProductType
      )
    }

    // Only show available events (not fully booked)
    events = events.filter((event) => {
      const { capacity, currentBookings } = event.extendedProps
      return !capacity || !currentBookings || currentBookings < capacity
    })

    setFilteredEvents(events)
  }, [availableEvents, selectedProductType])

  const handleDateClick = (info: any) => {
    const clickedDate = new Date(info.date)
    
    // Check if it's a weekend and we're looking at camps
    if (selectedProductType === 'CAMP') {
      const dayOfWeek = clickedDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return // Don't allow weekend selection for camps
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
    
    // Disable weekends for camps
    if (selectedProductType === 'CAMP' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return ['bg-gray-100', 'text-gray-400', 'cursor-not-allowed']
    }

    // Check if this date has available spots
    const dayEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === date.toDateString()
    })

    if (dayEvents.length > 0) {
      return ['bg-blue-50', 'cursor-pointer', 'hover:bg-blue-100']
    }

    return ['cursor-pointer', 'hover:bg-gray-50']
  }

  const eventContent = (eventInfo: any) => {
    const { capacity, currentBookings, productType } = eventInfo.event.extendedProps
    const spotsLeft = capacity ? capacity - (currentBookings || 0) : null

    return (
      <div className="p-1 text-xs">
        <div className="font-medium truncate">{eventInfo.event.title}</div>
        {spotsLeft !== null && (
          <div className="text-gray-600">
            {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={clsx('bg-white rounded-lg shadow', className)}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="600px"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth'
        }}
        events={filteredEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        dayCellClassNames={dayCellClassNames}
        eventContent={eventContent}
        timeZone="Australia/Sydney"
        firstDay={1} // Start week on Monday
        weekends={selectedProductType !== 'CAMP'} // Hide weekends for camps
        eventDisplay="block"
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventOverlap={false}
        selectOverlap={false}
        unselectAuto={true}
        eventColor="#3B82F6"
        eventTextColor="#FFFFFF"
        nowIndicator={true}
        dayHeaders={true}
        fixedWeekCount={false}
        showNonCurrentDates={false}
        aspectRatio={1.35}
        contentHeight="auto"
        buttonText={{
          today: 'Today',
          month: 'Month'
        }}
        locale="en-AU"
        validRange={{
          start: new Date().toISOString().split('T')[0] // No past dates
        }}
      />
    </div>
  )
}

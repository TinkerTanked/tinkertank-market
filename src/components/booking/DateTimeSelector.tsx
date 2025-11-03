'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'

interface DateTimeSelectorProps {
  productId: string
  onDateSelect: (date: Date, timeSlot: string) => void
  selectedDate: Date | null
  selectedTimeSlot: string | null
}

export default function DateTimeSelector({ 
  productId, 
  onDateSelect, 
  selectedDate, 
  selectedTimeSlot 
}: DateTimeSelectorProps) {
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])

  // Generate next 30 days (excluding weekends for camps)
  useEffect(() => {
    const dates: Date[] = []
    const today = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // For camps, skip weekends
      if (productId.includes('camp')) {
        const dayOfWeek = date.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) continue
      }
      
      dates.push(date)
    }
    
    setAvailableDates(dates)
  }, [productId])

  // Generate time slots based on product type
  useEffect(() => {
    if (productId.includes('camp')) {
      if (productId.includes('day-camp')) {
        setAvailableTimeSlots(['9:00 AM - 3:00 PM'])
      } else if (productId.includes('all-day-camp')) {
        setAvailableTimeSlots(['8:00 AM - 5:00 PM'])
      }
    } else if (productId.includes('birthday')) {
      setAvailableTimeSlots([
        '10:00 AM - 12:00 PM',
        '1:00 PM - 3:00 PM',
        '3:30 PM - 5:30 PM'
      ])
    } else {
      // Subscriptions - weekly time slots
      setAvailableTimeSlots([
        'Monday 4:00 PM - 5:00 PM',
        'Tuesday 4:00 PM - 5:00 PM',
        'Wednesday 4:00 PM - 5:00 PM',
        'Thursday 4:00 PM - 5:00 PM',
        'Friday 4:00 PM - 5:00 PM',
        'Saturday 9:00 AM - 10:00 AM',
        'Saturday 10:30 AM - 11:30 AM'
      ])
    }
  }, [productId])

  const handleDateSelect = (date: Date) => {
    if (selectedTimeSlot) {
      onDateSelect(date, selectedTimeSlot)
    }
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    if (selectedDate) {
      onDateSelect(selectedDate, timeSlot)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className='space-y-8'>
      {/* Date Selection */}
      <div className='space-y-4'>
        <div className='flex items-center space-x-2'>
          <CalendarIcon className='w-5 h-5 text-primary-500' />
          <h3 className='font-display font-semibold text-lg text-gray-900'>
            Select Date
          </h3>
        </div>
        
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3'>
          {availableDates.slice(0, 20).map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(date)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                selectedDate?.toDateString() === date.toDateString()
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className='text-sm font-medium'>
                {formatDate(date)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      <div className='space-y-4'>
        <div className='flex items-center space-x-2'>
          <ClockIcon className='w-5 h-5 text-primary-500' />
          <h3 className='font-display font-semibold text-lg text-gray-900'>
            Select Time
          </h3>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {availableTimeSlots.map((timeSlot, index) => (
            <button
              key={index}
              onClick={() => handleTimeSlotSelect(timeSlot)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedTimeSlot === timeSlot
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className='font-medium'>
                {timeSlot}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                Available
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedDate && selectedTimeSlot && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2'>
            <span className='text-green-500'>✓</span>
            <span className='font-medium text-green-800'>
              Selected: {formatDate(selectedDate)} at {selectedTimeSlot}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

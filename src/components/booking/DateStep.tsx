'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWeekend,
  isBefore,
  startOfDay
} from 'date-fns'

interface Location {
  id: string
  name: string
  address: string
}

interface DateStepProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  location: Location | null
}

export default function DateStep({ selectedDate, onDateSelect, location }: DateStepProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = startOfDay(new Date())

  // 🔍 DEBUG LOGGING
  console.log('🔍 DateStep component rendering with props:', {
    selectedDate,
    location,
    currentMonth,
    today
  })

  const goToPreviousMonth = () => {
    console.log('🔍 Going to previous month from:', currentMonth)
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    console.log('🔍 Going to next month from:', currentMonth)
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDateClick = (date: Date) => {
    console.log('🔍 Date clicked:', date, {
      isWeekend: isWeekend(date),
      isBefore: isBefore(date, today),
      isValid: !isWeekend(date) && !isBefore(date, today)
    })
    
    // Only allow weekdays and future/today dates
    if (!isWeekend(date) && !isBefore(date, today)) {
      console.log('✅ Valid date selected, calling onDateSelect')
      onDateSelect(date)
    } else {
      console.log('❌ Invalid date clicked - blocked')
    }
  }

  const getDayClassName = (date: Date) => {
    const baseClasses = 'relative h-12 flex items-center justify-center text-sm font-medium rounded-lg transition-colors duration-200'
    
    // Past dates
    if (isBefore(date, today)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed bg-gray-50`
    }
    
    // Weekends
    if (isWeekend(date)) {
      return `${baseClasses} bg-gray-100 text-gray-500 cursor-not-allowed`
    }
    
    // Selected date
    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-blue-500 text-white shadow-lg cursor-pointer`
    }
    
    // Available weekdays
    return `${baseClasses} hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-gray-900`
  }

  const formatSelectedDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const calendarDays = eachDayOfInterval({ 
    start: calendarStart, 
    end: calendarEnd 
  })

  // 🔍 DEBUG CALENDAR GENERATION
  console.log('🔍 Calendar generation:', {
    monthStart,
    monthEnd,
    calendarStart,
    calendarEnd,
    calendarDays: calendarDays.length,
    firstDay: calendarDays[0],
    lastDay: calendarDays[calendarDays.length - 1]
  })

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6" style={{ padding: '20px', border: '3px solid green' }}>
      {/* 🔍 DEBUG: Component is rendering */}
      <div 
        className="text-center space-y-2"
        style={{ backgroundColor: '#f0f8ff', padding: '10px', border: '2px solid blue' }}
      >
        <h3 className="text-2xl font-bold text-gray-900" style={{ color: 'red', fontSize: '24px' }}>
          🔍 DEBUG: Choose Your Date
        </h3>
        <p className="text-gray-600" style={{ color: 'black', fontSize: '16px' }}>
          Select a weekday for your STEM camp at {location?.name || 'your chosen location'}
        </p>
        <div style={{ backgroundColor: 'yellow', padding: '10px', margin: '10px 0' }}>
          <strong>🔍 DEBUG INFO:</strong> Component mounted successfully!
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Selected Date</h4>
              <p className="text-blue-700">{formatSelectedDate(selectedDate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Calendar */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Week Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-xs font-medium text-gray-500 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div 
          className="grid grid-cols-7 gap-px bg-gray-200"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '1px',
            backgroundColor: '#e5e7eb'
          }}
        >
          {calendarDays.map((date, index) => {
            console.log(`🔍 Rendering calendar day ${index}:`, date, format(date, 'd'))
            return (
              <div 
                key={date.toString()} 
                className="bg-white min-h-[48px] flex items-center justify-center relative"
                style={{
                  backgroundColor: 'white',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  border: '1px solid red' // DEBUG: Visual border
                }}
              >
                <button
                  onClick={() => handleDateClick(date)}
                  className={getDayClassName(date)}
                  disabled={isWeekend(date) || isBefore(date, today)}
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '8px',
                    border: '1px solid blue', // DEBUG: Button border
                    backgroundColor: isWeekend(date) ? '#f3f4f6' : 'white',
                    color: isWeekend(date) ? '#6b7280' : '#111827',
                    cursor: isWeekend(date) || isBefore(date, today) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span 
                    className={`${!isSameMonth(date, currentMonth) ? 'text-gray-300' : ''}`}
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: !isSameMonth(date, currentMonth) ? '#d1d5db' : 'inherit'
                    }}
                  >
                    {format(date, 'd')}
                  </span>
                  
                  {/* Weekend "Closed" label */}
                  {isWeekend(date) && isSameMonth(date, currentMonth) && (
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{
                        position: 'absolute',
                        inset: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span 
                        className="text-xs text-gray-500 font-medium mt-4"
                        style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          fontWeight: '500',
                          marginTop: '16px'
                        }}
                      >
                        Closed
                      </span>
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
          <span className="text-gray-600">Weekends (Closed)</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-lg">📅</span>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Camp Schedule</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Camps run Monday to Friday only</li>
              <li>• Book up to 3 months in advance</li>
              <li>• Each camp is limited to 12 participants</li>
              <li>• Cancellation available up to 48 hours before</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

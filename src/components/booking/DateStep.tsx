'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline'
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
import { isClosureDate, getClosureInfo } from '@/types'

interface Location {
  id: string
  name: string
  address: string
}

interface DateStepProps {
  selectedDate: Date | null
  selectedDates?: Date[]
  onDateSelect: (date: Date) => void
  onDatesSelect?: (dates: Date[]) => void
  location: Location | null
  enableMultiSelect?: boolean
}

export default function DateStep({ 
  selectedDate, 
  selectedDates = [],
  onDateSelect, 
  onDatesSelect,
  location,
  enableMultiSelect = true
}: DateStepProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [internalSelectedDates, setInternalSelectedDates] = useState<Date[]>(selectedDates)
  const today = startOfDay(new Date())

  useEffect(() => {
    setInternalSelectedDates(selectedDates)
  }, [selectedDates])

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const isDateSelected = (date: Date) => {
    return internalSelectedDates.some(selectedDate => isSameDay(selectedDate, date))
  }

  const handleDateClick = (date: Date) => {
    if (!isWeekend(date) && !isBefore(date, today) && !isClosureDate(date)) {
      if (enableMultiSelect) {
        let newSelectedDates: Date[]
        
        if (isDateSelected(date)) {
          newSelectedDates = internalSelectedDates.filter(d => !isSameDay(d, date))
        } else {
          newSelectedDates = [...internalSelectedDates, date].sort((a, b) => a.getTime() - b.getTime())
        }
        
        setInternalSelectedDates(newSelectedDates)
        
        if (onDatesSelect) {
          onDatesSelect(newSelectedDates)
        }
        
        if (newSelectedDates.length > 0 && onDateSelect) {
          onDateSelect(newSelectedDates[0])
        }
      } else {
        onDateSelect(date)
      }
    }
  }

  const clearAllDates = () => {
    setInternalSelectedDates([])
    if (onDatesSelect) {
      onDatesSelect([])
    }
  }

  const getDayClassName = (date: Date) => {
    const baseClasses = 'relative h-12 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200'
    
    if (isBefore(date, today)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed bg-gray-50`
    }
    
    if (isWeekend(date)) {
      return `${baseClasses} bg-gray-100 text-gray-500 cursor-not-allowed`
    }
    
    if (isClosureDate(date)) {
      return `${baseClasses} bg-red-50 text-red-500 cursor-not-allowed`
    }
    
    if (isDateSelected(date)) {
      return `${baseClasses} bg-blue-500 text-white shadow-lg cursor-pointer hover:bg-blue-600`
    }
    
    return `${baseClasses} hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-gray-900`
  }

  const formatSelectedDate = (date: Date) => {
    return format(date, 'EEE, MMM d')
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const calendarDays = eachDayOfInterval({ 
    start: calendarStart, 
    end: calendarEnd 
  })

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">
          {enableMultiSelect ? 'Choose Your Dates' : 'Choose Your Date'}
        </h3>
        <p className="text-gray-600">
          {enableMultiSelect 
            ? `Select one or more weekdays for your STEM camp at ${location?.name || 'your chosen location'}`
            : `Select a weekday for your STEM camp at ${location?.name || 'your chosen location'}`
          }
        </p>
      </div>

      {enableMultiSelect && internalSelectedDates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">
                    {internalSelectedDates.length} {internalSelectedDates.length === 1 ? 'Date' : 'Dates'} Selected
                  </h4>
                  <button
                    onClick={clearAllDates}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {internalSelectedDates.map((date, index) => (
                    <div 
                      key={index}
                      className="inline-flex items-center bg-white border border-blue-200 rounded-md px-3 py-1.5 text-sm text-blue-700"
                    >
                      <CheckIcon className="w-4 h-4 mr-1.5 text-blue-500" />
                      {formatSelectedDate(date)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!enableMultiSelect && selectedDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Selected Date</h4>
              <p className="text-blue-700">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-xs font-medium text-gray-500 uppercase">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {calendarDays.map((date, index) => (
            <div 
              key={date.toString()} 
              className="bg-white min-h-[48px] flex items-center justify-center relative"
            >
              <button
                onClick={() => handleDateClick(date)}
                className={getDayClassName(date)}
                disabled={isWeekend(date) || isBefore(date, today) || isClosureDate(date)}
                title={
                  isClosureDate(date) 
                    ? `Closed: ${getClosureInfo(date)?.name || 'Business closure'}` 
                    : isWeekend(date) 
                    ? 'Weekends are not available' 
                    : isBefore(date, today) 
                    ? 'Past date' 
                    : undefined
                }
              >
                <span className={`${!isSameMonth(date, currentMonth) ? 'text-gray-300' : ''}`}>
                  {format(date, 'd')}
                </span>
                
                {isDateSelected(date) && isSameMonth(date, currentMonth) && (
                  <div className="absolute top-1 right-1">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {isWeekend(date) && isSameMonth(date, currentMonth) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500 font-medium mt-4">
                      Closed
                    </span>
                  </div>
                )}
                
                {isClosureDate(date) && isSameMonth(date, currentMonth) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-red-500 font-medium mt-4">
                      Closed
                    </span>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
            <CheckIcon className="w-3 h-3 text-white" />
          </div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
          <span className="text-gray-600">Weekends (Closed)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
          <span className="text-gray-600">Public Holidays (Closed)</span>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-lg">📅</span>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Camp Schedule</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Camps run Monday to Friday only</li>
              {enableMultiSelect && <li>• Select multiple dates for multi-day bookings</li>}
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

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
  getDay,
  isBefore,
  startOfDay
} from 'date-fns'
import { isClosureDate, getClosureInfo } from '@/types'

interface Location {
  id: string
  name: string
  address: string
}

interface BirthdayDateStepProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  location: Location | null
}

export default function BirthdayDateStep({ 
  selectedDate, 
  onDateSelect, 
  location
}: BirthdayDateStepProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = startOfDay(new Date())

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const isFridayOrSaturday = (date: Date): boolean => {
    const dayOfWeek = getDay(date)
    return dayOfWeek === 5 || dayOfWeek === 6
  }

  const isDateAvailable = (date: Date): boolean => {
    if (isBefore(date, today)) return false
    if (!isFridayOrSaturday(date)) return false
    if (isClosureDate(date)) return false
    return true
  }

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      onDateSelect(date)
    }
  }

  const getDayClassName = (date: Date) => {
    const baseClasses = 'relative h-12 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200'
    
    if (isBefore(date, today)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed bg-gray-50`
    }
    
    if (!isFridayOrSaturday(date)) {
      return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`
    }
    
    if (isClosureDate(date)) {
      return `${baseClasses} bg-red-50 text-red-500 cursor-not-allowed`
    }
    
    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-purple-500 text-white shadow-lg cursor-pointer hover:bg-purple-600`
    }
    
    return `${baseClasses} hover:bg-purple-50 hover:text-purple-700 cursor-pointer text-gray-900 bg-purple-50/50 border border-purple-200`
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
        <h3 className="text-2xl font-bold text-gray-900">Choose Your Party Date</h3>
        <p className="text-gray-600">
          Birthday parties are available on Fridays and Saturdays at {location?.name || 'TinkerTank'}
        </p>
      </div>

      {selectedDate && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-purple-900">Selected Date</h4>
              <p className="text-purple-700">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
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
          {weekDays.map((day, index) => (
            <div 
              key={day} 
              className={`p-3 text-center text-xs font-medium uppercase ${
                index === 4 || index === 5 ? 'text-purple-600 bg-purple-50' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {calendarDays.map((date) => (
            <div 
              key={date.toString()} 
              className="bg-white min-h-[48px] flex items-center justify-center relative"
            >
              <button
                onClick={() => handleDateClick(date)}
                className={getDayClassName(date)}
                disabled={!isDateAvailable(date)}
                title={
                  isClosureDate(date) 
                    ? `Closed: ${getClosureInfo(date)?.name || 'Business closure'}` 
                    : !isFridayOrSaturday(date) 
                    ? 'Parties available Fri & Sat only' 
                    : isBefore(date, today) 
                    ? 'Past date' 
                    : undefined
                }
              >
                <span className={`${!isSameMonth(date, currentMonth) ? 'text-gray-300' : ''}`}>
                  {format(date, 'd')}
                </span>
                
                {selectedDate && isSameDay(date, selectedDate) && isSameMonth(date, currentMonth) && (
                  <div className="absolute top-1 right-1">
                    <CheckIcon className="w-4 h-4 text-white" />
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
          <div className="w-4 h-4 bg-purple-50 border border-purple-200 rounded"></div>
          <span className="text-gray-600">Available (Fri & Sat)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
            <CheckIcon className="w-3 h-3 text-white" />
          </div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
          <span className="text-gray-600">Not Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
          <span className="text-gray-600">Closed</span>
        </div>
      </div>

      <div className="bg-purple-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-purple-600 text-lg">🎂</span>
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-1">Party Schedule</h4>
            <ul className="text-purple-800 text-sm space-y-1">
              <li>• Parties available Fridays and Saturdays only</li>
              <li>• Book up to 3 months in advance</li>
              <li>• 2-hour party duration</li>
              <li>• Up to 12 children per party</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

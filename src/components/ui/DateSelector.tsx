'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  isWeekend,
  isBefore,
  startOfDay,
  setMonth,
  setYear,
  getMonth,
  getYear
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface DateSelectorProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_RANGE = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR + i)

export default function DateSelector({ 
  selectedDate, 
  onDateSelect, 
  minDate = new Date(),
  maxDate,
  className = ''
}: DateSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = monthStart
    const endDate = monthEnd

    // Get all days in the month
    const monthDays = eachDayOfInterval({ start: startDate, end: endDate })

    // Add empty cells for days from previous month to align with week start
    const startPadding = getDay(monthStart)
    const paddingDays = Array(startPadding).fill(null)

    return [...paddingDays, ...monthDays]
  }, [currentMonth])

  // Check if date is selectable
  const isDateSelectable = useCallback((date: Date) => {
    if (isWeekend(date)) return false
    if (isBefore(startOfDay(date), startOfDay(minDate))) return false
    if (maxDate && isBefore(startOfDay(maxDate), startOfDay(date))) return false
    return true
  }, [minDate, maxDate])

  // Handle date click
  const handleDateClick = useCallback((date: Date) => {
    if (isDateSelectable(date)) {
      onDateSelect(date)
    }
  }, [isDateSelectable, onDateSelect])

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }, [])

  const handleMonthSelect = useCallback((monthIndex: number) => {
    setCurrentMonth(prev => setMonth(prev, monthIndex))
    setIsMonthDropdownOpen(false)
  }, [])

  const handleYearSelect = useCallback((year: number) => {
    setCurrentMonth(prev => setYear(prev, year))
    setIsYearDropdownOpen(false)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, date: Date) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleDateClick(date)
    }
  }, [handleDateClick])

  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 shadow-sm p-4', className)}>
      {/* Header with month/year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center space-x-2">
          {/* Month dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className="px-3 py-1 text-lg font-semibold text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS[getMonth(currentMonth)]}
            </button>
            
            {isMonthDropdownOpen && (
              <div className="absolute top-full left-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {MONTHS.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className="block w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-md last:rounded-b-md focus:outline-none focus:bg-blue-50"
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="px-3 py-1 text-lg font-semibold text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getYear(currentMonth)}
            </button>
            
            {isYearDropdownOpen && (
              <div className="absolute top-full left-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {YEAR_RANGE.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className="block w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-md last:rounded-b-md focus:outline-none focus:bg-blue-50"
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next month"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-10" />
          }

          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isCurrentDay = isToday(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelectable = isDateSelectable(day)
          const isWeekendDay = isWeekend(day)
          const isPastDate = isBefore(startOfDay(day), startOfDay(minDate))

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              onKeyDown={(e) => handleKeyDown(e, day)}
              disabled={!isSelectable}
              className={clsx(
                'h-10 w-10 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none',
                {
                  // Base styles
                  'text-gray-400': !isCurrentMonth,
                  'text-gray-900': isCurrentMonth && isSelectable,
                  
                  // Selected state
                  'bg-blue-600 text-white shadow-md': isSelected && isSelectable,
                  'hover:bg-blue-700': isSelected && isSelectable,
                  
                  // Today indicator
                  'ring-2 ring-blue-200': isCurrentDay && !isSelected && isSelectable,
                  
                  // Hover states
                  'hover:bg-blue-50 hover:text-blue-700': !isSelected && isSelectable && isCurrentMonth,
                  
                  // Disabled states
                  'cursor-not-allowed opacity-40': !isSelectable,
                  'bg-gray-100 text-gray-400': isWeekendDay && isCurrentMonth,
                  'text-gray-300': isPastDate && isCurrentMonth,
                  
                  // Focus states
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-1': isSelectable,
                }
              )}
              aria-label={`${format(day, 'MMMM d, yyyy')}${isSelected ? ' (selected)' : ''}${!isSelectable ? ' (unavailable)' : ''}`}
              aria-disabled={!isSelectable}
              tabIndex={isSelectable ? 0 : -1}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-blue-200 rounded-sm"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <span>Weekend</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded-sm opacity-40"></div>
            <span>Past</span>
          </div>
        </div>
      </div>
    </div>
  )
}

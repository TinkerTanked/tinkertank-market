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
import { isDateAvailableForLocation, getLocationAvailability } from '@/data/locationAvailability'

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
  maxDateCount?: number
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DateStep({ 
  selectedDate, 
  selectedDates = [],
  onDateSelect, 
  onDatesSelect,
  location,
  enableMultiSelect = true,
  maxDateCount
}: DateStepProps) {
  // Start calendar on the first available date for locations with limited availability
  const getInitialMonth = () => {
    if (!location) return new Date()
    const availability = getLocationAvailability(location.name)
    if (availability?.availableDates && availability.availableDates.length > 0) {
      const first = availability.availableDates[0]
      const [y, m] = first.split('-').map(Number)
      return new Date(y, m - 1, 1)
    }
    return new Date()
  }
  
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth())
  const [internalSelectedDates, setInternalSelectedDates] = useState<Date[]>(selectedDates)
  const [soldOutDates, setSoldOutDates] = useState<Set<string>>(new Set())
  const [dailyCapacity, setDailyCapacity] = useState<number | null>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const today = startOfDay(new Date())

  useEffect(() => {
    setInternalSelectedDates(selectedDates)
  }, [selectedDates])
  
  // Update calendar month when location changes
  useEffect(() => {
    if (!location) return
    const availability = getLocationAvailability(location.name)
    if (availability?.availableDates && availability.availableDates.length > 0) {
      const first = availability.availableDates[0]
      const [y, m] = first.split('-').map(Number)
      setCurrentMonth(new Date(y, m - 1, 1))
    }
  }, [location?.id, location?.name])

  // Fetch sold-out information when location changes
  useEffect(() => {
    if (!location) {
      setSoldOutDates(new Set())
      setDailyCapacity(null)
      return
    }

    const availability = getLocationAvailability(location.name)
    if (!availability?.dailyCapacity) {
      setSoldOutDates(new Set())
      setDailyCapacity(null)
      return
    }

    let cancelled = false
    setLoadingAvailability(true)
    fetch(`/api/availability?locationId=${encodeURIComponent(availability.locationId)}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data?.success && Array.isArray(data.dates)) {
          const sold = new Set<string>(
            data.dates.filter((d: { soldOut?: boolean }) => d.soldOut).map((d: { date: string }) => d.date)
          )
          setSoldOutDates(sold)
          setDailyCapacity(data.dailyCapacity ?? null)
        }
      })
      .catch(err => {
        console.error('Failed to load availability:', err)
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false)
      })

    return () => {
      cancelled = true
    }
  }, [location?.id, location?.name])

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const isDateSelected = (date: Date) => {
    return internalSelectedDates.some(selectedDate => isSameDay(selectedDate, date))
  }

  const isDateSoldOut = (date: Date) => {
    return soldOutDates.has(toLocalDateString(date))
  }

  const handleDateClick = (date: Date) => {
    // Always block weekends first
    if (isWeekend(date)) {
      console.warn('Weekend date blocked:', date)
      return
    }

    if (isDateSoldOut(date)) {
      return
    }
    
    const isAvailable = location ? isDateAvailableForLocation(date, location.name) : true
    if (!isBefore(date, today) && !isClosureDate(date) && isAvailable) {
      if (enableMultiSelect) {
        let newSelectedDates: Date[]
        
        if (isDateSelected(date)) {
          newSelectedDates = internalSelectedDates.filter(d => !isSameDay(d, date))
        } else {
          // If maxDateCount is set and we've reached the limit, don't add more
          if (maxDateCount && internalSelectedDates.length >= maxDateCount) {
            return
          }
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
    const baseClasses = 'relative flex h-12 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors sm:h-14'
    
    if (isBefore(date, today)) {
      return `${baseClasses} cursor-not-allowed text-slate-300`
    }
    
    if (isWeekend(date)) {
      return `${baseClasses} cursor-not-allowed text-slate-400`
    }
    
    if (isClosureDate(date)) {
      return `${baseClasses} cursor-not-allowed bg-red-50 text-red-400`
    }
    
    if (location && !isDateAvailableForLocation(date, location.name)) {
      return `${baseClasses} cursor-not-allowed text-slate-300`
    }

    if (isDateSoldOut(date)) {
      return `${baseClasses} cursor-not-allowed bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200`
    }
    
    if (isDateSelected(date)) {
      return `${baseClasses} cursor-pointer bg-primary-700 text-white shadow-sm hover:bg-primary-800`
    }
    
    return `${baseClasses} cursor-pointer text-slate-800 hover:bg-primary-50 hover:text-primary-800`
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          {enableMultiSelect ? 'Choose Your Dates' : 'Choose Your Date'}
        </h3>
        <p className="text-slate-600">
          {maxDateCount 
            ? `Select 1-${maxDateCount} days for your camp at ${location?.name || 'your chosen location'}`
            : enableMultiSelect 
              ? `Select one or more weekdays for your STEAM camp at ${location?.name || 'your chosen location'}`
              : `Select a weekday for your STEAM camp at ${location?.name || 'your chosen location'}`
          }
        </p>
        {dailyCapacity != null && (
          <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {loadingAvailability ? 'Checking availability…' : `${dailyCapacity} places per day`}
          </div>
        )}
        {maxDateCount && internalSelectedDates.length === maxDateCount && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✓ 3-Day Bundle pricing available!
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3 sm:px-5">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="grid h-10 w-10 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <h4 className="text-base font-bold text-slate-950 sm:text-lg">
            {format(currentMonth, 'MMMM yyyy')}
          </h4>
          
          <button
            type="button"
            onClick={goToNextMonth}
            className="grid h-10 w-10 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 px-2 pt-3 sm:px-4">
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
              <span className="sm:hidden">{day.slice(0, 1)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-2 pt-0 sm:gap-2 sm:p-4 sm:pt-0">
          {calendarDays.map((date) => {
            const soldOut = isDateSoldOut(date)
            const unavailable = !!location && !isDateAvailableForLocation(date, location.name)
            return (
              <button
                type="button"
                key={date.toString()}
                onClick={() => handleDateClick(date)}
                className={getDayClassName(date)}
                disabled={isWeekend(date) || isBefore(date, today) || isClosureDate(date) || soldOut || unavailable}
                aria-pressed={isDateSelected(date)}
                aria-label={`${format(date, 'EEEE, d MMMM yyyy')}${soldOut ? ', sold out' : ''}`}
                title={
                  soldOut
                    ? 'Sold out — no spaces available on this date'
                    : isClosureDate(date)
                      ? `Closed: ${getClosureInfo(date)?.name || 'Business closure'}`
                      : isWeekend(date)
                        ? 'Weekends are not available'
                        : isBefore(date, today)
                          ? 'Past date'
                          : undefined
                }
              >
                <span className={!isSameMonth(date, currentMonth) ? 'text-slate-300' : ''}>{format(date, 'd')}</span>
                {soldOut && isSameMonth(date, currentMonth) && <span className="absolute bottom-0.5 text-[8px] font-bold uppercase sm:bottom-1 sm:text-[9px]">Full</span>}
              </button>
            )
          })}
        </div>
      </div>

      {((enableMultiSelect && internalSelectedDates.length > 0) || (!enableMultiSelect && selectedDate)) && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-primary-700 text-white">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-primary-950">
                  {enableMultiSelect ? `${internalSelectedDates.length} ${internalSelectedDates.length === 1 ? 'date' : 'dates'} selected` : 'Date selected'}
                </p>
                {!enableMultiSelect && selectedDate && <p className="text-sm text-primary-800">{format(selectedDate, 'EEEE, d MMMM yyyy')}</p>}
              </div>
            </div>
            {enableMultiSelect && (
              <button type="button" onClick={clearAllDates} className="text-sm font-semibold text-primary-800 hover:text-primary-950">Clear</button>
            )}
          </div>
          {enableMultiSelect && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-primary-200 pt-3">
              {internalSelectedDates.map(date => (
                <span key={date.toISOString()} className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-primary-900 shadow-sm">
                  <CheckIcon className="mr-1.5 h-4 w-4" />
                  {formatSelectedDate(date)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-slate-500">Camps run Monday to Friday. Grey dates are unavailable.</p>
    </div>
  )
}

/**
 * Business Closure Dates Configuration
 * 
 * Defines dates when TinkerTank is closed and cannot accept bookings.
 * Supports both specific dates and recurring annual dates.
 */

export interface ClosureDate {
  name: string
  description?: string
  recurring: boolean
  month?: number // 1-12 (for recurring dates)
  day?: number // 1-31 (for recurring dates)
  specificDate?: Date // For one-time closures
  year?: number // For specific year closures
}

/**
 * Recurring annual closure dates
 */
export const RECURRING_CLOSURE_DATES: ClosureDate[] = [
  // Christmas/New Year Period
  {
    name: 'Christmas Day',
    description: 'TinkerTank is closed for Christmas',
    recurring: true,
    month: 12,
    day: 25
  },
  {
    name: 'Boxing Day',
    description: 'TinkerTank is closed for Boxing Day',
    recurring: true,
    month: 12,
    day: 26
  },
  {
    name: 'Christmas Closure - Day 3',
    description: 'TinkerTank is closed during Christmas period',
    recurring: true,
    month: 12,
    day: 27
  },
  {
    name: 'Christmas Closure - Day 4',
    description: 'TinkerTank is closed during Christmas period',
    recurring: true,
    month: 12,
    day: 28
  },
  {
    name: 'Christmas Closure - Day 5',
    description: 'TinkerTank is closed during Christmas period',
    recurring: true,
    month: 12,
    day: 29
  },
  {
    name: 'Christmas Closure - Day 6',
    description: 'TinkerTank is closed during Christmas period',
    recurring: true,
    month: 12,
    day: 30
  },
  {
    name: "New Year's Day",
    description: "TinkerTank is closed for New Year's Day",
    recurring: true,
    month: 1,
    day: 1
  },
  {
    name: 'Australia Day',
    description: 'TinkerTank is closed for Australia Day',
    recurring: true,
    month: 1,
    day: 26
  }
]

/**
 * One-time specific closure dates
 * Add any special closure dates here (e.g., facility maintenance, special events)
 */
export const SPECIFIC_CLOSURE_DATES: ClosureDate[] = [
  // Example:
  // {
  //   name: 'Facility Maintenance',
  //   description: 'Annual maintenance day',
  //   recurring: false,
  //   specificDate: new Date('2025-07-15')
  // }
]

/**
 * Check if a given date is a business closure date
 */
export const isClosureDate = (date: Date): boolean => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // JavaScript months are 0-indexed
  const day = date.getDate()
  
  // Check recurring closure dates
  const isRecurringClosure = RECURRING_CLOSURE_DATES.some(
    closure => closure.month === month && closure.day === day
  )
  
  if (isRecurringClosure) return true
  
  // Check specific closure dates
  const isSpecificClosure = SPECIFIC_CLOSURE_DATES.some(closure => {
    if (!closure.specificDate) return false
    
    const closureDate = closure.specificDate
    return (
      closureDate.getFullYear() === year &&
      closureDate.getMonth() + 1 === month &&
      closureDate.getDate() === day
    )
  })
  
  return isSpecificClosure
}

/**
 * Get closure information for a specific date
 */
export const getClosureInfo = (date: Date): ClosureDate | null => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Check recurring closure dates
  const recurringClosure = RECURRING_CLOSURE_DATES.find(
    closure => closure.month === month && closure.day === day
  )
  
  if (recurringClosure) return recurringClosure
  
  // Check specific closure dates
  const specificClosure = SPECIFIC_CLOSURE_DATES.find(closure => {
    if (!closure.specificDate) return false
    
    const closureDate = closure.specificDate
    return (
      closureDate.getFullYear() === year &&
      closureDate.getMonth() + 1 === month &&
      closureDate.getDate() === day
    )
  })
  
  return specificClosure || null
}

/**
 * Get all closure dates for a given year
 */
export const getClosureDatesForYear = (year: number): Date[] => {
  const dates: Date[] = []
  
  // Add recurring closure dates
  RECURRING_CLOSURE_DATES.forEach(closure => {
    if (closure.month && closure.day) {
      dates.push(new Date(year, closure.month - 1, closure.day))
    }
  })
  
  // Add specific closure dates for this year
  SPECIFIC_CLOSURE_DATES.forEach(closure => {
    if (closure.specificDate && closure.specificDate.getFullYear() === year) {
      dates.push(new Date(closure.specificDate))
    }
  })
  
  return dates.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Get all closure dates within a date range
 */
export const getClosureDatesInRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    if (isClosureDate(current)) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * Check if a date is available for bookings (not weekend, not past, not closure)
 */
export const isDateAvailableForBooking = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check if past
  if (date < today) return false
  
  // Check if weekend
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) return false
  
  // Check if closure date
  if (isClosureDate(date)) return false
  
  return true
}

/**
 * Get the next available booking date from a given date
 */
export const getNextAvailableDate = (fromDate: Date = new Date()): Date => {
  const current = new Date(fromDate)
  current.setHours(0, 0, 0, 0)
  
  // Look ahead up to 90 days
  for (let i = 0; i < 90; i++) {
    if (isDateAvailableForBooking(current)) {
      return new Date(current)
    }
    current.setDate(current.getDate() + 1)
  }
  
  // If no available date found in 90 days, return 90 days from now
  const fallback = new Date(fromDate)
  fallback.setDate(fallback.getDate() + 90)
  return fallback
}

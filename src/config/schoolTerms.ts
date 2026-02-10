/**
 * NSW School Term Dates - Eastern Division
 * Used for Ignite subscription scheduling
 */

export interface SchoolTerm {
  term: number
  year: number
  startDate: Date
  endDate: Date
  name: string
}

// 2026 NSW School Term Dates - Eastern Division
export const SCHOOL_TERMS_2026: SchoolTerm[] = [
  {
    term: 1,
    year: 2026,
    startDate: new Date('2026-02-02'),
    endDate: new Date('2026-04-02'),
    name: 'Term 1 2026'
  },
  {
    term: 2,
    year: 2026,
    startDate: new Date('2026-04-22'),
    endDate: new Date('2026-07-03'),
    name: 'Term 2 2026'
  },
  {
    term: 3,
    year: 2026,
    startDate: new Date('2026-07-21'),
    endDate: new Date('2026-09-25'),
    name: 'Term 3 2026'
  },
  {
    term: 4,
    year: 2026,
    startDate: new Date('2026-10-13'),
    endDate: new Date('2026-12-17'),
    name: 'Term 4 2026'
  }
]

// School holiday periods (for pausing subscriptions)
export const SCHOOL_HOLIDAYS_2026 = [
  { name: 'Autumn Break', startDate: new Date('2026-04-03'), endDate: new Date('2026-04-21') },
  { name: 'Winter Break', startDate: new Date('2026-07-04'), endDate: new Date('2026-07-20') },
  { name: 'Spring Break', startDate: new Date('2026-09-26'), endDate: new Date('2026-10-12') },
  { name: 'Summer Break', startDate: new Date('2026-12-18'), endDate: new Date('2027-02-01') }
]

/**
 * Get the current school term based on a date
 */
export function getCurrentTerm(date: Date = new Date()): SchoolTerm | null {
  for (const term of SCHOOL_TERMS_2026) {
    if (date >= term.startDate && date <= term.endDate) {
      return term
    }
  }
  return null
}

/**
 * Get the next school term if we're currently in a break
 */
export function getNextTerm(date: Date = new Date()): SchoolTerm | null {
  for (const term of SCHOOL_TERMS_2026) {
    if (term.startDate > date) {
      return term
    }
  }
  return null
}

/**
 * Get the term that a subscription should start in
 * If we're in a term, use current. If in holiday, use next.
 */
export function getSubscriptionStartTerm(date: Date = new Date()): SchoolTerm | null {
  const current = getCurrentTerm(date)
  if (current) return current
  return getNextTerm(date)
}

/**
 * Generate all dates for a specific day of week within a term
 */
export function getTermDatesForDayOfWeek(term: SchoolTerm, dayOfWeek: number): Date[] {
  const dates: Date[] = []
  const current = new Date(term.startDate)
  
  // Find the first occurrence of this day of week
  while (current.getDay() !== dayOfWeek && current <= term.endDate) {
    current.setDate(current.getDate() + 1)
  }
  
  // Collect all occurrences
  while (current <= term.endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }
  
  return dates
}

// Day name to JS day number (0 = Sunday, 1 = Monday, etc.)
export const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

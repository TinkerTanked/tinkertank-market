import { describe, it, expect } from 'vitest'
import {
  isClosureDate,
  getClosureInfo,
  getClosureDatesForYear,
  getClosureDatesInRange,
  isDateAvailableForBooking,
  getNextAvailableDate,
  RECURRING_CLOSURE_DATES,
  SPECIFIC_CLOSURE_DATES,
} from '@/data/closureDates'

describe('Closure Dates', () => {
  describe('isClosureDate', () => {
    it('should identify Christmas Day as a closure date', () => {
      const christmasDay = new Date('2025-12-25')
      expect(isClosureDate(christmasDay)).toBe(true)
    })

    it('should identify Boxing Day as a closure date', () => {
      const boxingDay = new Date('2025-12-26')
      expect(isClosureDate(boxingDay)).toBe(true)
    })

    it('should identify New Year\'s Day as a closure date', () => {
      const newYearsDay = new Date('2025-01-01')
      expect(isClosureDate(newYearsDay)).toBe(true)
    })

    it('should identify Australia Day as a closure date', () => {
      const australiaDay = new Date('2025-01-26')
      expect(isClosureDate(australiaDay)).toBe(true)
    })

    it('should close Dec 24, 25, 26 and 31 but stay open Dec 27-30', () => {
      ;[24, 25, 26, 31].forEach(day => {
        expect(isClosureDate(new Date(`2025-12-${day}`)), `Dec ${day} should be a closure date`).toBe(true)
      })
      ;[27, 28, 29, 30].forEach(day => {
        expect(isClosureDate(new Date(`2026-12-${day}`)), `Dec ${day} should be open`).toBe(false)
      })
    })

    it('should close Monday 25 January 2027 for the Australia Day long weekend only', () => {
      expect(isClosureDate(new Date('2027-01-25'))).toBe(true)
      expect(isClosureDate(new Date('2028-01-25'))).toBe(false)
    })

    it('should not identify regular weekdays as closure dates', () => {
      const regularDay = new Date('2025-03-15') // A random weekday
      expect(isClosureDate(regularDay)).toBe(false)
    })

    it('should work for multiple years', () => {
      const christmas2024 = new Date('2024-12-25')
      const christmas2025 = new Date('2025-12-25')
      const christmas2026 = new Date('2026-12-25')
      
      expect(isClosureDate(christmas2024)).toBe(true)
      expect(isClosureDate(christmas2025)).toBe(true)
      expect(isClosureDate(christmas2026)).toBe(true)
    })
  })

  describe('getClosureInfo', () => {
    it('should return closure information for Christmas Day', () => {
      const christmasDay = new Date('2025-12-25')
      const info = getClosureInfo(christmasDay)
      
      expect(info).toBeTruthy()
      expect(info?.name).toBe('Christmas Day')
      expect(info?.recurring).toBe(true)
    })

    it('should return closure information for Australia Day', () => {
      const australiaDay = new Date('2025-01-26')
      const info = getClosureInfo(australiaDay)
      
      expect(info).toBeTruthy()
      expect(info?.name).toBe('Australia Day')
    })

    it('should return null for non-closure dates', () => {
      const regularDay = new Date('2025-03-15')
      const info = getClosureInfo(regularDay)
      
      expect(info).toBeNull()
    })
  })

  describe('getClosureDatesForYear', () => {
    it('should return all closure dates for 2025', () => {
      const closureDates = getClosureDatesForYear(2025)
      
      // Jan 1, Jan 26, Dec 24, 25, 26 and 31
      expect(closureDates.length).toBe(6)
    })

    it('should return dates in chronological order', () => {
      const closureDates = getClosureDatesForYear(2025)
      
      for (let i = 1; i < closureDates.length; i++) {
        expect(closureDates[i].getTime()).toBeGreaterThan(closureDates[i - 1].getTime())
      }
    })

    it('should include Jan 1 and Jan 26 at the beginning of the year', () => {
      const closureDates = getClosureDatesForYear(2025)
      const jan1 = closureDates.find(d => d.getMonth() === 0 && d.getDate() === 1)
      const jan26 = closureDates.find(d => d.getMonth() === 0 && d.getDate() === 26)
      
      expect(jan1).toBeTruthy()
      expect(jan26).toBeTruthy()
    })

    it('should include Dec 24, 25, 26 and 31 at the end of the year', () => {
      const closureDates = getClosureDatesForYear(2025)
      const decemberClosures = closureDates.filter(d => d.getMonth() === 11)
      
      expect(decemberClosures.map(d => d.getDate())).toEqual([24, 25, 26, 31])
    })
  })

  describe('getClosureDatesInRange', () => {
    it('should return closure dates within a date range', () => {
      const startDate = new Date('2025-12-20')
      const endDate = new Date('2026-01-05')
      const closureDates = getClosureDatesInRange(startDate, endDate)
      
      // Dec 24, 25, 26, 31 and Jan 1
      expect(closureDates.length).toBe(5)
    })

    it('should return empty array when no closures in range', () => {
      const startDate = new Date('2025-03-01')
      const endDate = new Date('2025-03-31')
      const closureDates = getClosureDatesInRange(startDate, endDate)
      
      expect(closureDates.length).toBe(0)
    })

    it('should include boundary dates if they are closures', () => {
      const startDate = new Date('2025-12-25')
      const endDate = new Date('2025-12-27')
      const closureDates = getClosureDatesInRange(startDate, endDate)
      
      expect(closureDates.length).toBe(2) // Dec 25, 26
    })
  })

  describe('isDateAvailableForBooking', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    it('should not allow bookings on closure dates', () => {
      const christmasDay = new Date('2025-12-25')
      expect(isDateAvailableForBooking(christmasDay)).toBe(false)
    })

    it('should not allow bookings on weekends', () => {
      // Find a Saturday in March 2025 that's not a closure date
      const saturday = new Date('2025-03-01') // Saturday
      const sunday = new Date('2025-03-02') // Sunday
      
      expect(isDateAvailableForBooking(saturday)).toBe(false)
      expect(isDateAvailableForBooking(sunday)).toBe(false)
    })

    it('should not allow bookings on past dates', () => {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      expect(isDateAvailableForBooking(yesterday)).toBe(false)
    })

    it('should allow bookings on future weekdays that are not closure dates', () => {
      // Monday, March 3, 2025 - not a closure date
      const futureWeekday = new Date('2025-03-03')
      
      if (futureWeekday >= today) {
        expect(isDateAvailableForBooking(futureWeekday)).toBe(true)
      }
    })

    it('should allow bookings on today if it\'s a weekday and not a closure', () => {
      const dayOfWeek = today.getDay()
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
      const isClosure = isClosureDate(today)
      
      if (isWeekday && !isClosure) {
        expect(isDateAvailableForBooking(today)).toBe(true)
      }
    })

    it('should not allow bookings on weekdays during Christmas closure', () => {
      // Friday, Dec 26, 2025 is Boxing Day (weekday but closure)
      const boxingDay = new Date('2025-12-26')
      expect(isDateAvailableForBooking(boxingDay)).toBe(false)
    })
  })

  describe('getNextAvailableDate', () => {
    it('should skip closure dates when finding next available date', () => {
      // Start from Tuesday Dec 24, 2030 (a future date, so it is not rejected as past)
      const startDate = new Date('2030-12-24T00:00:00')
      const nextAvailable = getNextAvailableDate(startDate)
      
      // Skips Dec 24-26 (closures) and lands on Friday Dec 27
      expect(nextAvailable.toDateString()).toBe(new Date('2030-12-27T00:00:00').toDateString())
    })

    it('should skip weekends when finding next available date', () => {
      // Start from Saturday, March 1, 2025
      const saturday = new Date('2025-03-01')
      const nextAvailable = getNextAvailableDate(saturday)
      
      // Should be Monday, March 3
      expect(nextAvailable.getDay()).not.toBe(0) // Not Sunday
      expect(nextAvailable.getDay()).not.toBe(6) // Not Saturday
    })

    it('should return today if today is available', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const dayOfWeek = today.getDay()
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
      const isClosure = isClosureDate(today)
      
      if (isWeekday && !isClosure) {
        const nextAvailable = getNextAvailableDate(today)
        expect(nextAvailable.toDateString()).toBe(today.toDateString())
      }
    })

    it('should handle new year transition', () => {
      // Tuesday Dec 31, 2030 (New Year's Eve) and Jan 1 are closed
      const endOfYear = new Date('2030-12-31T00:00:00')
      const nextAvailable = getNextAvailableDate(endOfYear)
      
      expect(nextAvailable.toDateString()).toBe(new Date('2031-01-02T00:00:00').toDateString())
      expect(isDateAvailableForBooking(nextAvailable)).toBe(true)
    })
  })

  describe('RECURRING_CLOSURE_DATES configuration', () => {
    it('should contain all expected closure dates', () => {
      expect(RECURRING_CLOSURE_DATES.length).toBe(6)
      
      const closureNames = RECURRING_CLOSURE_DATES.map(c => c.name)
      expect(closureNames).toContain('Christmas Day')
      expect(closureNames).toContain('Boxing Day')
      expect(closureNames).toContain("New Year's Day")
      expect(closureNames).toContain('Australia Day')
    })

    it('should have all recurring dates marked correctly', () => {
      RECURRING_CLOSURE_DATES.forEach(closure => {
        expect(closure.recurring).toBe(true)
        expect(closure.month).toBeDefined()
        expect(closure.day).toBeDefined()
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle leap years correctly', () => {
      const leapYearDate = new Date('2024-02-29')
      // This shouldn't be a closure date
      expect(isClosureDate(leapYearDate)).toBe(false)
    })

    it('should handle year boundaries', () => {
      const dec31 = new Date('2024-12-31')
      const jan1 = new Date('2025-01-01')
      
      // New Year's Eve
      expect(isClosureDate(dec31)).toBe(true)
      // Jan 1 is New Year's Day
      expect(isClosureDate(jan1)).toBe(true)
    })

    it('should handle timezone edge cases', () => {
      // Create dates with different time components
      const morning = new Date('2025-12-25T00:00:00')
      const evening = new Date('2025-12-25T23:59:59')
      
      expect(isClosureDate(morning)).toBe(true)
      expect(isClosureDate(evening)).toBe(true)
    })
  })
})

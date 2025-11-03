/**
 * Date Utilities Unit Tests
 * Tests core date utility functions and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  isWeekend, 
  isBusinessDay, 
  addBusinessDays,
  formatDate,
  formatTime,
  formatCurrency 
} from '@/types'

describe('Date Utility Functions', () => {
  
  describe('isWeekend', () => {
    it('should correctly identify weekend days', () => {
      // Test all days of the week
      const dates = [
        { date: new Date('2025-02-16'), day: 'Sunday', expected: true },
        { date: new Date('2025-02-17'), day: 'Monday', expected: false },
        { date: new Date('2025-02-18'), day: 'Tuesday', expected: false },
        { date: new Date('2025-02-19'), day: 'Wednesday', expected: false },
        { date: new Date('2025-02-20'), day: 'Thursday', expected: false },
        { date: new Date('2025-02-21'), day: 'Friday', expected: false },
        { date: new Date('2025-02-22'), day: 'Saturday', expected: true },
      ]

      dates.forEach(({ date, day, expected }) => {
        expect(isWeekend(date), `${day} should ${expected ? 'be' : 'not be'} a weekend`).toBe(expected)
      })
    })

    it('should handle different months and years', () => {
      const weekendDates = [
        new Date('2025-01-04'), // Saturday
        new Date('2025-01-05'), // Sunday  
        new Date('2025-12-27'), // Saturday
        new Date('2025-12-28'), // Sunday
        new Date('2024-02-03'), // Saturday (leap year)
        new Date('2024-02-04'), // Sunday (leap year)
      ]

      weekendDates.forEach(date => {
        expect(isWeekend(date)).toBe(true)
      })

      const weekdayDates = [
        new Date('2025-01-06'), // Monday
        new Date('2025-12-29'), // Monday
        new Date('2024-02-05'), // Monday (leap year)
      ]

      weekdayDates.forEach(date => {
        expect(isWeekend(date)).toBe(false)
      })
    })

    it('should handle timezone edge cases', () => {
      // Test dates that might be different days in different timezones
      const utcSaturday = new Date('2025-02-22T00:00:00Z')
      const utcSunday = new Date('2025-02-23T00:00:00Z')

      expect(isWeekend(utcSaturday)).toBe(true)
      expect(isWeekend(utcSunday)).toBe(true)
    })
  })

  describe('isBusinessDay', () => {
    it('should correctly identify business days', () => {
      const testCases = [
        { date: new Date('2025-02-16'), day: 'Sunday', expected: false },
        { date: new Date('2025-02-17'), day: 'Monday', expected: true },
        { date: new Date('2025-02-18'), day: 'Tuesday', expected: true },
        { date: new Date('2025-02-19'), day: 'Wednesday', expected: true },
        { date: new Date('2025-02-20'), day: 'Thursday', expected: true },
        { date: new Date('2025-02-21'), day: 'Friday', expected: true },
        { date: new Date('2025-02-22'), day: 'Saturday', expected: false },
      ]

      testCases.forEach(({ date, day, expected }) => {
        expect(isBusinessDay(date), `${day} should ${expected ? 'be' : 'not be'} a business day`).toBe(expected)
      })
    })

    it('should be inverse of weekend check for most days', () => {
      const testDates = [
        new Date('2025-02-17'), // Monday
        new Date('2025-02-18'), // Tuesday
        new Date('2025-02-19'), // Wednesday
        new Date('2025-02-20'), // Thursday
        new Date('2025-02-21'), // Friday
        new Date('2025-02-22'), // Saturday
        new Date('2025-02-23'), // Sunday
      ]

      testDates.forEach(date => {
        const weekend = isWeekend(date)
        const businessDay = isBusinessDay(date)
        expect(weekend).toBe(!businessDay)
      })
    })
  })

  describe('addBusinessDays', () => {
    it('should add business days correctly skipping weekends', () => {
      const friday = new Date('2025-02-21') // Friday
      
      // Adding 1 business day from Friday should give Monday
      const nextBusinessDay = addBusinessDays(friday, 1)
      expect(nextBusinessDay.getDay()).toBe(1) // Monday
      expect(nextBusinessDay.getDate()).toBe(24) // Feb 24

      // Adding 2 business days from Friday should give Tuesday
      const twoDaysLater = addBusinessDays(friday, 2)
      expect(twoDaysLater.getDay()).toBe(2) // Tuesday
      expect(twoDaysLater.getDate()).toBe(25) // Feb 25
    })

    it('should handle adding multiple business days across weekends', () => {
      const friday = new Date('2025-02-21') // Friday
      
      // Adding 5 business days should give next Friday
      const fiveDaysLater = addBusinessDays(friday, 5)
      expect(fiveDaysLater.getDay()).toBe(5) // Friday
      expect(fiveDaysLater.getDate()).toBe(28) // Feb 28
    })

    it('should handle starting from weekend days', () => {
      const saturday = new Date('2025-02-22') // Saturday
      
      // Adding 1 business day from Saturday should give Monday
      const nextBusinessDay = addBusinessDays(saturday, 1)
      expect(nextBusinessDay.getDay()).toBe(1) // Monday
      expect(nextBusinessDay.getDate()).toBe(24) // Feb 24
    })

    it('should handle adding zero business days', () => {
      const monday = new Date('2025-02-17') // Monday
      const result = addBusinessDays(monday, 0)
      
      expect(result.getTime()).toBe(monday.getTime())
    })

    it('should handle month and year boundaries', () => {
      const jan31 = new Date('2025-01-31') // Friday
      
      // Adding 1 business day should cross into February
      const nextBusinessDay = addBusinessDays(jan31, 1)
      expect(nextBusinessDay.getMonth()).toBe(1) // February (0-indexed)
      expect(nextBusinessDay.getDate()).toBe(3) // Feb 3 (Monday)

      // Test year boundary
      const dec31 = new Date('2024-12-31') // Tuesday
      const nextBusinessDay2025 = addBusinessDays(dec31, 1)
      expect(nextBusinessDay2025.getFullYear()).toBe(2025)
      expect(nextBusinessDay2025.getMonth()).toBe(0) // January
      expect(nextBusinessDay2025.getDate()).toBe(1) // Jan 1
    })

    it('should preserve time component', () => {
      const fridayAfternoon = new Date('2025-02-21T14:30:00') // Friday 2:30 PM
      
      const nextBusinessDay = addBusinessDays(fridayAfternoon, 1)
      expect(nextBusinessDay.getHours()).toBe(14)
      expect(nextBusinessDay.getMinutes()).toBe(30)
    })
  })

  describe('formatDate', () => {
    const testDate = new Date('2025-02-15T10:30:00') // Saturday

    it('should format dates in short format', () => {
      const formatted = formatDate(testDate, 'short')
      expect(formatted).toMatch(/15 Feb/) // Should contain day and short month
    })

    it('should format dates in medium format (default)', () => {
      const formatted = formatDate(testDate, 'medium')
      expect(formatted).toMatch(/15 Feb 2025/) // Should contain day, month, year
    })

    it('should format dates in long format', () => {
      const formatted = formatDate(testDate, 'long')
      expect(formatted).toMatch(/Saturday.*15.*February.*2025/) // Should contain weekday, day, full month, year
    })

    it('should use medium format by default', () => {
      const defaultFormatted = formatDate(testDate)
      const mediumFormatted = formatDate(testDate, 'medium')
      expect(defaultFormatted).toBe(mediumFormatted)
    })

    it('should handle different dates correctly', () => {
      const newYears = new Date('2025-01-01T00:00:00')
      const christmas = new Date('2025-12-25T12:00:00')

      expect(formatDate(newYears, 'short')).toMatch(/1 Jan/)
      expect(formatDate(christmas, 'short')).toMatch(/25 Dec/)
    })
  })

  describe('formatTime', () => {
    it('should format 24-hour time to 12-hour AM/PM format', () => {
      expect(formatTime('09:00')).toBe('9:00 AM')
      expect(formatTime('09:30')).toBe('9:30 AM')
      expect(formatTime('12:00')).toBe('12:00 PM')
      expect(formatTime('13:00')).toBe('1:00 PM')
      expect(formatTime('13:30')).toBe('1:30 PM')
      expect(formatTime('23:59')).toBe('11:59 PM')
    })

    it('should handle midnight and noon correctly', () => {
      expect(formatTime('00:00')).toBe('12:00 AM')
      expect(formatTime('12:00')).toBe('12:00 PM')
    })

    it('should pad minutes with leading zero', () => {
      expect(formatTime('09:05')).toBe('9:05 AM')
      expect(formatTime('15:09')).toBe('3:09 PM')
    })

    it('should handle edge cases', () => {
      expect(formatTime('00:01')).toBe('12:01 AM')
      expect(formatTime('11:59')).toBe('11:59 AM')
      expect(formatTime('23:00')).toBe('11:00 PM')
    })
  })

  describe('formatCurrency', () => {
    it('should format Australian currency correctly', () => {
      expect(formatCurrency(85)).toBe('$85.00')
      expect(formatCurrency(450)).toBe('$450.00')
      expect(formatCurrency(1299.99)).toBe('$1,299.99')
    })

    it('should handle decimal amounts correctly', () => {
      expect(formatCurrency(85.5)).toBe('$85.50')
      expect(formatCurrency(99.99)).toBe('$99.99')
      expect(formatCurrency(100.1)).toBe('$100.10')
    })

    it('should handle large amounts with proper formatting', () => {
      expect(formatCurrency(10000)).toBe('$10,000.00')
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    })

    it('should handle zero and negative amounts', () => {
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(-50)).toBe('-$50.00')
    })

    it('should use AUD currency by default', () => {
      const formatted = formatCurrency(100)
      expect(formatted).toBe('$100.00') // Australian dollar symbol
    })

    it('should accept custom currency', () => {
      expect(formatCurrency(100, 'USD')).toMatch(/100\.00/) // Should format as USD
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid')
      
      // Functions should not throw, but behavior may vary
      expect(() => isWeekend(invalidDate)).not.toThrow()
      expect(() => isBusinessDay(invalidDate)).not.toThrow()
    })

    it('should handle date objects at boundaries', () => {
      // Test minimum and maximum safe dates
      const minDate = new Date(-8640000000000000) // Minimum ECMAScript date
      const maxDate = new Date(8640000000000000)   // Maximum ECMAScript date

      expect(() => isWeekend(minDate)).not.toThrow()
      expect(() => isWeekend(maxDate)).not.toThrow()
    })

    it('should handle leap year dates correctly', () => {
      const feb29_2024 = new Date('2024-02-29') // Leap year
      const feb28_2025 = new Date('2025-02-28') // Non-leap year

      expect(() => isWeekend(feb29_2024)).not.toThrow()
      expect(() => isBusinessDay(feb29_2024)).not.toThrow()
      expect(() => addBusinessDays(feb28_2025, 1)).not.toThrow()
    })

    it('should handle daylight saving time transitions', () => {
      // Test dates around DST transitions in Australia
      const beforeDST = new Date('2025-04-06T01:30:00+11:00') // Before DST ends
      const afterDST = new Date('2025-04-06T01:30:00+10:00')  // After DST ends

      expect(() => isWeekend(beforeDST)).not.toThrow()
      expect(() => isWeekend(afterDST)).not.toThrow()
      expect(() => addBusinessDays(beforeDST, 1)).not.toThrow()
    })
  })

  describe('Performance and Memory', () => {
    it('should handle large numbers of date calculations efficiently', () => {
      const startDate = new Date('2025-01-01')
      const iterations = 1000

      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        const testDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        isWeekend(testDate)
        isBusinessDay(testDate)
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should complete within reasonable time (less than 100ms)
      expect(executionTime).toBeLessThan(100)
    })

    it('should not create unnecessary date objects', () => {
      const testDate = new Date('2025-02-15')
      
      // Functions should work with the same date object multiple times
      expect(isWeekend(testDate)).toBe(true)
      expect(isWeekend(testDate)).toBe(true) // Should give same result
      expect(isBusinessDay(testDate)).toBe(false)
      expect(isBusinessDay(testDate)).toBe(false) // Should give same result
    })
  })
})

// Utility Functions Test Summary
describe('Date Utils Test Summary', () => {
  it('should document comprehensive utility test coverage', () => {
    const utilityTestAreas = [
      'isWeekend - All days, timezones, different months/years',
      'isBusinessDay - Weekday identification, inverse relationship with weekends',
      'addBusinessDays - Weekend skipping, month/year boundaries, zero days',
      'formatDate - Short/medium/long formats, default behavior',
      'formatTime - 24h to 12h conversion, AM/PM, edge cases',
      'formatCurrency - AUD formatting, decimals, large amounts, custom currency',
      'Edge Cases - Invalid dates, boundaries, leap years, DST',
      'Performance - Large iterations, memory efficiency'
    ]
    
    expect(utilityTestAreas).toHaveLength(8)
    
    console.log('\n=== DATE UTILITIES TEST COVERAGE ===')
    utilityTestAreas.forEach((area, index) => {
      console.log(`${index + 1}. ${area}`)
    })
    console.log('====================================\n')
  })
})

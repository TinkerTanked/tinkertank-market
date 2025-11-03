/**
 * Date and Time Selection Validation Tests
 * 
 * Tests comprehensive business rules for date and time selection including:
 * - Weekend exclusion for camps
 * - Past date prevention  
 * - Date conflict detection
 * - Time slot availability
 * - Product-specific scheduling rules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DateTimeSelector from '@/components/booking/DateTimeSelector'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

// Mock current date for consistent testing
const MOCK_TODAY = new Date('2024-03-15') // Friday
vi.setSystemTime(MOCK_TODAY)

describe('Date and Time Selection Validation Tests', () => {
  beforeEach(() => {
    useEnhancedCartStore.getState().clearCart()
    vi.clearAllMocks()
    vi.setSystemTime(MOCK_TODAY)
  })

  describe('Date Generation and Filtering', () => {
    it('should generate dates starting from tomorrow', async () => {
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      const buttons = screen.getAllByRole('button')
      const dateButtons = buttons.filter(btn => 
        btn.textContent?.includes('Mon') || 
        btn.textContent?.includes('Tue') || 
        btn.textContent?.includes('Wed') || 
        btn.textContent?.includes('Thu') || 
        btn.textContent?.includes('Fri')
      )
      
      // Should have weekday dates starting from Monday (next business day after Friday)
      expect(dateButtons.length).toBeGreaterThan(0)
      
      // First available date should be Monday March 18, 2024
      const firstButton = dateButtons[0]
      expect(firstButton.textContent).toContain('Mon')
      expect(firstButton.textContent).toContain('Mar')
      expect(firstButton.textContent).toContain('18')
    })

    it('should exclude weekends for camp products', async () => {
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      const buttons = screen.getAllByRole('button')
      
      // Should not find any Saturday or Sunday buttons for camps
      const weekendButtons = buttons.filter(btn => 
        btn.textContent?.includes('Sat') || 
        btn.textContent?.includes('Sun')
      )
      
      expect(weekendButtons).toHaveLength(0)
    })

    it('should include weekends for non-camp products', async () => {
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="birthday-party-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      const buttons = screen.getAllByRole('button')
      
      // Should include weekend dates for birthday parties
      const weekendButtons = buttons.filter(btn => 
        btn.textContent?.includes('Sat') || 
        btn.textContent?.includes('Sun')
      )
      
      expect(weekendButtons.length).toBeGreaterThan(0)
    })

    it('should generate 30 days of available dates', async () => {
      vi.setSystemTime(new Date('2024-03-01')) // Friday
      
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="birthday-party-1" // Non-camp to include all days
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      const buttons = screen.getAllByRole('button')
      const dateButtons = buttons.filter(btn => 
        btn.textContent && (
          btn.textContent.includes('Mon') || 
          btn.textContent.includes('Tue') || 
          btn.textContent.includes('Wed') || 
          btn.textContent.includes('Thu') || 
          btn.textContent.includes('Fri') || 
          btn.textContent.includes('Sat') || 
          btn.textContent.includes('Sun')
        )
      )

      // Should show first 20 dates (as per component limit)
      expect(dateButtons).toHaveLength(20)
    })
  })

  describe('Time Slot Generation', () => {
    it('should show correct time slots for day camps', async () => {
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      expect(screen.getByText('9:00 AM - 3:00 PM')).toBeInTheDocument()
      
      // Should not show all-day camp times
      expect(screen.queryByText('8:00 AM - 5:00 PM')).not.toBeInTheDocument()
    })

    it('should show correct time slots for all-day camps', async () => {
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="all-day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      expect(screen.getByText('8:00 AM - 5:00 PM')).toBeInTheDocument()
      
      // Should not show day camp times
      expect(screen.queryByText('9:00 AM - 3:00 PM')).not.toBeInTheDocument()
    })

    it('should show multiple time slots for birthday parties', async () => {
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="birthday-party-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      expect(screen.getByText('10:00 AM - 12:00 PM')).toBeInTheDocument()
      expect(screen.getByText('1:00 PM - 3:00 PM')).toBeInTheDocument()
      expect(screen.getByText('3:30 PM - 5:30 PM')).toBeInTheDocument()
    })

    it('should show weekly time slots for subscriptions', async () => {
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="ignite-subscription-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      expect(screen.getByText('Monday 4:00 PM - 5:00 PM')).toBeInTheDocument()
      expect(screen.getByText('Tuesday 4:00 PM - 5:00 PM')).toBeInTheDocument()
      expect(screen.getByText('Saturday 9:00 AM - 10:00 AM')).toBeInTheDocument()
      expect(screen.getByText('Saturday 10:30 AM - 11:30 AM')).toBeInTheDocument()
    })
  })

  describe('Selection Logic', () => {
    it('should require both date and time for callback', async () => {
      const user = userEvent.setup()
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      // Select date first
      const dateButtons = screen.getAllByRole('button')
      const firstDateButton = dateButtons.find(btn => 
        btn.textContent?.includes('Mon') && btn.textContent?.includes('Mar')
      )
      
      if (firstDateButton) {
        await user.click(firstDateButton)
        // Should not trigger callback yet
        expect(mockOnDateSelect).not.toHaveBeenCalled()
      }

      // Now select time slot
      const timeSlotButton = screen.getByText('9:00 AM - 3:00 PM')
      await user.click(timeSlotButton)
      
      // Now should trigger callback with both date and time
      expect(mockOnDateSelect).toHaveBeenCalled()
    })

    it('should trigger callback when time is selected first', async () => {
      const user = userEvent.setup()
      const mockOnDateSelect = vi.fn()
      
      // Pre-select a date
      const selectedDate = new Date('2024-03-18') // Monday
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={selectedDate}
          selectedTimeSlot={null}
        />
      )

      // Select time slot
      const timeSlotButton = screen.getByText('9:00 AM - 3:00 PM')
      await user.click(timeSlotButton)
      
      expect(mockOnDateSelect).toHaveBeenCalledWith(selectedDate, '9:00 AM - 3:00 PM')
    })

    it('should highlight selected date and time', async () => {
      const user = userEvent.setup()
      const selectedDate = new Date('2024-03-18') // Monday
      const selectedTimeSlot = '9:00 AM - 3:00 PM'
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={vi.fn()}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot}
        />
      )

      // Check date button has selected styling
      const dateButtons = screen.getAllByRole('button')
      const selectedDateButton = dateButtons.find(btn => 
        btn.textContent?.includes('Mon') && btn.textContent?.includes('Mar')
      )
      
      expect(selectedDateButton).toHaveClass('border-primary-500')
      expect(selectedDateButton).toHaveClass('bg-primary-50')
      
      // Check time slot button has selected styling
      const timeSlotButton = screen.getByText('9:00 AM - 3:00 PM')
      expect(timeSlotButton).toHaveClass('border-primary-500')
      expect(timeSlotButton).toHaveClass('bg-primary-50')
    })

    it('should show confirmation when both date and time are selected', async () => {
      const selectedDate = new Date('2024-03-18') // Monday
      const selectedTimeSlot = '9:00 AM - 3:00 PM'
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={vi.fn()}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot}
        />
      )

      // Should show green confirmation box
      const confirmation = screen.getByText(/Selected:/)
      expect(confirmation).toBeInTheDocument()
      expect(confirmation.textContent).toContain('Mon')
      expect(confirmation.textContent).toContain('9:00 AM - 3:00 PM')
      
      // Should have checkmark
      expect(screen.getByText('✓')).toBeInTheDocument()
    })
  })

  describe('Business Rule Validation', () => {
    it('should prevent past date selection by starting from tomorrow', async () => {
      vi.setSystemTime(new Date('2024-03-15T15:00:00')) // Friday afternoon
      
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      const buttons = screen.getAllByRole('button')
      const dateButtons = buttons.filter(btn => 
        btn.textContent && (
          btn.textContent.includes('Mon') || 
          btn.textContent.includes('Tue') || 
          btn.textContent.includes('Wed') || 
          btn.textContent.includes('Thu') || 
          btn.textContent.includes('Fri')
        )
      )

      // First available date should be Monday (next business day)
      const firstDateButton = dateButtons[0]
      expect(firstDateButton.textContent).toContain('Mon')
      expect(firstDateButton.textContent).toContain('18') // March 18, 2024
    })

    it('should handle date conflicts in cart validation', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      const conflictDate = new Date('2024-03-18') // Monday
      const conflictTime = '9:00 AM - 3:00 PM'
      
      // Add two camp bookings for same date/time
      addItem({
        id: 'camp-1',
        name: 'Camp 1',
        category: 'camps',
        type: 'day-camp',
        price: 85,
        shortDescription: 'Test camp 1',
        fullDescription: 'Test camp 1',
        ageRange: '6-12',
        duration: '9am-3pm',
        location: 'Neutral Bay',
        maxCapacity: 12,
        isActive: true,
        features: [],
        addOns: []
      }, {
        quantity: 1,
        selectedDate: conflictDate,
        selectedTimeSlot: conflictTime
      })
      
      addItem({
        id: 'camp-2',
        name: 'Camp 2',
        category: 'camps',
        type: 'day-camp',
        price: 85,
        shortDescription: 'Test camp 2',
        fullDescription: 'Test camp 2',
        ageRange: '6-12',
        duration: '9am-3pm',
        location: 'Neutral Bay',
        maxCapacity: 12,
        isActive: true,
        features: [],
        addOns: []
      }, {
        quantity: 1,
        selectedDate: conflictDate,
        selectedTimeSlot: conflictTime
      })

      // Add same student to both bookings
      const items = useEnhancedCartStore.getState().items
      const student = {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      }

      useEnhancedCartStore.getState().addStudent(items[0].id, student)
      useEnhancedCartStore.getState().addStudent(items[1].id, student)

      const validation = useEnhancedCartStore.getState().getValidation()
      
      // Should detect overlapping bookings
      const overlapWarnings = validation.warnings.filter(warning => 
        warning.message.includes('overlapping bookings')
      )
      
      expect(overlapWarnings.length).toBeGreaterThan(0)
    })

    it('should format dates consistently in Australian format', async () => {
      const testDate = new Date('2024-03-18') // Monday
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={vi.fn()}
          selectedDate={testDate}
          selectedTimeSlot="9:00 AM - 3:00 PM"
        />
      )

      // Should use Australian date format (weekday, month, day)
      expect(screen.getByText(/Mon, Mar 18/)).toBeInTheDocument()
    })

    it('should handle month boundaries correctly', async () => {
      vi.setSystemTime(new Date('2024-03-29')) // Friday near month end
      
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      const buttons = screen.getAllByRole('button')
      const dateButtons = buttons.filter(btn => 
        btn.textContent && (
          btn.textContent.includes('Mon') || 
          btn.textContent.includes('Tue') || 
          btn.textContent.includes('Wed') || 
          btn.textContent.includes('Thu') || 
          btn.textContent.includes('Fri')
        )
      )

      // Should include dates from next month
      const aprilDates = dateButtons.filter(btn => 
        btn.textContent?.includes('Apr')
      )
      
      expect(aprilDates.length).toBeGreaterThan(0)
    })

    it('should maintain time zone consistency', async () => {
      const testDate = new Date('2024-03-18T00:00:00+11:00') // Australian Eastern Time
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={vi.fn()}
          selectedDate={testDate}
          selectedTimeSlot="9:00 AM - 3:00 PM"
        />
      )

      // Should display date correctly regardless of timezone
      expect(screen.getByText(/Mon, Mar 18/)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid product IDs gracefully', async () => {
      const mockOnDateSelect = vi.fn()
      
      expect(() => 
        render(
          <DateTimeSelector
            productId="invalid-product-123"
            onDateSelect={mockOnDateSelect}
            selectedDate={null}
            selectedTimeSlot={null}
          />
        )
      ).not.toThrow()
    })

    it('should handle empty time slots gracefully', async () => {
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="unknown-product-type"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      // Should still render date selection even with no time slots
      expect(screen.getByText('Select Date')).toBeInTheDocument()
      expect(screen.getByText('Select Time')).toBeInTheDocument()
    })

    it('should handle future date limits', async () => {
      vi.setSystemTime(new Date('2024-03-01'))
      
      const mockOnDateSelect = vi.fn()
      
      render(
        <DateTimeSelector
          productId="day-camp-1"
          onDateSelect={mockOnDateSelect}
          selectedDate={null}
          selectedTimeSlot={null}
        />
      )

      // Component generates 30 days, shows first 20
      const buttons = screen.getAllByRole('button')
      const dateButtons = buttons.filter(btn => 
        btn.textContent && (
          btn.textContent.includes('Mon') || 
          btn.textContent.includes('Tue') || 
          btn.textContent.includes('Wed') || 
          btn.textContent.includes('Thu') || 
          btn.textContent.includes('Fri')
        )
      )

      expect(dateButtons).toHaveLength(20)
    })
  })
})

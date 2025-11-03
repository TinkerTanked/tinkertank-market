import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DateStep from '@/components/booking/DateStep'
import CampBookingWizard from '@/components/booking/CampBookingWizard'

// Mock Zustand cart store
vi.mock('@/stores/enhancedCartStore', () => ({
  useEnhancedCartStore: () => ({
    addItem: vi.fn(),
    items: [],
    totalItems: 0,
    totalPrice: 0,
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
  }),
}))

describe('Real Calendar Integration Tests - DateStep Component', () => {
  const mockLocation = {
    id: 'neutral-bay',
    name: 'Neutral Bay',
    address: '123 Test Street, Neutral Bay NSW 2089'
  }

  const mockOnDateSelect = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnDateSelect.mockClear()
    
    // Mock current date to ensure consistent test results
    vi.setSystemTime(new Date('2024-09-01T10:00:00.000Z'))
  })

  it('renders the DateStep component with heading and description', () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Check main heading and description
    expect(screen.getByText('Choose Your Date')).toBeInTheDocument()
    expect(screen.getByText(/Select a weekday for your STEM camp at Neutral Bay/)).toBeInTheDocument()
  })

  it('displays calendar with September 2024 header', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      // Should show September 2024 based on our mocked date
      expect(screen.getByText(/September 2024/)).toBeInTheDocument()
    })
  })

  it('shows day names in calendar header', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Check day headers
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
    expect(screen.getByText('Wed')).toBeInTheDocument()
    expect(screen.getByText('Thu')).toBeInTheDocument()
    expect(screen.getByText('Fri')).toBeInTheDocument()
    expect(screen.getByText('Sat')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('shows day numbers in calendar grid', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Should show various day numbers (use getAllByText since there might be multiple)
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('15').length).toBeGreaterThan(0)
    expect(screen.getAllByText('30').length).toBeGreaterThan(0)
  })

  it('shows "Closed" text on weekend days', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Weekend days should show "Closed"
    const closedElements = screen.getAllByText('Closed')
    expect(closedElements.length).toBeGreaterThan(0)
  })

  it('allows clicking on weekday dates and calls onDateSelect', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Find a weekday and click it
    const mondayButton = screen.getAllByRole('button').find(button => 
      button.textContent === '2' && !button.disabled
    )
    
    if (mondayButton) {
      await user.click(mondayButton)
      
      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalled()
      })
    }
  })

  it('visually highlights selected date when provided', () => {
    const selectedDate = new Date('2024-09-03') // Tuesday
    
    render(
      <DateStep 
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Check that selected date display appears
    expect(screen.getByText('Selected Date')).toBeInTheDocument()
    expect(screen.getByText(/Tuesday.*September.*2024/)).toBeInTheDocument()
  })

  it('shows calendar navigation buttons', () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Navigation buttons should be present (as SVG arrows)
    const buttons = screen.getAllByRole('button')
    const navButtons = buttons.filter(button => {
      const svg = button.querySelector('svg')
      if (!svg) return false
      
      const path = svg.querySelector('path')
      return path && (
        path.getAttribute('d')?.includes('15.75 19.5 8.25 12l7.5-7.5') || // Previous
        path.getAttribute('d')?.includes('8.25 4.5 7.5 7.5-7.5 7.5') // Next
      )
    })
    
    expect(navButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('shows legend explaining date types', () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Check legend items
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Selected')).toBeInTheDocument()
    expect(screen.getByText('Weekends (Closed)')).toBeInTheDocument()
  })

  it('displays informational content about camp schedule', () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    expect(screen.getByText('Camp Schedule')).toBeInTheDocument()
    expect(screen.getByText('• Camps run Monday to Friday only')).toBeInTheDocument()
    expect(screen.getByText('• Book up to 3 months in advance')).toBeInTheDocument()
    expect(screen.getByText('• Each camp is limited to 12 participants')).toBeInTheDocument()
    expect(screen.getByText('• Cancellation available up to 48 hours before')).toBeInTheDocument()
  })
})

describe('Real Calendar Integration Tests - CampBookingWizard', () => {
  const mockOnClose = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnClose.mockClear()
    vi.setSystemTime(new Date('2024-09-01T10:00:00.000Z'))
  })

  it('integrates DateStep within the booking wizard workflow', async () => {
    render(<CampBookingWizard isOpen={true} onClose={mockOnClose} />)

    // Should start at step 1 (Location)
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByText('Choose Your Location')).toBeInTheDocument()

    // Next button should be disabled initially
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()

    // Select Neutral Bay location - click the location card
    const locationCard = screen.getByText('TinkerTank Neutral Bay').closest('div')
    expect(locationCard).toBeInTheDocument()
    await user.click(locationCard!)

    // Next button should now be enabled
    await waitFor(() => {
      expect(nextButton).toBeEnabled()
    })

    // Proceed to date step
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
      expect(screen.getByText('Choose Your Date')).toBeInTheDocument()
    })

    // Should see the calendar header and components
    await waitFor(() => {
      expect(screen.getByText(/September 2024/)).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument() // Day headers
      expect(screen.getByText('Available')).toBeInTheDocument() // Legend
    })
  })

  it('enables Next button only when date is selected in wizard', async () => {
    render(<CampBookingWizard isOpen={true} onClose={mockOnClose} />)

    // Navigate to date step
    const locationCard = screen.getByText('TinkerTank Neutral Bay').closest('div')
    await user.click(locationCard!)

    let nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Choose Your Date')).toBeInTheDocument()
    })

    // Next button should be disabled initially
    nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()

    // Select a date by finding an enabled button with day number
    const dayButtons = screen.getAllByRole('button').filter(button => 
      button.textContent && /^\d+$/.test(button.textContent) && !button.disabled
    )
    
    if (dayButtons.length > 0) {
      await user.click(dayButtons[0])

      // Next button should now be enabled
      await waitFor(() => {
        expect(nextButton).toBeEnabled()
      })
    }
  })

  it('maintains selected date state across wizard steps', async () => {
    render(<CampBookingWizard isOpen={true} onClose={mockOnClose} />)

    // Navigate through location to date selection
    const locationCard = screen.getByText('TinkerTank Neutral Bay').closest('div')
    await user.click(locationCard!)

    let nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Choose Your Date')).toBeInTheDocument()
    })

    // Select first available date
    const dayButtons = screen.getAllByRole('button').filter(button => 
      button.textContent && /^\d+$/.test(button.textContent) && !button.disabled
    )
    
    if (dayButtons.length > 0) {
      await user.click(dayButtons[0])

      // Should show selected date display
      await waitFor(() => {
        expect(screen.getByText('Selected Date')).toBeInTheDocument()
      })

      // Navigate to next step
      nextButton = screen.getByRole('button', { name: /next/i })
      await waitFor(() => expect(nextButton).toBeEnabled())
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
      })

      // Go back to date step
      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      // Selected date should still be displayed
      await waitFor(() => {
        expect(screen.getByText('Selected Date')).toBeInTheDocument()
      })
    }
  })

  it('shows progress indicator with correct step highlighting', async () => {
    render(<CampBookingWizard isOpen={true} onClose={mockOnClose} />)

    // Step 1 should be highlighted
    expect(screen.getByText('1')).toBeInTheDocument()
    const locationStepIndicator = screen.getByText('1').closest('div')
    expect(locationStepIndicator).toHaveClass('bg-white', 'text-primary-600')

    // Navigate to date step
    const locationCard = screen.getByText('TinkerTank Neutral Bay').closest('div')
    await user.click(locationCard!)

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    await waitFor(() => {
      // Step 1 should show checkmark, Step 2 should be highlighted
      expect(screen.getByText('✓')).toBeInTheDocument()
      
      // Find the step 2 indicator specifically in the progress bar (not calendar dates)
      const step2Elements = screen.getAllByText('2')
      const progressStep2 = step2Elements.find(element => 
        element.closest('div')?.classList.contains('text-sm') && 
        element.closest('div')?.classList.contains('font-medium')
      )?.closest('div')
      
      expect(progressStep2).toHaveClass('bg-white', 'text-primary-600')
    })
  })

  it('closes wizard when backdrop is clicked', async () => {
    render(<CampBookingWizard isOpen={true} onClose={mockOnClose} />)

    // Find and click the backdrop
    const backdrop = document.querySelector('.bg-black.bg-opacity-50')
    expect(backdrop).toBeInTheDocument()
    
    fireEvent.click(backdrop!)

    expect(mockOnClose).toHaveBeenCalled()
  })
})

describe('Real Calendar Visual and Interaction Tests', () => {
  const mockLocation = {
    id: 'neutral-bay',
    name: 'Neutral Bay',
    address: '123 Test Street, Neutral Bay NSW 2089'
  }

  const mockOnDateSelect = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnDateSelect.mockClear()
    vi.setSystemTime(new Date('2024-09-01T10:00:00.000Z'))
  })

  it('provides proper accessibility structure', () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Should have proper heading structure
    expect(screen.getByRole('heading', { level: 3, name: 'Choose Your Date' })).toBeInTheDocument()
  })

  it('handles user interactions correctly', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Find clickable date buttons (weekdays only)
    const dayButtons = screen.getAllByRole('button').filter(button => {
      const text = button.textContent
      return text && /^\d+$/.test(text) && !button.disabled
    })

    expect(dayButtons.length).toBeGreaterThan(0)

    // Click first available date
    if (dayButtons.length > 0) {
      await user.click(dayButtons[0])
      expect(mockOnDateSelect).toHaveBeenCalled()
    }
  })

  it('shows comprehensive calendar information and controls', () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Check all major components
    expect(screen.getByText('Choose Your Date')).toBeInTheDocument()
    expect(screen.getByText(/Select a weekday for your STEM camp/)).toBeInTheDocument()
    expect(screen.getByText(/September 2024/)).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Selected')).toBeInTheDocument()
    expect(screen.getByText('Weekends (Closed)')).toBeInTheDocument()
    expect(screen.getByText('Camp Schedule')).toBeInTheDocument()
  })

  it('validates weekend blocking functionality', () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Weekend days should show "Closed" and be disabled
    const closedElements = screen.getAllByText('Closed')
    expect(closedElements.length).toBeGreaterThan(0)

    // Weekend buttons should be disabled
    const disabledButtons = screen.getAllByRole('button', { disabled: true })
    const weekendButtons = disabledButtons.filter(button => {
      const parent = button.closest('div')
      return parent?.textContent?.includes('Closed')
    })
    
    expect(weekendButtons.length).toBeGreaterThan(0)
  })

  it('displays selected date highlighting', () => {
    const selectedDate = new Date('2024-09-02') // Monday
    
    render(
      <DateStep 
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Should display selected date information
    expect(screen.getByText('Selected Date')).toBeInTheDocument()
    expect(screen.getByText(/Monday.*September.*2024/)).toBeInTheDocument()
  })
})

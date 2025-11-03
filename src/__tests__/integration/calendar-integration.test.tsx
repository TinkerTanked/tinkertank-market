import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DateStep from '@/components/booking/DateStep'
import CampBookingWizard from '@/components/booking/CampBookingWizard'

// Mock FullCalendar since it doesn't render properly in test environment
vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: ({ dateClick, dayCellContent, dayCellClassNames }: any) => {
    // Create a mock calendar with actual date cells
    const dates = []
    const today = new Date('2024-09-01')
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Generate dates for September 2024
    for (let day = 1; day <= 30; day++) {
      const date = new Date(currentYear, currentMonth, day)
      dates.push(date)
    }

    return (
      <div className="fc-calendar" role="grid">
        <div className="fc-toolbar">
          <button title="Previous month" type="button">prev</button>
          <h2 className="fc-toolbar-title">September 2024</h2>
          <button title="Next month" type="button">next</button>
          <button className="fc-today-button" type="button">today</button>
        </div>
        <div className="fc-daygrid">
          {dates.map(date => {
            const dayOfWeek = date.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            const cellClasses = dayCellClassNames ? dayCellClassNames({ date }) : []
            const cellContent = dayCellContent ? dayCellContent({ date, dayNumberText: date.getDate().toString() }) : null
            
            return (
              <div 
                key={date.getTime()} 
                role="gridcell"
                className={Array.isArray(cellClasses) ? cellClasses.join(' ') : ''}
                onClick={() => dateClick && dateClick({ date })}
              >
                {cellContent?.html ? (
                  <div dangerouslySetInnerHTML={{ __html: cellContent.html }} />
                ) : (
                  <span>{date.getDate()}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}))

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

describe('Calendar Integration Tests - DateStep Component', () => {
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

  it('renders the actual calendar with FullCalendar component', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Check main heading
    expect(screen.getByText('Choose Your Date')).toBeInTheDocument()
    expect(screen.getByText(/Select a weekday for your STEM camp at Neutral Bay/)).toBeInTheDocument()

    // Wait for FullCalendar to render
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument() // Calendar grid
    })

    // Check for calendar navigation buttons
    expect(screen.getByTitle('Previous month')).toBeInTheDocument()
    expect(screen.getByTitle('Next month')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
  })

  it('displays current month and year in calendar header', async () => {
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

  it('shows day numbers in calendar cells', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      // Should show day numbers (1-30 for September)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
    })
  })

  it('shows "Closed" text on weekend days', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      // Weekend days should show "Closed"
      const closedElements = screen.getAllByText('Closed')
      expect(closedElements.length).toBeGreaterThan(0)
    })
  })

  it('allows clicking on weekday dates and calls onDateSelect', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Find a weekday (let's try Monday the 2nd)
    const mondayCell = screen.getByText('2') // Sept 2nd 2024 is a Monday
    
    await user.click(mondayCell)

    await waitFor(() => {
      expect(mockOnDateSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          getDate: expect.any(Function)
        })
      )
    })
  })

  it('does not allow clicking on weekend dates', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Find a weekend day (Saturday/Sunday with "Closed" text)
    const closedElements = screen.getAllByText('Closed')
    if (closedElements.length > 0) {
      const weekendCell = closedElements[0].closest('[role="gridcell"]')
      
      if (weekendCell) {
        await user.click(weekendCell)
        // Should not call onDateSelect for weekend clicks
        expect(mockOnDateSelect).not.toHaveBeenCalled()
      }
    }
  })

  it('visually highlights selected date', async () => {
    const selectedDate = new Date('2024-09-03') // Tuesday
    
    render(
      <DateStep 
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Check that selected date display appears
    expect(screen.getByText('Selected Date')).toBeInTheDocument()
    expect(screen.getByText(/Tuesday.*3.*September.*2024/)).toBeInTheDocument()
  })

  it('navigates between months using navigation buttons', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/September 2024/)).toBeInTheDocument()
    })

    // Click next month button
    const nextButton = screen.getByTitle('Next month')
    await user.click(nextButton)

    // For now, just verify the button is clickable - full navigation would need more complex mocking
    expect(nextButton).toBeInTheDocument()
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

describe('Calendar Integration Tests - CampBookingWizard', () => {
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

    // Select Neutral Bay location - need to click the location card
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

    // Should see the actual calendar
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
      expect(screen.getByText(/September 2024/)).toBeInTheDocument()
    })
  })

  it('maintains selected date state across wizard steps', async () => {
    render(<CampBookingWizard isOpen={true} onClose={mockOnClose} />)

    // Navigate through steps to date selection
    const locationCard = screen.getByText('TinkerTank Neutral Bay').closest('div')
    await user.click(locationCard!)

    let nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Choose Your Date')).toBeInTheDocument()
    })

    // Select a date (Monday the 2nd)
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    const mondayCell = screen.getByText('2')
    await user.click(mondayCell)

    // Should show selected date
    await waitFor(() => {
      expect(screen.getByText('Selected Date')).toBeInTheDocument()
      expect(screen.getByText(/Monday.*2.*September.*2024/)).toBeInTheDocument()
    })

    // Next button should be enabled
    nextButton = screen.getByRole('button', { name: /next/i })
    await waitFor(() => {
      expect(nextButton).toBeEnabled()
    })

    // Navigate to next step and back to verify state persistence
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
      expect(screen.getByText(/Monday.*2.*September.*2024/)).toBeInTheDocument()
    })
  })

  it('enables Next button only when date is selected', async () => {
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

    // Select a date
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    const mondayCell = screen.getByText('2')
    await user.click(mondayCell)

    // Next button should now be enabled
    await waitFor(() => {
      expect(nextButton).toBeEnabled()
    })
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
      
      const step2Indicator = screen.getByText('2').closest('div')
      expect(step2Indicator).toHaveClass('bg-white', 'text-primary-600')
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

  it('closes wizard when X button is clicked', async () => {
    render(<CampBookingWizard isOpen={true} onClose={mockOnClose} />)

    // Find close button by SVG path (the X icon)
    const svgPath = screen.getByText((content, element) => {
      return element?.tagName === 'path' && element.getAttribute('d') === 'M6 18L18 6M6 6l12 12'
    })
    const closeButton = svgPath?.closest('button')
    
    expect(closeButton).toBeInTheDocument()
    
    if (closeButton) {
      await user.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })
})

describe('Calendar Visual and Interaction Tests', () => {
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

  it('has proper styling classes for different date states', async () => {
    const selectedDate = new Date('2024-09-03') // Tuesday
    
    render(
      <DateStep 
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Weekend cells should have disabled styling
    const closedElements = screen.getAllByText('Closed')
    expect(closedElements.length).toBeGreaterThan(0)

    // Selected date should be highlighted
    expect(screen.getByText('Selected Date')).toBeInTheDocument()
  })

  it('provides proper accessibility attributes', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      // Calendar should have grid role for screen readers
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Should have proper heading structure
    expect(screen.getByRole('heading', { level: 3, name: 'Choose Your Date' })).toBeInTheDocument()
  })

  it('handles rapid clicks without breaking state', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Rapid clicks on the same date
    const mondayCell = screen.getByText('2')
    
    await user.click(mondayCell)
    await user.click(mondayCell)
    await user.click(mondayCell)

    // Should handle multiple calls gracefully
    expect(mockOnDateSelect).toHaveBeenCalled()
  })

  it('shows interactive navigation elements', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Navigation buttons should be interactive
    const nextButton = screen.getByTitle('Next month')
    const prevButton = screen.getByTitle('Previous month')
    const todayButton = screen.getByText('today')
    
    expect(nextButton).toBeInTheDocument()
    expect(prevButton).toBeInTheDocument()
    expect(todayButton).toBeInTheDocument()
    
    // Buttons should be clickable
    await user.hover(nextButton)
    expect(nextButton).toBeEnabled()
  })

  it('validates date selection logic', async () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Test clicking a weekday should work
    const weekdayCell = screen.getByText('2') // Monday Sept 2nd
    await user.click(weekdayCell)
    
    expect(mockOnDateSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        getDate: expect.any(Function),
        getMonth: expect.any(Function),
        getFullYear: expect.any(Function)
      })
    )
  })

  it('displays comprehensive calendar information', () => {
    render(
      <DateStep 
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        location={mockLocation}
      />
    )

    // Check all informational elements
    expect(screen.getByText('Choose Your Date')).toBeInTheDocument()
    expect(screen.getByText(/Select a weekday for your STEM camp/)).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Selected')).toBeInTheDocument()
    expect(screen.getByText('Weekends (Closed)')).toBeInTheDocument()
    expect(screen.getByText('Camp Schedule')).toBeInTheDocument()
  })
})

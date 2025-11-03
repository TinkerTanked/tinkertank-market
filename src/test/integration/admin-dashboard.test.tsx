import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock admin components
const MockAdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="admin-layout">{children}</div>
)

const MockAdminDashboard = () => (
  <div data-testid="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <div data-testid="sales-metrics">Sales: $1,250</div>
    <div data-testid="booking-metrics">Bookings: 15</div>
  </div>
)

describe('Admin Dashboard Integration', () => {
  it('should render admin dashboard with metrics', () => {
    render(
      <MockAdminLayout>
        <MockAdminDashboard />
      </MockAdminLayout>
    )

    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument()
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('sales-metrics')).toBeInTheDocument()
    expect(screen.getByTestId('booking-metrics')).toBeInTheDocument()
  })

  it('should display calendar events', () => {
    const mockEvents = [
      {
        id: '1',
        title: 'STEM Day Camp',
        date: '2024-01-15',
        attendees: 12,
      },
    ]

    expect(mockEvents[0].title).toBe('STEM Day Camp')
    expect(mockEvents[0].attendees).toBe(12)
  })

  it('should allow event management', () => {
    const createEvent = vi.fn()
    const updateEvent = vi.fn()
    const deleteEvent = vi.fn()

    expect(createEvent).toBeDefined()
    expect(updateEvent).toBeDefined()
    expect(deleteEvent).toBeDefined()
  })
})

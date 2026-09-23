import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CampBookingFlow from '@/components/booking/CampBookingFlow'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('location=neutral-bay&source=camp_location_hero')
}))

vi.mock('@/components/booking/LocationStep', () => ({
  default: ({ selectedLocation }: { selectedLocation: { id: string } | null }) => (
    <div data-testid='selected-location'>{selectedLocation?.id || 'none'}</div>
  )
}))
vi.mock('@/components/booking/DateStep', () => ({ default: () => <div>Date step</div> }))
vi.mock('@/components/booking/CampTypeStep', () => ({ default: () => <div>Camp type step</div> }))
vi.mock('@/components/booking/shared/BookingShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))
vi.mock('@/components/booking/shared/BookingSummary', () => ({
  default: () => <div>Summary</div>,
  getCampTotal: () => 0
}))
vi.mock('@/components/booking/shared/ChildrenStep', () => ({ default: () => <div>Children</div> }))
vi.mock('@/components/booking/shared/ContactStep', () => ({ default: () => <div>Contact</div> }))
vi.mock('@/components/booking/shared/ReviewStep', () => ({ default: () => <div>Review</div> }))
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }))

const recoveredManlyDraft = {
  version: 1,
  kind: 'camp',
  currentStep: 4,
  selection: {
    location: { id: 'manly-library', name: 'Manly Library', address: 'Market Place, Manly NSW 2095', capacity: 35 },
    dates: ['2026-09-29'],
    campType: {
      id: 'day-camp',
      name: 'Day Camp',
      description: 'A complete camp day',
      time: '9:00 AM - 3:00 PM',
      price: 119.99
    }
  },
  children: [],
  contact: { firstName: '', lastName: '', email: '', mobile: '' },
  emergencyContact: { sameAsBookingContact: true }
}

describe('CampBookingFlow campaign location', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const method = typeof input === 'string' && input === '/api/booking-draft' ? 'GET' : 'PUT'
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(method === 'GET' ? { draft: recoveredManlyDraft } : {})
      } as Response)
    }))
  })

  it('honours an explicit landing-page location instead of restoring a different location', async () => {
    render(<CampBookingFlow />)

    await waitFor(() => expect(screen.getByTestId('selected-location')).toHaveTextContent('neutral-bay'))
    expect(screen.queryByText('Manly Library')).not.toBeInTheDocument()
  })
})

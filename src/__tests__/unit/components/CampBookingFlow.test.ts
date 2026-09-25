import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { analyticsItems } from '@/components/booking/CampBookingFlow'
import type { CampBookingDraft } from '@/lib/bookingSchema'

function draft(childCount: number, dateCount: number): CampBookingDraft {
  return {
    version: 1,
    kind: 'camp',
    currentStep: 1,
    selection: {
      location: { id: 'neutral-bay', name: 'TinkerTank Neutral Bay', address: '50 Yeo St', capacity: 35 },
      dates: Array.from({ length: dateCount }, (_, index) => `2026-09-${28 + index}`),
      campType: {
        id: 'day-camp',
        name: 'Day Camp',
        description: 'A complete camp day',
        time: '9:00 AM - 3:00 PM',
        price: 119.99,
      },
    },
    children: Array.from({ length: childCount }, (_, index) => ({
      id: `child-${index}`,
      firstName: 'Test',
      lastName: 'Child',
      dateOfBirth: '2018-01-01',
      school: '',
      allergies: { hasDetails: false },
      supportNeeds: { hasDetails: false },
    })),
    contact: { firstName: '', lastName: '', email: '', mobile: '' },
    emergencyContact: { sameAsBookingContact: true },
  }
}

describe('camp booking analytics items', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-28T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports the quoted one-child quantity before child details are entered', () => {
    expect(analyticsItems(draft(0, 2))).toEqual([expect.objectContaining({ item_id: 'day-camp', price: 119.99, quantity: 2 })])
  })

  it('reports one unit per child and selected day after children are entered', () => {
    expect(analyticsItems(draft(2, 2))).toEqual([expect.objectContaining({ item_id: 'day-camp', price: 119.99, quantity: 4 })])
  })

  it('reports the promotional price during the Neutral Bay weekend offer', () => {
    vi.setSystemTime(new Date('2026-09-26T00:00:00.000Z'))

    expect(analyticsItems(draft(1, 1))).toEqual([expect.objectContaining({ item_id: 'day-camp', price: 109, quantity: 1 })])
  })
})

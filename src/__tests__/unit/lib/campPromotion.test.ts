import { describe, expect, it } from 'vitest'
import { getCampUnitPrice, isWeekendCampOfferActive } from '@/lib/campPromotion'

describe('weekend camp offer', () => {
  it('is active through Sunday night in Sydney and expires at midnight', () => {
    expect(isWeekendCampOfferActive(new Date('2026-09-27T13:59:59.999Z'))).toBe(true)
    expect(isWeekendCampOfferActive(new Date('2026-09-27T14:00:00.000Z'))).toBe(false)
  })

  it('discounts Neutral Bay and Manly Library Day Camps during the offer', () => {
    const duringOffer = new Date('2026-09-26T02:00:00.000Z')

    expect(getCampUnitPrice('day-camp', 'neutral-bay', 119.99, duringOffer)).toBe(109)
    expect(getCampUnitPrice('day-camp', 'TinkerTank Neutral Bay', 119.99, duringOffer)).toBe(109)
    expect(getCampUnitPrice('day-camp', 'manly-library', 119.99, duringOffer)).toBe(109)
    expect(getCampUnitPrice('day-camp', 'Manly Library', 119.99, duringOffer)).toBe(109)
    expect(getCampUnitPrice('day-camp', 'Another Location', 119.99, duringOffer)).toBe(119.99)
    expect(getCampUnitPrice('all-day-camp', 'Neutral Bay', 149.99, duringOffer)).toBe(149.99)
  })

  it('restores the standard price when the offer ends', () => {
    expect(getCampUnitPrice('day-camp', 'Neutral Bay', 119.99, new Date('2026-09-27T14:00:00.000Z'))).toBe(119.99)
    expect(getCampUnitPrice('day-camp', 'Neutral Bay', 109, new Date('2026-09-27T14:00:00.000Z'))).toBe(119.99)
  })
})

export const NEUTRAL_BAY_WEEKEND_OFFER = {
  startsAt: new Date('2026-09-25T14:00:00.000Z'),
  endsAt: new Date('2026-09-27T13:59:59.999Z'),
  productId: 'day-camp',
  price: 109,
  standardPrice: 119.99,
} as const

function isNeutralBay(location: string | undefined): boolean {
  return (
    location
      ?.toLowerCase()
      .replace(/[^a-z]/g, '')
      .includes('neutralbay') ?? false
  )
}

export function isNeutralBayWeekendOfferActive(now: Date = new Date()): boolean {
  return now >= NEUTRAL_BAY_WEEKEND_OFFER.startsAt && now <= NEUTRAL_BAY_WEEKEND_OFFER.endsAt
}

export function getCampUnitPrice(productId: string, location: string | undefined, standardPrice: number, now: Date = new Date()): number {
  if (productId === NEUTRAL_BAY_WEEKEND_OFFER.productId && isNeutralBay(location)) {
    if (isNeutralBayWeekendOfferActive(now)) return NEUTRAL_BAY_WEEKEND_OFFER.price

    // A saved booking draft may still contain the promotional price after the
    // deadline. Restore the normal display price; checkout independently reads
    // the authoritative database price before charging.
    if (standardPrice === NEUTRAL_BAY_WEEKEND_OFFER.price) {
      return NEUTRAL_BAY_WEEKEND_OFFER.standardPrice
    }
  }

  return standardPrice
}

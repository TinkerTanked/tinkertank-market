export const WEEKEND_CAMP_OFFER = {
  startsAt: new Date('2026-09-25T14:00:00.000Z'),
  endsAt: new Date('2026-09-27T13:59:59.999Z'),
  productId: 'day-camp',
  price: 109,
  standardPrice: 119.99,
} as const

function isWeekendOfferLocation(location: string | undefined): boolean {
  const normalizedLocation = location?.toLowerCase().replace(/[^a-z]/g, '') ?? ''
  return normalizedLocation.includes('neutralbay') || normalizedLocation.includes('manlylibrary')
}

export function isWeekendCampOfferActive(now: Date = new Date()): boolean {
  return now >= WEEKEND_CAMP_OFFER.startsAt && now <= WEEKEND_CAMP_OFFER.endsAt
}

export function getCampUnitPrice(productId: string, location: string | undefined, standardPrice: number, now: Date = new Date()): number {
  if (productId === WEEKEND_CAMP_OFFER.productId && isWeekendOfferLocation(location)) {
    if (isWeekendCampOfferActive(now)) return WEEKEND_CAMP_OFFER.price

    // A saved booking draft may still contain the promotional price after the
    // deadline. Restore the normal display price; checkout independently reads
    // the authoritative database price before charging.
    if (standardPrice === WEEKEND_CAMP_OFFER.price) {
      return WEEKEND_CAMP_OFFER.standardPrice
    }
  }

  return standardPrice
}

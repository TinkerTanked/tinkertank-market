import type { SchoolTerm } from '@/config/schoolTerms'

export type RevenueStream = 'camps' | 'parties' | 'ignite'

const DAY_MS = 24 * 60 * 60 * 1000

export function sydneyDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(date)
}

export function addDaysToKey(dateKey: string, days: number) {
  return new Date(new Date(`${dateKey}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

/** 0 = Sunday … 6 = Saturday for a calendar date. */
export function weekdayOfKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay()
}

/** Monday of the Sydney week containing this instant. */
export function sydneyWeekStart(date: Date) {
  const key = sydneyDateKey(date)
  return addDaysToKey(key, -((weekdayOfKey(key) + 6) % 7))
}

/**
 * The school holidays camps should be selling now: the holiday we are in, or
 * the next one. Holidays are the days between one term's last day and the
 * next term's first day.
 */
export function campHolidayWindow(terms: SchoolTerm[], todayKey: string) {
  const sorted = [...terms].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = addDaysToKey(sorted[i].endDate.toISOString().slice(0, 10), 1)
    const end = addDaysToKey(sorted[i + 1].startDate.toISOString().slice(0, 10), -1)
    if (end < todayKey || end < start) continue
    const season = ['', 'Autumn', 'Winter', 'Spring', 'Summer'][sorted[i].term] || 'School'
    return { name: `${season} holidays`, start: start < todayKey ? todayKey : start, end }
  }
  return null
}

/**
 * Split what an order actually took across camps, parties and Ignite, in
 * proportion to its line prices (so a credit or discount lowers each stream).
 * Ignite lines are only counted for orders paid outside Stripe subscriptions
 * (manual and invoiced bookings); subscription charges come from Stripe invoices.
 */
export function orderRevenueByStream(order: {
  totalAmount: number
  paidOutsideStripe: boolean
  items: { price: number; productType: string }[]
}): Record<RevenueStream, number> {
  const result: Record<RevenueStream, number> = { camps: 0, parties: 0, ignite: 0 }
  const lineTotal = order.items.reduce((sum, item) => sum + item.price, 0)
  if (lineTotal <= 0) return result
  const ratio = order.totalAmount / lineTotal
  for (const item of order.items) {
    const stream: RevenueStream | null =
      item.productType === 'CAMP' ? 'camps' : item.productType === 'BIRTHDAY' ? 'parties' : order.paidOutsideStripe ? 'ignite' : null
    if (stream) result[stream] += item.price * ratio
  }
  return result
}

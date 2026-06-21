import { describe, it, expect } from 'vitest'
import { toLocalDateString } from '@/lib/dates'

describe('toLocalDateString', () => {
  it('returns the local calendar day for a local-midnight Date', () => {
    // A date picked in the UI is a local-midnight Date. The serialized value
    // must be that same calendar day, NOT the UTC-shifted day that
    // Date.toISOString() would produce for timezones ahead of UTC.
    const localMidnight = new Date(2026, 6, 6) // 6 July 2026, local time
    expect(toLocalDateString(localMidnight)).toBe('2026-07-06')
  })

  it('zero-pads month and day', () => {
    expect(toLocalDateString(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('accepts an ISO string and returns its local calendar day', () => {
    const iso = new Date(2026, 6, 6).toISOString()
    expect(toLocalDateString(iso)).toBe('2026-07-06')
  })
})

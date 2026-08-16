import { fromZonedTime } from 'date-fns-tz'
import { IGNITE_SESSIONS, type IgniteSessionConfig } from '@/config/igniteProducts'
import { DAY_NAME_TO_NUMBER, getSubscriptionStartTerm, type SchoolTerm } from '@/config/schoolTerms'

export const SYDNEY_TZ = 'Australia/Sydney'

/**
 * Ignite sessions are configured in code (src/config/igniteProducts.ts) but the
 * booking pipeline needs a real Product row for the Booking/OrderItem foreign
 * keys. We use the config session id (e.g. "ignite-balgowlah-wed") directly as
 * the Product.id so the mapping is stable and reversible. See
 * scripts/seed-ignite-products-locations.ts which seeds those Product rows.
 */
export function igniteProductId(sessionId: string): string {
  return sessionId
}

export function getIgniteSessionConfig(sessionId: string): IgniteSessionConfig | undefined {
  return IGNITE_SESSIONS.find(s => s.id === sessionId)
}

export function igniteDurationMinutes(session: IgniteSessionConfig): number {
  const [sh, sm] = session.startTime.split(':').map(Number)
  const [eh, em] = session.endTime.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

export interface IgniteOccurrence {
  start: Date
  end: Date
}

/**
 * All occurrences of a session within a term, on or after `from`, returned as
 * UTC instants derived from the session's Sydney wall-clock start/end times.
 *
 * Term dates are treated as Sydney calendar dates. Weekday is derived with
 * getUTCDay() on the UTC-midnight calendar date, which is stable regardless of
 * server timezone, and the actual instant is built with fromZonedTime so DST is
 * handled correctly.
 */
export function getIgniteOccurrences(
  session: IgniteSessionConfig,
  term: SchoolTerm,
  from: Date
): IgniteOccurrence[] {
  const dayNumbers = new Set(session.dayOfWeek.map(d => DAY_NAME_TO_NUMBER[d.toLowerCase()]))
  const occurrences: IgniteOccurrence[] = []

  const cursor = new Date(
    Date.UTC(term.startDate.getUTCFullYear(), term.startDate.getUTCMonth(), term.startDate.getUTCDate())
  )
  const termEnd = new Date(
    Date.UTC(term.endDate.getUTCFullYear(), term.endDate.getUTCMonth(), term.endDate.getUTCDate())
  )

  while (cursor <= termEnd) {
    if (dayNumbers.has(cursor.getUTCDay())) {
      const y = cursor.getUTCFullYear()
      const m = String(cursor.getUTCMonth() + 1).padStart(2, '0')
      const d = String(cursor.getUTCDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      const start = fromZonedTime(`${dateStr}T${session.startTime}:00`, SYDNEY_TZ)
      const end = fromZonedTime(`${dateStr}T${session.endTime}:00`, SYDNEY_TZ)
      if (start >= from) {
        occurrences.push({ start, end })
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return occurrences
}

/**
 * The term a new subscription should schedule into (current term, or the next
 * term if we're currently in a school holiday) plus its future occurrences.
 * Returns null if there is no configured term (e.g. dates not yet added).
 */
export function getIgniteScheduleFrom(
  session: IgniteSessionConfig,
  from: Date = new Date()
): { term: SchoolTerm; occurrences: IgniteOccurrence[] } | null {
  const term = getSubscriptionStartTerm(from)
  if (!term) return null
  return { term, occurrences: getIgniteOccurrences(session, term, from) }
}

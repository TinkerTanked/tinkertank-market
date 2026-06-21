/**
 * Serialize a Date (or date-ish value) to a local calendar date string
 * (`yyyy-MM-dd`) using the browser's local timezone.
 *
 * This MUST be used instead of `Date.toISOString()` when sending a
 * user-selected booking date to the API. `toISOString()` converts to UTC,
 * which rolls the calendar day backwards for timezones ahead of UTC
 * (e.g. Australia/Sydney is UTC+10/+11), causing bookings to be stored —
 * and displayed — one day early. See TIMEZONE_TECH_DEBT.md.
 */
export function toLocalDateString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

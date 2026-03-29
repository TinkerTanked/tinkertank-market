# Timezone Technical Debt

## Problem

All dates/times are stored as UTC in PostgreSQL, but the business operates in **Australia/Sydney (AEST/AEDT, UTC+10/+11)**. JavaScript's `Date` object uses the server's local timezone for `setHours()`/`getHours()`, which on our EKS pods is UTC. This has caused:

1. **Bookings appearing on wrong days** — `new Date('2026-04-19').setHours(9, 0, 0, 0)` creates a UTC midnight date that can shift to Saturday/Sunday depending on how the date string is parsed
2. **Weekend bookings** — Dates like April 19 (Sunday) getting bookings because the checkout stores `selectedDate: '2026-04-19'` without validating it's a weekday
3. **Inconsistent date handling** — Some code uses `setHours()` (local), some uses `setUTCHours()` (UTC), some constructs dates with `'T00:00:00.000Z'` suffix, leading to different behaviours depending on server timezone

## Current Workarounds

- All `setHours()` calls in booking-creation paths have been changed to `setUTCHours()`
- Reconciliation scripts use UTC consistently
- Weekend bookings are caught and shifted by cleanup scripts

## Recommended Fix: Use a Proper Date/Time Library

Consider adopting **[date-fns-tz](https://github.com/marnusw/date-fns-tz)** or **[Luxon](https://moment.github.io/luxon/)** to:

1. **Store dates as AEST-aware** — Convert all date inputs to `Australia/Sydney` before storing
2. **Create a utility module** like `src/lib/dates.ts` with helpers:
   ```typescript
   import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'

   const TIMEZONE = 'Australia/Sydney'

   export function campStartTime(dateStr: string, isAllDay: boolean): Date {
     // '2026-04-20' + 9am AEST → correct UTC timestamp
     return zonedTimeToUtc(`${dateStr} 09:00:00`, TIMEZONE)
   }

   export function campEndTime(dateStr: string, isAllDay: boolean): Date {
     const hour = isAllDay ? 17 : 15
     return zonedTimeToUtc(`${dateStr} ${hour}:00:00`, TIMEZONE)
   }

   export function isWeekday(dateStr: string): boolean {
     const d = new Date(dateStr + 'T00:00:00')
     const day = d.getDay()
     return day !== 0 && day !== 6
   }
   ```
3. **Validate at checkout** — Reject weekend dates at the API level
4. **Add weekday validation to the booking wizard UI** — Don't let users select weekends

## Affected Files

- `src/app/api/stripe/webhooks/route.ts` — Booking creation from webhook (FIXED: uses setUTCHours)
- `src/app/api/stripe/create-checkout-session/route.ts` — Date parsing from frontend
- `src/app/api/admin/bookings/bundles/route.ts` — Admin bundle creation (FIXED: uses setUTCHours)
- `src/app/api/admin/bookings/bundles/[orderId]/route.ts` — Single bundle add (FIXED: uses setUTCHours)
- `src/lib/events.ts` — Calendar event creation
- `src/data/closureDates.ts` — Closure date checking

## Priority

**High** — This has caused repeated production data issues requiring manual reconciliation scripts.

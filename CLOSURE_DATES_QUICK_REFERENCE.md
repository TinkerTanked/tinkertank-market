# Closure Dates - Quick Reference Guide

## Adding a New Closure Date

### Option 1: Recurring Annual Date (e.g., Public Holiday)

Edit `/src/data/closureDates.ts` → `RECURRING_CLOSURE_DATES` array:

```typescript
{
  name: 'Your Holiday Name',
  description: 'TinkerTank is closed for [reason]',
  recurring: true,
  month: 4,    // 1-12 (January = 1, December = 12)
  day: 25      // 1-31
}
```

### Option 2: One-Time Specific Date (e.g., Maintenance Day)

Edit `/src/data/closureDates.ts` → `SPECIFIC_CLOSURE_DATES` array:

```typescript
{
  name: 'Facility Maintenance',
  description: 'Annual maintenance closure',
  recurring: false,
  specificDate: new Date('2025-07-15')
}
```

## Using Closure Date Functions

```typescript
import { 
  isClosureDate, 
  getClosureInfo,
  isDateAvailableForBooking,
  getNextAvailableDate
} from '@/types'

// Check if a date is closed
const isClosed = isClosureDate(new Date('2025-12-25')) // true

// Get closure details
const info = getClosureInfo(new Date('2025-12-25'))
console.log(info?.name) // "Christmas Day"

// Check if available for booking (not weekend, not past, not closure)
const isAvailable = isDateAvailableForBooking(new Date('2025-03-15'))

// Get next available booking date
const nextDate = getNextAvailableDate(new Date('2025-12-24'))
// Will skip Dec 25-30 closures and weekends
```

## Current Closure Dates

### Christmas/New Year Period
- **December 25** - Christmas Day
- **December 26** - Boxing Day  
- **December 27-30** - Christmas closure period

### Public Holidays
- **January 1** - New Year's Day
- **January 26** - Australia Day

## Where Closure Dates Are Enforced

✅ **Booking UI** - Date picker visually blocks closure dates  
✅ **API Layer** - Returns 400 error if booking attempted  
✅ **Event Service** - Validates before creating events  
✅ **Seed Script** - Skips closure dates when generating sample data  

## Testing

Run closure date tests:
```bash
npm test -- closure-dates.test.ts
```

## Visual Indicators

- **Red background** on closure dates
- **"Closed" label** on calendar
- **Tooltip** showing closure name on hover
- **Legend item** showing "Public Holidays (Closed)"

## Error Messages

When attempting to book a closure date:
```
"Cannot create booking on Christmas Day. Please select a different date."
```

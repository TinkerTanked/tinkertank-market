# Business Closure Dates Implementation

## Overview
This document describes the implementation of business closure dates for the TinkerTank Market booking system. The system now prevents bookings on designated closure dates including public holidays and business-specific closure periods.

## Implementation Summary

### 1. Closure Dates Configuration
**File:** `/src/data/closureDates.ts`

Created a centralized configuration system for managing business closure dates:

- **Recurring Annual Dates:**
  - December 25-30 (Christmas/New Year period - 6 days)
  - January 1 (New Year's Day)
  - January 26 (Australia Day)

- **Features:**
  - Easy to add new closure dates (both recurring and specific one-time dates)
  - Support for recurring annual dates (e.g., Christmas every year)
  - Support for specific one-time closures (e.g., facility maintenance)
  - Utility functions for date validation and availability checking

### 2. Core Utility Functions

The `closureDates.ts` module exports the following utilities:

```typescript
// Check if a date is a closure date
isClosureDate(date: Date): boolean

// Get closure information for a specific date
getClosureInfo(date: Date): ClosureDate | null

// Get all closure dates for a given year
getClosureDatesForYear(year: number): Date[]

// Get closure dates within a date range
getClosureDatesInRange(startDate: Date, endDate: Date): Date[]

// Check if date is available for booking (not weekend, not past, not closure)
isDateAvailableForBooking(date: Date): boolean

// Get next available booking date
getNextAvailableDate(fromDate?: Date): Date
```

### 3. Type System Updates
**File:** `/src/types/index.ts`

Re-exported all closure date utilities through the main types module for easy access throughout the application:

```typescript
export {
  isClosureDate,
  getClosureInfo,
  getClosureDatesForYear,
  getClosureDatesInRange,
  isDateAvailableForBooking,
  getNextAvailableDate,
  RECURRING_CLOSURE_DATES,
  SPECIFIC_CLOSURE_DATES,
  type ClosureDate,
} from '@/data/closureDates'
```

### 4. UI Components Updated

#### DateStep Component
**File:** `/src/components/booking/DateStep.tsx`

Updates:
- Added import for `isClosureDate` and `getClosureInfo`
- Updated `handleDateClick` to block closure dates
- Updated `getDayClassName` to style closure dates with red background (`bg-red-50 text-red-500`)
- Added visual "Closed" indicator for closure dates
- Added tooltip showing closure name on hover
- Added legend item for "Public Holidays (Closed)"

Visual indicators:
- Closure dates show with red background
- "Closed" label displayed on closure dates
- Tooltip shows the specific closure name (e.g., "Christmas Day")

#### DateSelector Component
**File:** `/src/components/ui/DateSelector.tsx`

Updates:
- Added import for `isClosureDate`
- Updated `isDateSelectable` callback to exclude closure dates
- Ensures closure dates cannot be selected in any date picker

### 5. Database Seed Script
**File:** `/prisma/seed.ts`

Updates:
- Added import for `isClosureDate`
- Updated camp event generation to skip closure dates
- Events are only created on valid business days (weekdays excluding closure dates)

Change:
```typescript
// Before
if (dayOfWeek >= 1 && dayOfWeek <= 5 && campEventCount < 20) {

// After
if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isClosureDate(eventDate) && campEventCount < 20) {
```

### 6. API Validation

#### Calendar Events API
**File:** `/src/app/api/calendar/events/route.ts`

Updates:
- Added validation in `POST` endpoint to reject bookings on closure dates
- Returns appropriate error message with closure date name
- Also validates against weekends

Validation logic:
```typescript
if (isClosureDate(startDate)) {
  const closureInfo = getClosureInfo(startDate)
  return NextResponse.json({
    success: false,
    error: `Cannot create booking on ${closureInfo?.name || 'a business closure date'}`
  }, { status: 400 })
}
```

#### Event Creation Service
**File:** `/src/lib/events.ts`

Updates:
- Added validation in `createEvent` method
- Throws error if attempting to create event on closure date
- Provides descriptive error messages including closure name

### 7. Test Coverage
**File:** `/src/__tests__/closure-dates.test.ts`

Comprehensive test suite covering:

- **isClosureDate tests:**
  - Validates all Christmas closure dates (Dec 25-30)
  - Validates New Year's Day (Jan 1)
  - Validates Australia Day (Jan 26)
  - Verifies regular weekdays are not marked as closures
  - Tests multi-year functionality

- **getClosureInfo tests:**
  - Returns correct closure information
  - Returns null for non-closure dates

- **getClosureDatesForYear tests:**
  - Returns all 8 recurring closure dates
  - Dates are in chronological order

- **getClosureDatesInRange tests:**
  - Finds closures within date range
  - Handles empty ranges correctly

- **isDateAvailableForBooking tests:**
  - Blocks closure dates
  - Blocks weekends
  - Blocks past dates
  - Allows valid future weekdays

- **getNextAvailableDate tests:**
  - Skips closure dates and weekends
  - Handles year transitions

- **Edge cases:**
  - Leap years
  - Year boundaries
  - Timezone handling

Total: 25+ test cases ensuring robust closure date handling

## How to Add New Closure Dates

### Recurring Annual Date
Edit `/src/data/closureDates.ts` and add to `RECURRING_CLOSURE_DATES`:

```typescript
{
  name: 'Good Friday',
  description: 'TinkerTank is closed for Good Friday',
  recurring: true,
  month: 4,  // April
  day: 19    // Changes yearly - need to update manually or use calculation
}
```

### One-Time Specific Date
Edit `/src/data/closureDates.ts` and add to `SPECIFIC_CLOSURE_DATES`:

```typescript
{
  name: 'Facility Maintenance',
  description: 'Annual facility maintenance',
  recurring: false,
  specificDate: new Date('2025-07-15')
}
```

## System Behavior

### Booking UI
- Closure dates are visually indicated with red background
- Dates show "Closed" label
- Hover tooltip shows closure name
- Dates are not clickable/selectable

### API Level
- Attempts to book closure dates return 400 error
- Error messages include the closure name
- Validation occurs before database operations

### Database Seeding
- Seed script automatically skips closure dates
- Only valid business days get events created

## Benefits

1. **Centralized Configuration:** All closure dates in one place
2. **Type Safety:** Full TypeScript support with exported types
3. **Flexible:** Easy to add both recurring and one-time closures
4. **User-Friendly:** Clear visual indicators and helpful error messages
5. **Robust:** Multi-layer validation (UI + API + Service)
6. **Tested:** Comprehensive test coverage
7. **Future-Proof:** Designed for easy expansion

## Current Closure Dates (2025)

| Date | Closure Name |
|------|--------------|
| January 1 | New Year's Day |
| January 26 | Australia Day |
| December 25 | Christmas Day |
| December 26 | Boxing Day |
| December 27 | Christmas Closure - Day 3 |
| December 28 | Christmas Closure - Day 4 |
| December 29 | Christmas Closure - Day 5 |
| December 30 | Christmas Closure - Day 6 |

**Total:** 8 closure dates annually

## Files Modified

1. `/src/data/closureDates.ts` - NEW (Configuration)
2. `/src/types/index.ts` - Modified (Exports)
3. `/src/components/booking/DateStep.tsx` - Modified (UI)
4. `/src/components/ui/DateSelector.tsx` - Modified (UI)
5. `/prisma/seed.ts` - Modified (Database)
6. `/src/app/api/calendar/events/route.ts` - Modified (API)
7. `/src/lib/events.ts` - Modified (Service)
8. `/src/__tests__/closure-dates.test.ts` - NEW (Tests)

## Next Steps (Optional Enhancements)

1. **Admin Interface:** Create admin UI to manage closure dates dynamically
2. **Database Storage:** Move closure dates to database for dynamic updates
3. **Email Notifications:** Notify customers of upcoming closures
4. **Automatic Calculation:** Calculate moveable holidays (e.g., Easter)
5. **Location-Specific:** Support different closures per location
6. **Partial Closures:** Support partial day closures (e.g., close at 2pm)

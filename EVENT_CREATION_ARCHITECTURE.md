# Calendar Event Creation System - Architecture Summary

## Overview
Built a comprehensive calendar event creation system that automatically generates calendar events after successful payments, with full FullCalendar integration for admin views and capacity management.

## 🏗️ Database Schema Extensions

### New Models Added to Prisma Schema

#### Event Model
- **Purpose**: Core calendar events with capacity management
- **Key Fields**:
  - `id, title, description, type, status`
  - `startDateTime, endDateTime, isRecurring`
  - `maxCapacity, currentCount` (capacity management)
  - `locationId, instructorId, ageMin, ageMax`
  - `recurringTemplateId` (for recurring events)

#### RecurringTemplate Model
- **Purpose**: Templates for generating recurring events (Ignite subscriptions)
- **Key Fields**:
  - `name, description, type, startTime, endTime, duration`
  - `daysOfWeek[]` (array of weekday numbers)
  - `startDate, endDate, maxCapacity`
  - `locationId, ageMin, ageMax, isActive`

#### Schema Relationships
```prisma
Event → Location (many-to-one)
Event → Booking[] (one-to-many)
Event → RecurringTemplate (many-to-one)
Location → Event[] (one-to-many)
Booking → Event (many-to-one) // NEW eventId field
```

## 🔧 Core Service: EventCreationService

### Location: `src/lib/events.ts`

#### Key Methods:
1. **`createEventsFromOrder(orderId)`** - Main integration point
2. **`createCampEvent()`** - Single day camp events (9am-3pm/5pm)
3. **`createBirthdayEvent()`** - 2-hour birthday parties
4. **`createSubscriptionEvents()`** - Recurring weekly Ignite sessions
5. **`generateRecurringEvents(templateId)`** - Creates individual events from templates
6. **`checkEventConflict()`** - Prevents overbooking

### Business Logic Implementation:
- **Camp Times**: Day camps (9-3), All-day camps (9-5), weekdays only
- **Birthday Parties**: 2-hour duration, flexible scheduling
- **Ignite Subscriptions**: Weekly recurring sessions (default Wed 4-5pm)
- **Capacity Management**: Per-location and per-event capacity limits
- **Age Grouping**: Automatic age-appropriate event creation

## 🛜 API Endpoints

### Event CRUD Operations
```typescript
GET    /api/events              // List events with filtering
POST   /api/events              // Create single event
GET    /api/events/[id]         // Get event details
PUT    /api/events/[id]         // Update event
DELETE /api/events/[id]         // Cancel/delete event

GET    /api/events/fullcalendar // FullCalendar-formatted events
```

### Recurring Template Management
```typescript
GET    /api/events/templates           // List templates
POST   /api/events/templates           // Create template
POST   /api/events/templates/[id]/generate // Generate events
```

### Query Parameters Support:
- Date range filtering (`start`, `end`)
- Event type filtering (`CAMP`, `BIRTHDAY`, `SUBSCRIPTION`)
- Location filtering (`locationId`)
- Status filtering (`SCHEDULED`, `CANCELLED`, etc.)
- Admin vs public views

## 🔌 Payment Integration

### Webhook Integration
- **Location**: `src/app/api/stripe/webhooks/route.ts`
- **Integration Point**: After successful payment confirmation
- **Flow**:
  1. Stripe webhook receives `payment_intent.succeeded`
  2. Order status updated to `PAID`
  3. Bookings created in database
  4. **NEW**: Calendar events automatically created
  5. Events linked to bookings via `eventId`

### Error Handling
- Calendar creation failures don't break payment processing
- Comprehensive logging for debugging
- Graceful degradation if calendar system is unavailable

## 📊 FullCalendar Integration

### Event Format Conversion
- **Automatic color coding**: Status-based event colors
- **Capacity visualization**: "(5/10)" in admin titles
- **Extended properties**: Student details, allergies, booking status
- **Admin vs Public views**: Different detail levels

### Calendar Views Supported:
- **Admin View**: Full student details, capacity, instructor notes
- **Public View**: Basic availability and age ranges
- **Daily Schedule**: Detailed day-by-day breakdown
- **Capacity Analytics**: Utilization rates and revenue tracking

## 🎯 Conflict Detection & Business Rules

### Overbooking Prevention
- **Location capacity limits**: Checked against venue capacity
- **Time slot conflicts**: Prevents double-booking same time/location
- **Age group validation**: Ensures age-appropriate groupings

### Business Rule Enforcement:
- **Camps**: Weekdays only (Monday-Friday)
- **Capacity Limits**: Camps (15), Birthdays (12), Ignite (8)
- **Age Restrictions**: Product-specific age ranges enforced
- **Cancellation Rules**: 24-hour minimum notice period

## 🏢 Location Management

### Default Location Setup
- **Neutral Bay**: Primary location with Sydney timezone
- **Address**: "123 Neutral Bay Road, Neutral Bay NSW 2089"
- **Capacity**: 20 students total
- **Auto-creation**: Location created if doesn't exist

## 📋 Event Types & Scheduling

### Camp Events
- **Duration**: Day camps (6 hours), All-day camps (8 hours)
- **Schedule**: 9:00 AM - 3:00 PM / 9:00 AM - 5:00 PM
- **Capacity**: 15 students per camp
- **Booking**: Single date selection, weekdays only

### Birthday Parties
- **Duration**: 2 hours fixed
- **Schedule**: Flexible timing based on booking
- **Capacity**: 12 students per party
- **Booking**: Single date/time selection

### Ignite Subscriptions
- **Duration**: 1-hour weekly sessions
- **Schedule**: Default Wednesday 4:00 PM - 5:00 PM
- **Recurrence**: Weekly for subscription duration
- **Capacity**: 8 students per session
- **Booking**: Generates multiple events for subscription period

## 🔍 Admin Features

### Dashboard Analytics
- **Daily student counts**: Real-time capacity tracking
- **Revenue tracking**: Per-event and daily totals
- **Utilization rates**: Capacity percentage calculations
- **Staff scheduling**: Instructor assignment placeholders

### Event Management
- **Bulk operations**: Cancel multiple events
- **Status tracking**: Scheduled → In Progress → Completed
- **Student management**: Allergies, age groups, special needs
- **Instructor notes**: Internal communication system

## 📈 Capacity Analytics

### Real-time Metrics:
- **Current vs Maximum**: Live capacity tracking
- **Utilization Rates**: Percentage capacity usage
- **Revenue Attribution**: Event-based revenue tracking
- **Peak Time Analysis**: Busiest hours/days identification

### Reporting Capabilities:
- **Daily schedules**: Complete day view with student details
- **Weekly summaries**: Capacity trends and revenue
- **Event type breakdown**: Performance by product type
- **Conflict reports**: Overbooking and scheduling issues

## 🚀 Deployment Notes

### Database Migration Required
```bash
npx prisma generate
npx prisma migrate dev --name add-events-and-templates
```

### Environment Variables
- Uses existing Stripe and database configuration
- No additional environment variables required
- Timezone set to "Australia/Sydney"

### Dependencies Added
- `date-fns-tz`: Timezone handling for Sydney
- Extends existing Next.js and Prisma setup

## 🔐 Security & Validation

### Input Validation
- **Zod schemas**: Comprehensive request validation
- **Date validation**: Start/end time consistency
- **Capacity limits**: Prevent over-enrollment
- **Age restrictions**: Enforce product age limits

### Access Control
- **Admin endpoints**: Protected routes for management
- **Public endpoints**: Read-only event availability
- **Webhook security**: Stripe signature verification

## 🧪 Testing Considerations

### Critical Test Cases:
1. **Payment → Event Creation**: End-to-end webhook flow
2. **Conflict Detection**: Overbooking prevention
3. **Recurring Events**: Template generation accuracy
4. **Capacity Management**: Real-time count updates
5. **Business Rules**: Camp weekday enforcement

### Integration Points:
- Stripe webhook reliability
- Database transaction consistency
- FullCalendar data format compatibility
- Real-time capacity updates

## 📞 Next Steps for Full Implementation

1. **Run Database Migration**: Apply Prisma schema changes
2. **Configure Default Location**: Set up Neutral Bay venue
3. **Test Webhook Integration**: Verify payment → event flow
4. **Build Admin Calendar UI**: FullCalendar component creation
5. **Implement Staff Management**: Instructor assignment system
6. **Add Email Notifications**: Event confirmations and reminders

This system provides a complete foundation for automated calendar management with robust business logic, capacity control, and admin oversight capabilities.

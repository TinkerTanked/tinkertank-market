# TinkerTank Calendar System

## Overview
Integrated FullCalendar library to provide comprehensive booking and management interfaces for both customers and administrators.

## 🎯 Customer Booking Features

### BookingCalendar Component
- **Month view** for intuitive date selection
- **Available time slots** display with capacity indicators  
- **Weekend filtering** - camps unavailable on weekends
- **Interactive selection** - click dates to view time slots
- **Capacity indicators** - shows remaining spots per session
- **Product filtering** - filter by Camp, Birthday, or Ignite programs

### Customer Experience
- Program type filtering with radio buttons
- Visual indicators for available vs full sessions
- Responsive design for mobile booking
- Sydney timezone handling

## 🔧 Admin Calendar Management

### AdminCalendar Component
- **Multiple views** - Month, Week, Day switching
- **Event details** with student counts and revenue
- **Color coding** by booking status (confirmed, pending, cancelled)
- **Drag & drop** event management
- **Utilization metrics** - capacity vs bookings percentage
- **Real-time statistics** - daily revenue, bookings, capacity

### CalendarControls
- View toggle (Month/Week/Day)
- **Quick stats dashboard** - events, bookings, utilization, revenue
- **Utilization progress bar** with color coding:
  - Green: <60% utilization
  - Blue: 60-80% utilization  
  - Yellow: 80-90% utilization
  - Red: >90% utilization

### EventModal
- **Three-tab interface** - Overview, Students, Settings
- **Student management** - view enrolled students, update statuses
- **Payment tracking** - status changes, amount tracking
- **iCal export** - downloadable calendar files
- **Event editing** - title, capacity, date/time updates
- **Bulk operations** - cancel events, update multiple bookings

## 🌐 API Integration

### Calendar Events API
- `GET /api/calendar/events` - Fetch events with filtering
- `POST /api/calendar/events` - Create new bookings
- `PUT /api/calendar/events/[id]` - Update existing bookings
- `DELETE /api/calendar/events/[id]` - Cancel/delete events

### Query Parameters
- `view=customer|admin` - Customer vs admin data structure
- `productType=CAMP|BIRTHDAY|IGNITE` - Filter by program type
- `locationId` - Filter by location
- `start/end` - Date range filtering

### Data Features
- **Automatic grouping** - Multiple bookings grouped by session
- **Available slot generation** - Dynamic time slot creation
- **Capacity management** - Track bookings vs capacity limits
- **Revenue calculation** - Real-time financial tracking

## 🗂️ File Structure

```
src/
├── components/calendar/
│   ├── BookingCalendar.tsx      # Customer booking interface
│   ├── AdminCalendar.tsx        # Admin management interface  
│   ├── EventModal.tsx           # Detailed event management
│   ├── CalendarControls.tsx     # View controls and statistics
│   └── index.ts                 # Component exports
├── hooks/
│   └── useCalendar.ts           # Calendar data management hooks
├── lib/
│   └── calendar-utils.ts        # Prisma to FullCalendar conversion
├── app/
│   ├── calendar/page.tsx        # Customer booking page
│   └── admin/calendar/page.tsx  # Admin calendar page
└── app/api/calendar/
    ├── events/route.ts          # Main calendar API
    └── events/[id]/route.ts     # Individual event API
```

## 📱 Mobile Responsive
- **Touch-friendly** calendar navigation
- **Responsive layouts** for mobile/tablet viewing
- **Optimized gestures** for date selection and scrolling
- **Modal interfaces** that work on small screens

## 🎨 Visual Features
- **Status color coding** - Green (confirmed), Yellow (pending), Red (cancelled)
- **Capacity indicators** - Visual progress bars and percentages
- **Hover effects** - Interactive feedback on calendar elements
- **Clean design** - Consistent with TinkerTank branding
- **Loading states** - Smooth data fetching experience

## 🕒 Timezone & Business Logic
- **Australia/Sydney timezone** - Proper local time handling
- **Business hours** - 8AM-6PM weekday focus
- **Weekend handling** - Camps disabled on weekends
- **Past date prevention** - No booking in the past
- **Cancellation policies** - 24-hour cancellation window

## 📊 Analytics Integration
- **Daily statistics** - Revenue, bookings, capacity per day
- **Utilization tracking** - Real-time capacity monitoring
- **Revenue summaries** - Financial performance metrics
- **Export capabilities** - iCal format for external calendars

## 🔧 Technical Features
- **Real-time updates** - Auto-refresh every 30 seconds
- **Optimistic updates** - Immediate UI feedback
- **Error handling** - Graceful failure management
- **Type safety** - Full TypeScript integration
- **Database integration** - Prisma ORM with PostgreSQL

The calendar system provides an intuitive booking experience for customers while giving administrators powerful tools for managing capacity, tracking revenue, and overseeing operations across all TinkerTank programs.

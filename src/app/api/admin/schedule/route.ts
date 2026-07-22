import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO, startOfWeek, startOfMonth, endOfMonth, addDays, subDays, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { SYDNEY_TZ } from '@/lib/ignite';

interface ScheduleItem {
  id: string;
  timeSlot: string;
  studentId: string;
  studentName: string;
  productName: string;
  productType: 'DAY_CAMP' | 'ALL_DAY_CAMP' | 'BIRTHDAY' | 'IGNITE';
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  status: string;
  locationId: string;
  locationName: string;
  date: string;
  checkInAt: string | null;
  checkInBy: string | null;
  checkOutAt: string | null;
  checkOutBy: string | null;
}

interface LocationSummary {
  totalStudents: number;
  dayCampCount: number;
  allDayCampCount: number;
  birthdayCount: number;
  igniteCount: number;
  mentorsNeeded: number;
}

interface LocationInfo {
  id: string;
  name: string;
}

interface ScheduleResponse {
  date: string;
  items: ScheduleItem[];
  locations: LocationInfo[];
  summary: {
    totalStudents: number;
    mentorsNeeded: number;
    dayCampCount: number;
    allDayCampCount: number;
    birthdayCount: number;
    igniteCount: number;
    byLocation: Record<string, LocationSummary>;
  };
}

interface WeekDaySummary {
  date: string;
  dayName: string;
  byLocation: Record<string, LocationSummary>;
  totalStudents: number;
  dayCampCount: number;
  allDayCampCount: number;
  birthdayCount: number;
  igniteCount: number;
  mentorsNeeded: number;
}

interface WeekResponse {
  weekStart: string;
  weekEnd: string;
  locations: LocationInfo[];
  days: WeekDaySummary[];
}

function buildLocationSummary(items: ScheduleItem[]): Record<string, LocationSummary> {
  const byLocation: Record<string, LocationSummary> = {};
  for (const item of items) {
    if (!byLocation[item.locationId]) {
      byLocation[item.locationId] = {
        totalStudents: 0,
        dayCampCount: 0,
        allDayCampCount: 0,
        birthdayCount: 0,
        igniteCount: 0,
        mentorsNeeded: 0
      };
    }
    const loc = byLocation[item.locationId];
    loc.totalStudents++;
    if (item.productType === 'DAY_CAMP') loc.dayCampCount++;
    else if (item.productType === 'ALL_DAY_CAMP') loc.allDayCampCount++;
    else if (item.productType === 'BIRTHDAY') loc.birthdayCount++;
    else if (item.productType === 'IGNITE') loc.igniteCount++;
    // Birthdays come with their own host so they don't count toward camp mentor
    // ratios. Camp + Ignite students are supervised at 1 mentor per 4.
    const supervisedStudents = loc.dayCampCount + loc.allDayCampCount + loc.igniteCount;
    loc.mentorsNeeded = Math.ceil(supervisedStudents / 4);
  }
  return byLocation;
}

async function fetchBookingsForRange(rangeStart: Date, rangeEnd: Date): Promise<ScheduleItem[]> {
  // Ignite instants can fall on the previous UTC date (for example Saturday
  // 10am AEDT is Friday 11pm UTC), so query a one-day pad and bucket after
  // converting Ignite rows to Sydney calendar dates.
  const queryStart = subDays(rangeStart, 1);
  const queryEnd = addDays(rangeEnd, 1);
  const bookings = await prisma.booking.findMany({
    where: {
      startDate: {
        gte: queryStart,
        lte: queryEnd
      },
      product: {
        type: { in: ['CAMP', 'BIRTHDAY', 'SUBSCRIPTION'] }
      },
      status: {
        in: ['CONFIRMED', 'PENDING']
      }
    },
    include: {
      student: true,
      product: true,
      location: true,
      attendance: true,
      igniteSubscription: true
    },
    orderBy: [
      { startDate: 'asc' },
      { student: { name: 'asc' } }
    ]
  });

  const bookingStudentIds = bookings.map(b => b.studentId);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      studentId: { in: bookingStudentIds },
      bookingDate: {
        gte: queryStart,
        lte: queryEnd
      }
    },
    include: {
      order: true
    }
  });

  const parentInfoMap = new Map<string, { name: string; email: string }>();
  orderItems.forEach(item => {
    if (!parentInfoMap.has(item.studentId)) {
      parentInfoMap.set(item.studentId, {
        name: item.order.customerName,
        email: item.order.customerEmail
      });
    }
  });

  // Only show Ignite occurrences for subscriptions that are currently active or
  // trialing (matches how the Ignite calendars render live subscribers).
  const visibleBookings = bookings.filter(booking => {
    if (booking.product.type !== 'SUBSCRIPTION') return true;
    const status = booking.igniteSubscription?.status;
    return status === 'ACTIVE' || status === 'TRIALING';
  });

  const rangeStartKey = format(rangeStart, 'yyyy-MM-dd');
  const rangeEndKey = format(rangeEnd, 'yyyy-MM-dd');

  return visibleBookings.map(booking => {
    const isIgnite = booking.product.type === 'SUBSCRIPTION';
    const isBirthday = booking.product.type === 'BIRTHDAY';
    const isAllDay = !isBirthday && !isIgnite && (
      booking.product.name.toLowerCase().includes('all day') ||
      booking.product.duration === 480
    );

    let productType: ScheduleItem['productType'];
    let timeSlot: string;
    if (isIgnite) {
      productType = 'IGNITE';
      timeSlot = `${formatInTimeZone(booking.startDate, SYDNEY_TZ, 'h:mma').toLowerCase()} - ${formatInTimeZone(booking.endDate, SYDNEY_TZ, 'h:mma').toLowerCase()}`;
    } else if (isBirthday) {
      productType = 'BIRTHDAY';
      // Use the booking's actual start/end (set at order time) to render the
      // party's chosen time slot.
      timeSlot = `${format(booking.startDate, 'h:mma').toLowerCase()} - ${format(booking.endDate, 'h:mma').toLowerCase()}`;
    } else if (isAllDay) {
      productType = 'ALL_DAY_CAMP';
      timeSlot = '9am - 5pm';
    } else {
      productType = 'DAY_CAMP';
      timeSlot = '9am - 3pm';
    }

    // Camps/birthdays derive parent contact from the order; Ignite derives it
    // from the subscription (its OrderItem sits on the enrollment date, not the
    // weekly occurrence dates).
    const parentInfo = parentInfoMap.get(booking.studentId);
    const emergencyPhone = booking.student.emergencyContactPhone;

    return {
      id: booking.id,
      timeSlot,
      studentId: booking.studentId,
      studentName: booking.student.name,
      productName: booking.product.name,
      productType,
      parentName: isIgnite
        ? (booking.igniteSubscription?.customerName || booking.student.emergencyContactName || 'Unknown')
        : (parentInfo?.name || booking.student.emergencyContactName || 'Unknown'),
      parentEmail: isIgnite
        ? (booking.igniteSubscription?.customerEmail || '')
        : (parentInfo?.email || ''),
      parentPhone: emergencyPhone || null,
      status: booking.status,
      locationId: booking.locationId,
      locationName: booking.location.name,
      date: isIgnite ? formatInTimeZone(booking.startDate, SYDNEY_TZ, 'yyyy-MM-dd') : format(booking.startDate, 'yyyy-MM-dd'),
      checkInAt: booking.attendance?.checkInAt.toISOString() ?? null,
      checkInBy: booking.attendance?.checkInBy ?? null,
      checkOutAt: booking.attendance?.checkOutAt?.toISOString() ?? null,
      checkOutBy: booking.attendance?.checkOutBy ?? null
    };
  }).filter(item => item.date >= rangeStartKey && item.date <= rangeEndKey);
}

function extractLocations(items: ScheduleItem[]): LocationInfo[] {
  const locationMap = new Map<string, string>();
  for (const item of items) {
    if (!locationMap.has(item.locationId)) {
      locationMap.set(item.locationId, item.locationName);
    }
  }
  return Array.from(locationMap, ([id, name]) => ({ id, name }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get('date');
  const mode = searchParams.get('mode') || 'day';

  if (!dateParam) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  const date = parseISO(dateParam);

  if (mode === 'month') {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    // Include days from prev/next month to fill calendar grid
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfDay(addDays(startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 }), -1));

    const items = await fetchBookingsForRange(startOfDay(calendarStart), calendarEnd);
    const locations = extractLocations(items);

    const days: WeekDaySummary[] = [];
    let current = calendarStart;
    while (current <= calendarEnd) {
      const dayStr = format(current, 'yyyy-MM-dd');
      const dayItems = items.filter(item => item.date === dayStr);
      const byLocation = buildLocationSummary(dayItems);
      const totalStudents = dayItems.length;
      const dayCampCount = dayItems.filter(i => i.productType === 'DAY_CAMP').length;
      const allDayCampCount = dayItems.filter(i => i.productType === 'ALL_DAY_CAMP').length;
      const birthdayCount = dayItems.filter(i => i.productType === 'BIRTHDAY').length;
      const igniteCount = dayItems.filter(i => i.productType === 'IGNITE').length;
      const mentorsNeeded = Math.ceil((dayCampCount + allDayCampCount + igniteCount) / 4);

      days.push({
        date: dayStr,
        dayName: format(current, 'EEE'),
        byLocation,
        totalStudents,
        dayCampCount,
        allDayCampCount,
        birthdayCount,
        igniteCount,
        mentorsNeeded
      });
      current = addDays(current, 1);
    }

    return NextResponse.json({
      monthStart: format(monthStart, 'yyyy-MM-dd'),
      monthEnd: format(monthEnd, 'yyyy-MM-dd'),
      calendarStart: format(calendarStart, 'yyyy-MM-dd'),
      monthLabel: format(monthStart, 'MMMM yyyy'),
      locations,
      days
    });
  }

  if (mode === 'week') {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfDay(addDays(weekStart, 6));

    const items = await fetchBookingsForRange(startOfDay(weekStart), weekEnd);
    const locations = extractLocations(items);

    const days: WeekDaySummary[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayItems = items.filter(item => item.date === dayStr);

      const byLocation = buildLocationSummary(dayItems);
      const totalStudents = dayItems.length;
      const dayCampCount = dayItems.filter(i => i.productType === 'DAY_CAMP').length;
      const allDayCampCount = dayItems.filter(i => i.productType === 'ALL_DAY_CAMP').length;
      const birthdayCount = dayItems.filter(i => i.productType === 'BIRTHDAY').length;
      const igniteCount = dayItems.filter(i => i.productType === 'IGNITE').length;
      const mentorsNeeded = Math.ceil((dayCampCount + allDayCampCount + igniteCount) / 4);

      days.push({
        date: dayStr,
        dayName: format(day, 'EEE'),
        byLocation,
        totalStudents,
        dayCampCount,
        allDayCampCount,
        birthdayCount,
        igniteCount,
        mentorsNeeded
      });
    }

    const response: WeekResponse = {
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
      locations,
      days
    };

    return NextResponse.json(response);
  }

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const items = await fetchBookingsForRange(dayStart, dayEnd);
  const locations = extractLocations(items);

  const dayCampCount = items.filter(i => i.productType === 'DAY_CAMP').length;
  const allDayCampCount = items.filter(i => i.productType === 'ALL_DAY_CAMP').length;
  const birthdayCount = items.filter(i => i.productType === 'BIRTHDAY').length;
  const igniteCount = items.filter(i => i.productType === 'IGNITE').length;
  const totalStudents = items.length;
  const mentorsNeeded = Math.ceil((dayCampCount + allDayCampCount + igniteCount) / 4);
  const byLocation = buildLocationSummary(items);

  const response: ScheduleResponse = {
    date: dateParam,
    items,
    locations,
    summary: {
      totalStudents,
      mentorsNeeded,
      dayCampCount,
      allDayCampCount,
      birthdayCount,
      igniteCount,
      byLocation
    }
  };

  return NextResponse.json(response);
}

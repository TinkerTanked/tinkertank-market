import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO, startOfWeek, addDays, format } from 'date-fns';

interface ScheduleItem {
  id: string;
  timeSlot: string;
  studentId: string;
  studentName: string;
  productName: string;
  productType: 'DAY_CAMP' | 'ALL_DAY_CAMP';
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  status: string;
  locationId: string;
  locationName: string;
  date: string;
}

interface LocationSummary {
  totalStudents: number;
  dayCampCount: number;
  allDayCampCount: number;
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
        mentorsNeeded: 0
      };
    }
    const loc = byLocation[item.locationId];
    loc.totalStudents++;
    if (item.productType === 'DAY_CAMP') loc.dayCampCount++;
    else loc.allDayCampCount++;
    loc.mentorsNeeded = Math.ceil(loc.totalStudents / 4);
  }
  return byLocation;
}

async function fetchBookingsForRange(rangeStart: Date, rangeEnd: Date): Promise<ScheduleItem[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      startDate: {
        gte: rangeStart,
        lte: rangeEnd
      },
      product: {
        type: 'CAMP'
      },
      status: {
        in: ['CONFIRMED', 'PENDING']
      }
    },
    include: {
      student: true,
      product: true,
      location: true
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
        gte: rangeStart,
        lte: rangeEnd
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

  return bookings.map(booking => {
    const isAllDay = booking.product.name.toLowerCase().includes('all day') ||
                     booking.product.duration === 480;
    const timeSlot = isAllDay ? '9am - 5pm' : '9am - 3pm';
    const productType = isAllDay ? 'ALL_DAY_CAMP' : 'DAY_CAMP';

    const parentInfo = parentInfoMap.get(booking.studentId);
    const emergencyPhone = booking.student.emergencyContactPhone;

    return {
      id: booking.id,
      timeSlot,
      studentId: booking.studentId,
      studentName: booking.student.name,
      productName: booking.product.name,
      productType,
      parentName: parentInfo?.name || booking.student.emergencyContactName || 'Unknown',
      parentEmail: parentInfo?.email || '',
      parentPhone: emergencyPhone || null,
      status: booking.status,
      locationId: booking.locationId,
      locationName: booking.location.name,
      date: format(booking.startDate, 'yyyy-MM-dd')
    };
  });
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
      const mentorsNeeded = Math.ceil(totalStudents / 4);

      days.push({
        date: dayStr,
        dayName: format(day, 'EEE'),
        byLocation,
        totalStudents,
        dayCampCount,
        allDayCampCount,
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
  const totalStudents = items.length;
  const mentorsNeeded = Math.ceil(totalStudents / 4);
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
      byLocation
    }
  };

  return NextResponse.json(response);
}

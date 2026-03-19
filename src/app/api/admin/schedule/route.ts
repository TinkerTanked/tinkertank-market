import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

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
}

interface ScheduleResponse {
  date: string;
  items: ScheduleItem[];
  summary: {
    totalStudents: number;
    mentorsNeeded: number;
    dayCampCount: number;
    allDayCampCount: number;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get('date');

  if (!dateParam) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  const date = parseISO(dateParam);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const bookings = await prisma.booking.findMany({
    where: {
      startDate: {
        gte: dayStart,
        lte: dayEnd
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
      product: true
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
        gte: dayStart,
        lte: dayEnd
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

  const items: ScheduleItem[] = bookings.map(booking => {
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
      status: booking.status
    };
  });

  const dayCampCount = items.filter(i => i.productType === 'DAY_CAMP').length;
  const allDayCampCount = items.filter(i => i.productType === 'ALL_DAY_CAMP').length;
  const totalStudents = items.length;
  const mentorsNeeded = Math.ceil(totalStudents / 4);

  const response: ScheduleResponse = {
    date: dateParam,
    items,
    summary: {
      totalStudents,
      mentorsNeeded,
      dayCampCount,
      allDayCampCount
    }
  };

  return NextResponse.json(response);
}

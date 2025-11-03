import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationFilter = searchParams.get('location');
    const productTypeFilter = searchParams.get('productType');
    const statusFilter = searchParams.get('status');

    const whereClause: any = {};

    if (locationFilter) {
      whereClause.locationId = locationFilter;
    }

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    if (productTypeFilter) {
      whereClause.product = {
        type: productTypeFilter,
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            name: true,
            type: true,
          },
        },
        location: {
          select: {
            name: true,
            capacity: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Group bookings by date/time to count students
    const eventMap = new Map();

    bookings.forEach((booking) => {
      const eventKey = `${booking.startDate.toISOString()}_${booking.endDate.toISOString()}_${booking.locationId}_${booking.productId}`;
      
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, {
          id: booking.id, // Use first booking ID as event ID
          title: `${booking.product.name}`,
          start: booking.startDate.toISOString(),
          end: booking.endDate.toISOString(),
          students: [],
          location: booking.location.name,
          productType: booking.product.type,
          capacity: booking.location.capacity,
          status: booking.status,
        });
      }

      const event = eventMap.get(eventKey);
      event.students.push(booking.student.name);
      
      // Update status to most restrictive (PENDING > CONFIRMED > COMPLETED > CANCELLED)
      const statusPriority = { PENDING: 1, CONFIRMED: 2, COMPLETED: 3, CANCELLED: 4 };
      if (statusPriority[booking.status as keyof typeof statusPriority] < statusPriority[event.status as keyof typeof statusPriority]) {
        event.status = booking.status;
      }
    });

    const calendarEvents = Array.from(eventMap.values()).map((event) => ({
      id: event.id,
      title: `${event.title} (${event.students.length})`,
      start: event.start,
      end: event.end,
      backgroundColor: '#EA580C',
      textColor: '#FFFFFF',
      extendedProps: {
        studentCount: event.students.length,
        location: event.location,
        productType: event.productType,
        mentorsNeeded: Math.ceil(event.students.length / 4), // Assuming 1 mentor per 4 students
        status: event.status,
        students: event.students,
      },
    }));

    return NextResponse.json(calendarEvents);
  } catch (error) {
    console.error('Calendar events API error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

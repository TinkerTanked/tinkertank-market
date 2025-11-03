import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@/types/booking';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const location = searchParams.get('location') || '';
    const dateRange = searchParams.get('dateRange') || '';
    const productType = searchParams.get('productType') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      AND: [],
    };

    // Search filter
    if (search) {
      whereClause.AND?.push({
        OR: [
          { student: { name: { contains: search, mode: 'insensitive' } } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
          { location: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    // Status filter
    if (status) {
      whereClause.AND?.push({ status: status as BookingStatus });
    }

    // Location filter
    if (location) {
      whereClause.AND?.push({ locationId: location });
    }

    // Product type filter
    if (productType) {
      whereClause.AND?.push({ product: { type: productType } });
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'tomorrow':
          startDate = startOfDay(addDays(now, 1));
          endDate = endOfDay(addDays(now, 1));
          break;
        case 'this_week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'next_week':
          startDate = startOfWeek(addDays(now, 7), { weekStartsOn: 1 });
          endDate = endOfWeek(addDays(now, 7), { weekStartsOn: 1 });
          break;
        case 'this_month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'next_month':
          startDate = startOfMonth(addDays(now, 30));
          endDate = endOfMonth(addDays(now, 30));
          break;
        default:
          startDate = now;
          endDate = now;
      }

      whereClause.AND?.push({
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      });
    }

    // Get total count
    const total = await prisma.booking.count({
      where: whereClause,
    });

    // Get bookings
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        student: {
          select: {
            name: true,
            birthdate: true,
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
          },
        },
      },
    });

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      student: booking.student,
      product: booking.product,
      location: booking.location,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      status: booking.status,
      totalPrice: parseFloat(booking.totalPrice.toString()),
      notes: booking.notes,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      bookings: formattedBookings,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

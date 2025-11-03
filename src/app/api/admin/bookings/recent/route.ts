import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedBookings = recentBookings.map((booking) => ({
      id: booking.id,
      student: booking.student,
      product: booking.product,
      location: booking.location,
      startDate: booking.startDate.toISOString(),
      status: booking.status,
      totalPrice: parseFloat(booking.totalPrice.toString()),
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Recent bookings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch recent bookings' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export async function GET() {
  try {
    const now = new Date();
    const studentCountData = [];

    // Get data for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = addDays(now, i);
      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      // Get bookings for this day
      const bookings = await prisma.booking.findMany({
        where: {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
        include: {
          location: true,
        },
      });

      // Get total capacity (sum of all location capacities for simplicity)
      const locations = await prisma.location.findMany({
        where: {
          isActive: true,
        },
      });

      const totalCapacity = locations.reduce((sum, location) => sum + location.capacity, 0);

      studentCountData.push({
        date: format(date, 'yyyy-MM-dd'),
        count: bookings.length,
        capacity: totalCapacity,
      });
    }

    return NextResponse.json(studentCountData);
  } catch (error) {
    console.error('Student count analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch student count data' }, { status: 500 });
  }
}

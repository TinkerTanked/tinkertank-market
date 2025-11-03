import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  try {
    const now = new Date();
    const startToday = startOfDay(now);
    const endToday = endOfDay(now);
    const startThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endThisWeek = endOfWeek(now, { weekStartsOn: 1 });
    const startThisMonth = startOfMonth(now);
    const endThisMonth = endOfMonth(now);

    // Today's student count
    const todayBookings = await prisma.booking.findMany({
      where: {
        startDate: {
          gte: startToday,
          lte: endToday,
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      include: {
        student: true,
      },
    });

    // Week's student count
    const weekBookings = await prisma.booking.findMany({
      where: {
        startDate: {
          gte: startThisWeek,
          lte: endThisWeek,
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      include: {
        student: true,
      },
    });

    // Month's student count
    const monthBookings = await prisma.booking.findMany({
      where: {
        startDate: {
          gte: startThisMonth,
          lte: endThisMonth,
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      include: {
        student: true,
      },
    });

    // Pending bookings count
    const pendingBookings = await prisma.booking.count({
      where: {
        status: 'PENDING',
      },
    });

    // Weekly revenue calculation
    const weeklyOrders = await prisma.order.findMany({
      where: {
        status: 'PAID',
        createdAt: {
          gte: startThisWeek,
          lte: endThisWeek,
        },
      },
    });

    const weeklyRevenue = weeklyOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount.toString());
    }, 0);

    // Total revenue
    const totalOrders = await prisma.order.findMany({
      where: {
        status: 'PAID',
      },
    });

    const totalRevenue = totalOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount.toString());
    }, 0);

    const dashboardData = {
      todayStudentCount: todayBookings.length,
      weekStudentCount: weekBookings.length,
      monthStudentCount: monthBookings.length,
      pendingBookings,
      totalRevenue,
      weeklyRevenue,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

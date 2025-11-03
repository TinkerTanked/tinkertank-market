import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, subWeeks, format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';
    
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;
    let periods: number;

    if (timeframe === 'month') {
      startDate = subDays(now, 30);
      dateFormat = 'MMM dd';
      periods = 30;
    } else {
      startDate = subDays(now, 7);
      dateFormat = 'EEE';
      periods = 7;
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'PAID',
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group orders by date
    const revenueByDate: { [key: string]: number } = {};
    
    for (let i = 0; i < periods; i++) {
      const date = subDays(now, periods - 1 - i);
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
      revenueByDate[dateKey] = 0;
    }

    orders.forEach((order) => {
      const dateKey = format(startOfDay(order.createdAt), 'yyyy-MM-dd');
      if (revenueByDate.hasOwnProperty(dateKey)) {
        revenueByDate[dateKey] += parseFloat(order.totalAmount.toString());
      }
    });

    const revenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
    }));

    return NextResponse.json(revenueData);
  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}

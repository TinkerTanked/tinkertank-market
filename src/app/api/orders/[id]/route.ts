import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
            student: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get associated calendar events
    const bookings = await prisma.booking.findMany({
      where: {
        OR: order.orderItems.map(item => ({
          studentId: item.studentId,
          productId: item.productId,
          startDate: item.bookingDate
        }))
      },
      include: {
        event: {
          include: {
            location: true
          }
        }
      }
    });

    const events = bookings
      .filter(booking => booking.event)
      .map(booking => booking.event);

    return NextResponse.json({
      order: {
        ...order,
        totalAmount: Number(order.totalAmount),
        orderItems: order.orderItems.map(item => ({
          ...item,
          price: Number(item.price)
        }))
      },
      events
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

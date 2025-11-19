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
      orderId: order.id,
      paymentIntentId: order.stripePaymentIntentId,
      total: Number(order.totalAmount),
      status: order.status,
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
      },
      items: order.orderItems.map(item => ({
        product: {
          name: item.product.name,
          shortDescription: item.product.description,
          category: item.product.type === 'CAMP' ? 'camps' : item.product.type === 'BIRTHDAY' ? 'birthdays' : 'subscriptions'
        },
        selectedDate: item.bookingDate,
        quantity: 1,
        totalPrice: Number(item.price)
      })),
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

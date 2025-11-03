import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID required' },
        { status: 400 }
      );
    }

    // Get payment status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Get order from database
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
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

    // Check if calendar events exist
    const bookings = await prisma.booking.findMany({
      where: {
        OR: order.orderItems.map(item => ({
          studentId: item.studentId,
          productId: item.productId,
          startDate: item.bookingDate
        }))
      },
      include: {
        event: true
      }
    });

    const eventsCreated = bookings.filter(b => b.event).length;
    const totalBookings = order.orderItems.length;

    return NextResponse.json({
      paymentStatus: paymentIntent.status,
      orderStatus: order.status,
      eventsCreated,
      totalBookings,
      allEventsCreated: eventsCreated === totalBookings,
      order: {
        ...order,
        totalAmount: Number(order.totalAmount),
        orderItems: order.orderItems.map(item => ({
          ...item,
          price: Number(item.price)
        }))
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

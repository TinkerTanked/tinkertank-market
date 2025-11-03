import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  orderId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, orderId } = ConfirmPaymentSchema.parse(body);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not successful' },
        { status: 400 }
      );
    }

    // Find the order in our database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.stripePaymentIntentId !== paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent mismatch' },
        { status: 400 }
      );
    }

    // Update order status to paid
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      // Create bookings for each order item
      const bookings = [];
      for (const orderItem of order.orderItems) {
        // For camps and birthdays, create bookings
        if (orderItem.product.type === 'CAMP' || orderItem.product.type === 'BIRTHDAY') {
          const booking = await tx.booking.create({
            data: {
              studentId: orderItem.studentId,
              productId: orderItem.productId,
              locationId: 'default-location-id', // You'll need to handle location selection
              startDate: orderItem.bookingDate,
              endDate: new Date(orderItem.bookingDate.getTime() + (orderItem.product.duration || 60) * 60 * 1000),
              status: 'CONFIRMED',
              totalPrice: orderItem.price,
              notes: `Order: ${order.id}`,
            },
          });
          bookings.push(booking);
        }
      }

      return { order, bookings };
    });

    // Send confirmation email (implement with your email service)
    // await sendOrderConfirmationEmail(updatedOrder.order);

    return NextResponse.json({
      success: true,
      order: updatedOrder.order,
      bookings: updatedOrder.bookings,
      message: 'Payment confirmed and bookings created',
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

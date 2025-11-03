import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { eventService } from '@/lib/events';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { ErrorHandler, ErrorCategory, ErrorSeverity, withErrorHandling } from '@/lib/error-handling';
import { notificationService } from '@/lib/notifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    // Find the order by payment intent ID
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: {
        orderItems: {
          include: {
            product: true,
            student: true,
          },
        },
      },
    });

    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update order status if not already done
    if (order.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        });

        // Create bookings for camps and birthdays
        for (const orderItem of order.orderItems) {
          if (orderItem.product.type === 'CAMP' || orderItem.product.type === 'BIRTHDAY') {
            await tx.booking.create({
              data: {
                studentId: orderItem.studentId,
                productId: orderItem.productId,
                locationId: 'default-location-id', // Handle properly in production
                startDate: orderItem.bookingDate,
                endDate: new Date(orderItem.bookingDate.getTime() + (orderItem.product.duration || 60) * 60 * 1000),
                status: 'CONFIRMED',
                totalPrice: orderItem.price,
                notes: `Webhook confirmation - Order: ${order.id}`,
              },
            });
          }
        }
      });

      // Create calendar events after successful payment with retry logic
      const calendarEvents = await withErrorHandling(
        () => ErrorHandler.retryOperation(
          () => eventService.createEventsFromOrder(order.id),
          3,
          2000
        ),
        {
          category: ErrorCategory.CALENDAR,
          severity: ErrorSeverity.MEDIUM,
          orderId: order.id
        }
      );

      if (calendarEvents) {
        console.log(`Created ${calendarEvents.length} calendar events for order ${order.id}`);
      } else {
        await ErrorHandler.logError({
          category: ErrorCategory.CALENDAR,
          severity: ErrorSeverity.HIGH,
          message: 'Failed to create calendar events after retries',
          orderId: order.id
        });
      }

      // Send confirmation email with error handling
      await withErrorHandling(
        () => sendBookingConfirmationEmail({
          ...order,
          totalAmount: Number(order.totalAmount),
          orderItems: order.orderItems.map(item => ({
            id: item.id,
            product: {
              name: item.product.name,
              type: item.product.type
            },
            student: {
              name: item.student.name,
              allergies: item.student.allergies || undefined
            },
            bookingDate: item.bookingDate,
            price: Number(item.price)
          }))
        }),
        {
          category: ErrorCategory.EMAIL,
          severity: ErrorSeverity.LOW,
          orderId: order.id
        }
      );
      
      // Send notification to staff
      await notificationService.notifyBookingConfirmed(
        order.id, 
        order.customerName, 
        Number(order.totalAmount)
      );
      
      console.log('Order confirmed via webhook:', order.id);
    }
  } catch (error) {
    await ErrorHandler.handlePaymentError(error, paymentIntent.id);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  try {
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (order && order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      await notificationService.notifyPaymentFailed(order.id, 'Payment failed');
      console.log('Order cancelled due to payment failure:', order.id);
    }
  } catch (error) {
    console.error('Error handling payment failed webhook:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment canceled:', paymentIntent.id);

  try {
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (order && order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      console.log('Order cancelled:', order.id);
    }
  } catch (error) {
    console.error('Error handling payment canceled webhook:', error);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log('Dispute created for charge:', dispute.charge);
  
  // Handle dispute logic here
  // You might want to:
  // 1. Send notification to admin
  // 2. Mark the order as disputed
  // 3. Trigger review process
  
  try {
    // Find the payment intent associated with this charge
    const charge = await stripe.charges.retrieve(dispute.charge as string);
    
    if (charge.payment_intent) {
      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: charge.payment_intent as string },
      });
      
      if (order) {
        // You could add a dispute status to your order model
        console.log('Dispute created for order:', order.id);
        // await prisma.order.update({
        //   where: { id: order.id },
        //   data: { disputeStatus: 'DISPUTED' },
        // });
      }
    }
  } catch (error) {
    console.error('Error handling dispute created webhook:', error);
  }
}

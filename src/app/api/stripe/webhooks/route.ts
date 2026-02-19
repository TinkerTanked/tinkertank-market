import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { eventService } from '@/lib/events';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { ErrorHandler, ErrorCategory, ErrorSeverity, withErrorHandling } from '@/lib/error-handling';
import { notificationService } from '@/lib/notifications';
import { IGNITE_SESSIONS } from '@/config/igniteProducts';
import { getSubscriptionStartTerm, getTermDatesForDayOfWeek, DAY_NAME_TO_NUMBER } from '@/config/schoolTerms';

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
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

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

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);

  try {
    const orderId = session.metadata?.orderId;
    
    if (!orderId) {
      console.error('No orderId found in session metadata:', session.id);
      return;
    }

    // Find the order with all related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      console.error('Order not found for session:', session.id, 'orderId:', orderId);
      return;
    }

    // Only process if payment was successful and order is still pending
    if (session.payment_status === 'paid' && order.status === 'PENDING') {
      // Check if this is a subscription
      const isSubscription = session.metadata?.isSubscription === 'true'
      
      if (isSubscription) {
        // Handle Ignite subscription
        await handleIgniteSubscription(session, order)
      } else {
        // Handle regular camp/birthday bookings
        await prisma.$transaction(async (tx) => {
          // Update order status to PAID
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PAID' },
          });

          // Create bookings for each order item (camps and birthdays)
          for (const orderItem of order.orderItems) {
            if (orderItem.product.type === 'CAMP' || orderItem.product.type === 'BIRTHDAY') {
              const defaultLocation = await tx.location.findFirst({
                where: { isActive: true },
              });

              if (!defaultLocation) {
                console.error('No active location found for booking');
                continue;
              }

              await tx.booking.create({
                data: {
                  studentId: orderItem.studentId,
                  productId: orderItem.productId,
                  locationId: defaultLocation.id,
                  startDate: orderItem.bookingDate,
                  endDate: new Date(orderItem.bookingDate.getTime() + (orderItem.product.duration || 60) * 60 * 1000),
                  status: 'CONFIRMED',
                  totalPrice: orderItem.price,
                  notes: `Checkout session completed - Order: ${order.id}`,
                },
              });
            }
          }
        });
      }

      // Create calendar events with retry logic
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

      // Send confirmation email
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
      
      console.log('Order confirmed via checkout session:', order.id);
    } else {
      console.log(`Skipping order processing - payment_status: ${session.payment_status}, order status: ${order.status}`);
    }
  } catch (error) {
    await ErrorHandler.handlePaymentError(error, session.id);
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

/**
 * Handle Ignite subscription creation
 * Creates recurring events for the current/next school term
 */
async function handleIgniteSubscription(
  session: Stripe.Checkout.Session,
  order: { id: string; customerEmail: string; customerName: string }
) {
  console.log('Processing Ignite subscription for order:', order.id);

  const subscriptionProductId = session.metadata?.subscriptionProductId;
  
  if (!subscriptionProductId) {
    console.error('No subscriptionProductId in session metadata');
    return;
  }

  // Find the Ignite session config
  const igniteSession = IGNITE_SESSIONS.find(s => s.id === subscriptionProductId);
  
  if (!igniteSession) {
    console.error('Ignite session not found:', subscriptionProductId);
    return;
  }

  // Get the term to schedule for
  const term = getSubscriptionStartTerm(new Date());
  
  if (!term) {
    console.error('No school term found for subscription scheduling');
    return;
  }

  console.log(`Scheduling Ignite subscription for ${term.name}`);

  // Parse student info from metadata
  let studentInfo: Array<{ firstName: string; lastName: string; age: number; allergies: string }> = [];
  if (session.metadata?.studentInfo) {
    try {
      studentInfo = JSON.parse(session.metadata.studentInfo);
      console.log('Student info from metadata:', studentInfo);
    } catch (e) {
      console.error('Failed to parse student info:', e);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // Create students from the subscription
      const createdStudentIds: string[] = [];
      for (const student of studentInfo) {
        const birthYear = new Date().getFullYear() - student.age;
        const createdStudent = await tx.student.create({
          data: {
            name: `${student.firstName} ${student.lastName}`,
            birthdate: new Date(birthYear, 0, 1),
            allergies: student.allergies || null,
          }
        });
        createdStudentIds.push(createdStudent.id);
        console.log(`Created student: ${createdStudent.name} (${createdStudent.id})`);
      }

      // Find or create location
      let location = await tx.location.findFirst({
        where: { 
          name: { contains: igniteSession.location },
          isActive: true 
        },
      });

      if (!location) {
        // Use default location or create one
        location = await tx.location.findFirst({
          where: { isActive: true },
        });
      }

      if (!location) {
        console.error('No location found for Ignite session');
        return;
      }

      // Create a recurring template
      const recurringTemplate = await tx.recurringTemplate.create({
        data: {
          name: `${igniteSession.name} - ${order.customerName}`,
          description: `Ignite subscription for ${order.customerEmail}`,
          type: 'RECURRING_SESSION',
          startTime: igniteSession.startTime,
          endTime: igniteSession.endTime,
          duration: calculateDurationMinutes(igniteSession.startTime, igniteSession.endTime),
          daysOfWeek: igniteSession.dayOfWeek.map(d => DAY_NAME_TO_NUMBER[d.toLowerCase()]),
          startDate: term.startDate,
          endDate: term.endDate,
          maxCapacity: 20,
          locationId: location.id,
          isActive: true,
        },
      });

      console.log('Created recurring template:', recurringTemplate.id);

      // Create events for each day of week in the term
      const eventsToCreate = [];
      
      for (const dayName of igniteSession.dayOfWeek) {
        const dayNumber = DAY_NAME_TO_NUMBER[dayName.toLowerCase()];
        const dates = getTermDatesForDayOfWeek(term, dayNumber);
        
        for (const date of dates) {
          const [startHour, startMin] = igniteSession.startTime.split(':').map(Number);
          const [endHour, endMin] = igniteSession.endTime.split(':').map(Number);
          
          const startDateTime = new Date(date);
          startDateTime.setHours(startHour, startMin, 0, 0);
          
          const endDateTime = new Date(date);
          endDateTime.setHours(endHour, endMin, 0, 0);
          
          eventsToCreate.push({
            title: `Ignite - ${igniteSession.location}`,
            description: `${igniteSession.name}`,
            type: 'RECURRING_SESSION' as const,
            status: 'SCHEDULED' as const,
            startDateTime,
            endDateTime,
            isRecurring: true,
            maxCapacity: 20,
            currentCount: 1, // This subscriber
            locationId: location.id,
            recurringTemplateId: recurringTemplate.id,
          });
        }
      }

      // Create all events
      if (eventsToCreate.length > 0) {
        await tx.event.createMany({
          data: eventsToCreate,
        });
        console.log(`Created ${eventsToCreate.length} Ignite events for ${term.name}`);
      }
    });

    console.log('Ignite subscription processed successfully for order:', order.id);
  } catch (error) {
    console.error('Error processing Ignite subscription:', error);
    throw error;
  }
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

/**
 * Handle subscription creation or update from Stripe webhook
 */
async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  console.log('Processing subscription upsert:', subscription.id, 'status:', subscription.status);

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer.deleted) {
      console.error('Customer is deleted:', subscription.customer);
      return;
    }

    const priceItem = subscription.items.data[0];
    if (!priceItem) {
      console.error('No price item found in subscription:', subscription.id);
      return;
    }

    const price = await stripe.prices.retrieve(priceItem.price.id);
    const weeklyAmount = price.recurring?.interval === 'week' 
      ? (price.unit_amount || 0) / 100 
      : 0;

    const igniteSession = IGNITE_SESSIONS.find(s => s.stripePriceId === priceItem.price.id);

    // Skip non-Ignite subscriptions
    if (!igniteSession) {
      console.log('Skipping non-Ignite subscription:', subscription.id);
      return;
    }

    // Extract student names from metadata if available
    const studentNames = subscription.metadata?.student_names
      ? JSON.parse(subscription.metadata.student_names)
      : subscription.metadata?.studentNames
        ? JSON.parse(subscription.metadata.studentNames)
        : null;

    const statusMap: Record<string, 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'> = {
      active: 'ACTIVE',
      paused: 'PAUSED',
      canceled: 'CANCELED',
      past_due: 'PAST_DUE',
      trialing: 'TRIALING',
      incomplete: 'PAST_DUE',
      incomplete_expired: 'CANCELED',
      unpaid: 'PAST_DUE',
    };

    await prisma.igniteSubscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceItem.price.id,
        customerEmail: customer.email || '',
        customerName: customer.name || undefined,
        igniteSessionId: igniteSession.id,
        studentNames,
        status: statusMap[subscription.status] || 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        weeklyAmount,
      },
      update: {
        stripePriceId: priceItem.price.id,
        customerEmail: customer.email || '',
        customerName: customer.name || undefined,
        igniteSessionId: igniteSession.id,
        studentNames,
        status: statusMap[subscription.status] || 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        weeklyAmount,
      },
    });

    console.log('Subscription synced to database:', subscription.id);
  } catch (error) {
    console.error('Error processing subscription upsert:', error);
    throw error;
  }
}

/**
 * Handle subscription deletion from Stripe webhook
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deletion:', subscription.id);

  try {
    await prisma.igniteSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    console.log('Subscription marked as canceled:', subscription.id);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      console.log('Subscription not found in database (may not have been synced):', subscription.id);
      return;
    }
    console.error('Error processing subscription deletion:', error);
    throw error;
  }
}

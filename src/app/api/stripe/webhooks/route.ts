import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { eventService } from '@/lib/events';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { ErrorHandler, ErrorCategory, ErrorSeverity, withErrorHandling } from '@/lib/error-handling';
import { notificationService } from '@/lib/notifications';
import { IGNITE_SESSIONS } from '@/config/igniteProducts';
import { getIgniteScheduleFrom, getIgniteSessionConfig, igniteProductId } from '@/lib/ignite';

const IGNITE_SUBSCRIPTION_STATUS: Record<string, 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'> = {
  active: 'ACTIVE',
  paused: 'PAUSED',
  canceled: 'CANCELED',
  past_due: 'PAST_DUE',
  trialing: 'TRIALING',
  incomplete: 'PAST_DUE',
  incomplete_expired: 'CANCELED',
  unpaid: 'PAST_DUE',
};

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
      throw new Error(`No orderId found in checkout session metadata: ${session.id}`);
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
      throw new Error(`Order ${orderId} not found for checkout session ${session.id}`);
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
              // Resolve the booking Location, preferring the per-item selection
              // captured at checkout. Falls back to session metadata for legacy
              // orders, then to Neutral Bay.
              const itemLocation = orderItem.location || session.metadata?.location || null
              const isYourVenue = !!itemLocation && itemLocation.toLowerCase().includes('your venue')

              let bookingLocation = null

              if (isYourVenue) {
                // Find or create the canonical "Your Venue" Location row so
                // bookings always have a valid FK.
                bookingLocation = await tx.location.findFirst({
                  where: { name: 'Your Venue' },
                })
                if (!bookingLocation) {
                  bookingLocation = await tx.location.create({
                    data: {
                      name: 'Your Venue',
                      address: 'Customer-provided venue',
                      capacity: 0,
                    },
                  })
                }
              } else if (itemLocation) {
                // Try exact match first, then a contains-match for legacy short
                // names like "Neutral Bay" vs "TinkerTank Neutral Bay".
                bookingLocation =
                  (await tx.location.findFirst({
                    where: { name: itemLocation, isActive: true },
                  })) ||
                  (await tx.location.findFirst({
                    where: { name: { contains: itemLocation, mode: 'insensitive' }, isActive: true },
                  }))
              }

              if (!bookingLocation) {
                // Default to Neutral Bay (canonical camp location), not alphabetical first
                bookingLocation = await tx.location.findFirst({
                  where: { name: 'Neutral Bay', isActive: true },
                }) || await tx.location.findFirst({
                  where: { isActive: true },
                })
              }

              if (!bookingLocation) {
                console.error('No active location found for booking');
                continue;
              }

              // Set booking start/end times:
              //   - CAMP: Day Camp 9am-3pm, All Day Camp 9am-5pm (UTC to avoid
              //     server-timezone shifts that put dates on the wrong day)
              //   - BIRTHDAY: respect the customer-selected time stored on the
              //     order item's bookingDate, with end = start + product.duration
              //     (defaults to 120 minutes if duration is missing).
              const isBirthday = orderItem.product.type === 'BIRTHDAY'
              const isAllDay = !isBirthday && orderItem.product.name.toLowerCase().includes('all day')
              const startDate = new Date(orderItem.bookingDate)
              const endDate = new Date(orderItem.bookingDate)
              if (isBirthday) {
                const durationMinutes = orderItem.product.duration || 120
                endDate.setTime(startDate.getTime() + durationMinutes * 60 * 1000)
              } else {
                startDate.setUTCHours(9, 0, 0, 0)
                endDate.setUTCHours(isAllDay ? 17 : 15, 0, 0, 0)
              }

              // Prevent duplicate bookings (same student+product+date)
              const existingBooking = await tx.booking.findFirst({
                where: {
                  studentId: orderItem.studentId,
                  productId: orderItem.productId,
                  startDate: {
                    gte: new Date(startDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
                    lt: new Date(startDate.toISOString().split('T')[0] + 'T23:59:59.999Z')
                  }
                }
              })

              if (existingBooking) {
                console.log(`Skipping duplicate booking for student ${orderItem.studentId} on ${startDate.toISOString().split('T')[0]}`);
                continue;
              }

              // Build a useful Booking.notes string that captures venue + customer notes
              const noteParts: string[] = [`Order: ${order.id}`]
              if (orderItem.venueAddress) {
                noteParts.push(`Venue address: ${orderItem.venueAddress}`)
              }
              if (orderItem.notes) {
                noteParts.push(orderItem.notes)
              }

              await tx.booking.create({
                data: {
                  studentId: orderItem.studentId,
                  productId: orderItem.productId,
                  locationId: bookingLocation.id,
                  startDate,
                  endDate,
                  status: 'CONFIRMED',
                  totalPrice: orderItem.price,
                  notes: noteParts.join(' | '),
                },
              });
            }
          }
        });

        // Camps/birthdays only. Ignite subscriptions are fully handled in
        // handleIgniteSubscription above and must NOT run eventService here — it
        // would create incorrect per-student recurring events. (Phase 2 adds
        // dedicated Ignite confirmation emails.)
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
            price: Number(item.price),
            // Forward per-item location info so the email template can render
            // the correct arrival block (Manly Library vs Neutral Bay vs Your
            // Venue) instead of hardcoded Neutral Bay.
            location: item.location,
            venueAddress: item.venueAddress
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
      }

      console.log('Order confirmed via checkout session:', order.id);
    } else {
      console.log(`Skipping order processing - payment_status: ${session.payment_status}, order status: ${order.status}`);
    }
  } catch (error) {
    await ErrorHandler.handlePaymentError(error, session.id);
    throw error;
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
            price: Number(item.price),
            // Forward per-item location info so the email template can render
            // the correct arrival block (Manly Library vs Neutral Bay vs Your
            // Venue) instead of hardcoded Neutral Bay.
            location: item.location,
            venueAddress: item.venueAddress
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
 * Handle Ignite subscription fulfilment (checkout.session.completed).
 *
 * Reads the students created at checkout from the order, then in a single
 * transaction: atomically flips the order PENDING->PAID (idempotency gate),
 * upserts the IgniteSubscription, links every student, and creates one
 * standalone Booking per student per session date for the term. No Events or
 * RecurringTemplates are created here (Phase 1) — Bookings drive the admin
 * schedule + attendance. All child writes are guarded by unique constraints so
 * duplicate/retried Stripe deliveries are safe.
 */
async function handleIgniteSubscription(
  session: Stripe.Checkout.Session,
  order: {
    id: string
    customerEmail: string
    customerName: string
    orderItems: Array<{ bookingDate: Date; student: { id: string; name: string } }>
  }
) {
  console.log('Processing Ignite subscription for order:', order.id);

  const igniteSessionId = session.metadata?.igniteSessionId || session.metadata?.subscriptionProductId;
  if (!igniteSessionId) {
    throw new Error(`No Ignite session id in checkout metadata for order ${order.id}`);
  }

  const config = getIgniteSessionConfig(igniteSessionId);
  if (!config) {
    throw new Error(`Ignite session config not found: ${igniteSessionId}`);
  }

  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (!stripeSubscriptionId) {
    throw new Error(`No Stripe subscription id on checkout session for order ${order.id}`);
  }

  // Retrieve current Stripe state (price, quantity, period) rather than trusting
  // a possibly-stale webhook payload.
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const priceItem = subscription.items.data[0];
  const unitAmount = (priceItem?.price?.unit_amount ?? 0) / 100;
  const quantity = priceItem?.quantity ?? order.orderItems.length;

  // Unique students created at checkout.
  const studentMap = new Map<string, { id: string; name: string }>();
  for (const oi of order.orderItems) {
    if (oi.student) studentMap.set(oi.student.id, oi.student);
  }
  const students = Array.from(studentMap.values());
  if (students.length === 0) {
    throw new Error(`No students found on Ignite order ${order.id}`);
  }
  if (priceItem?.price?.id !== config.stripePriceId) {
    throw new Error(`Stripe price does not match Ignite session ${config.id} for order ${order.id}`);
  }
  if (quantity !== students.length) {
    throw new Error(`Stripe quantity ${quantity} does not match ${students.length} students for order ${order.id}`);
  }

  const studentNames = students.map(s => {
    const [firstName, ...rest] = s.name.split(' ');
    return { firstName, lastName: rest.join(' ') };
  });

  // Fulfil the schedule selected at checkout, even if Stripe completes after a
  // term boundary or after the final occurrence has started.
  const enrollmentAnchor = order.orderItems.reduce(
    (earliest, item) => item.bookingDate < earliest ? item.bookingDate : earliest,
    order.orderItems[0].bookingDate
  );
  const schedule = getIgniteScheduleFrom(config, enrollmentAnchor);
  const occurrences = schedule?.occurrences ?? [];
  if (occurrences.length === 0) {
    throw new Error(`No Ignite occurrences found for order ${order.id}`);
  }
  const productId = igniteProductId(config.id);

  try {
    await prisma.$transaction(async (tx) => {
      // Idempotency gate: only the first delivery flips PENDING->PAID.
      const flipped = await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'PAID' },
      });
      if (flipped.count === 0) {
        console.log('Ignite order already processed, skipping:', order.id);
        return;
      }

      // Resolve the location captured at checkout (never fall back silently).
      const locationId = session.metadata?.locationId;
      const location = locationId
        ? await tx.location.findUnique({ where: { id: locationId } })
        : await tx.location.findFirst({
            where: { name: { equals: config.location, mode: 'insensitive' }, isActive: true },
          });
      if (!location) {
        throw new Error(`Ignite location not found for order ${order.id} (${config.location})`);
      }

      const igniteSub = await tx.igniteSubscription.upsert({
        where: { stripeSubscriptionId },
        create: {
          stripeSubscriptionId,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: priceItem?.price?.id || config.stripePriceId,
          customerEmail: order.customerEmail,
          customerName: order.customerName || undefined,
          igniteSessionId: config.id,
          studentNames,
          quantity,
          status: IGNITE_SUBSCRIPTION_STATUS[subscription.status] || 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          weeklyAmount: unitAmount * quantity,
        },
        update: {
          igniteSessionId: config.id,
          studentNames,
          quantity,
          status: IGNITE_SUBSCRIPTION_STATUS[subscription.status] || 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          weeklyAmount: unitAmount * quantity,
        },
      });

      // Link students (unique on [igniteSubscriptionId, studentId]).
      for (const s of students) {
        await tx.igniteSubscriptionStudent.upsert({
          where: {
            igniteSubscriptionId_studentId: { igniteSubscriptionId: igniteSub.id, studentId: s.id },
          },
          create: { igniteSubscriptionId: igniteSub.id, studentId: s.id },
          update: {},
        });
      }

      // One booking per student per session date. Unique on
      // [igniteSubscriptionId, studentId, startDate] + skipDuplicates makes
      // retries safe.
      const bookingsData = students.flatMap(s =>
        occurrences.map(occ => ({
          studentId: s.id,
          productId,
          locationId: location.id,
          igniteSubscriptionId: igniteSub.id,
          startDate: occ.start,
          endDate: occ.end,
          status: 'CONFIRMED' as const,
          // Financials live on the subscription/order, not the individual
          // occurrence bookings, so schedule/analytics don't multiply revenue.
          totalPrice: 0,
          notes: `Ignite: ${config.name} | Order: ${order.id}`,
        }))
      );
      const created = await tx.booking.createMany({ data: bookingsData, skipDuplicates: true });
      console.log(`Created ${created.count} Ignite bookings for order ${order.id}`);
    });

    console.log('Ignite subscription processed successfully for order:', order.id);
  } catch (error) {
    console.error('Error processing Ignite subscription:', error);
    throw error;
  }
}

/**
 * Handle subscription creation or update from Stripe webhook
 */
async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  console.log('Processing subscription upsert:', subscription.id, 'status:', subscription.status);

  try {
    // Stripe does not guarantee webhook ordering. Treat each lifecycle event as
    // a signal and sync the current object instead of applying a stale event
    // snapshot that could reactivate an already-canceled subscription.
    subscription = await stripe.subscriptions.retrieve(subscription.id);

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
    const unitAmount = (price.unit_amount || 0) / 100;
    const quantity = priceItem.quantity ?? 1;
    // weeklyAmount is the TOTAL weekly charge (per-child unit × quantity); the
    // admin revenue report sums this field.
    const weeklyAmount = price.recurring?.interval === 'week' ? unitAmount * quantity : 0;

    const igniteSession = IGNITE_SESSIONS.find(s => s.stripePriceId === priceItem.price.id);

    // Skip non-Ignite subscriptions
    if (!igniteSession) {
      console.log('Skipping non-Ignite subscription:', subscription.id);
      return;
    }

    // Legacy student names from subscription metadata (current flow stores the
    // real student records via handleIgniteSubscription; this is only used as a
    // fallback when creating the row and is never allowed to clobber existing
    // data on update).
    const legacyStudentNames = subscription.metadata?.student_names
      ? JSON.parse(subscription.metadata.student_names)
      : subscription.metadata?.studentNames
        ? JSON.parse(subscription.metadata.studentNames)
        : null;

    await prisma.igniteSubscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceItem.price.id,
        customerEmail: customer.email || '',
        customerName: customer.name || undefined,
        igniteSessionId: igniteSession.id,
        studentNames: legacyStudentNames,
        quantity,
        status: IGNITE_SUBSCRIPTION_STATUS[subscription.status] || 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        weeklyAmount,
      },
      // Lifecycle only — never overwrite studentNames (owned by
      // handleIgniteSubscription).
      update: {
        stripePriceId: priceItem.price.id,
        customerEmail: customer.email || '',
        customerName: customer.name || undefined,
        igniteSessionId: igniteSession.id,
        quantity,
        status: IGNITE_SUBSCRIPTION_STATUS[subscription.status] || 'ACTIVE',
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
    // Upsert from Stripe's current state so deletion-before-creation delivery
    // still creates a canceled local row and later stale events cannot revive it.
    await handleSubscriptionUpsert(subscription);
  } catch (error) {
    console.error('Error processing subscription deletion:', error);
    throw error;
  }
}

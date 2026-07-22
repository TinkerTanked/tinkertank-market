import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getIgniteScheduleFrom, getIgniteSessionConfig, igniteProductId } from '@/lib/ignite'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Upper bound on children per Ignite subscription (defensive; UI adds one at a time).
const MAX_IGNITE_STUDENTS = 20

const CreateCheckoutSessionSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    students: z.array(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      // Camps send age; Ignite sends dateOfBirth. Both optional at the schema
      // level and validated per-flow below.
      age: z.number().min(1).max(99).optional(),
      dateOfBirth: z.string().optional(),
      school: z.string().optional(),
      parentName: z.string().min(1),
      // Ignite captures the emergency contact instead of a per-child parent
      // email, so allow an empty string there.
      parentEmail: z.union([z.string().email(), z.literal('')]).optional(),
      parentPhone: z.string().min(1),
      allergies: z.union([z.string(), z.array(z.string())]).optional(),
      medicalNotes: z.string().optional(),
      emergencyContact: z.object({
        name: z.string(),
        phone: z.string(),
        relationship: z.string()
      }).optional(),
    })),
    selectedDate: z.string().optional(),
    selectedDates: z.array(z.string()).optional(),
    selectedTimeSlot: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    isSubscription: z.boolean().optional(),
    stripePriceId: z.string().optional(),
    productName: z.string().optional(),
    productPrice: z.number().optional(),
    location: z.string().optional(),
    venueAddress: z.string().optional(),
    notes: z.string().optional(),
  })),
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
})

type CheckoutItem = z.infer<typeof CreateCheckoutSessionSchema>['items'][number]
type CustomerInfo = z.infer<typeof CreateCheckoutSessionSchema>['customerInfo']

function normalizeAllergies(allergies: string | string[] | undefined): string | null {
  if (!allergies) return null
  return Array.isArray(allergies) ? allergies.join(', ') || null : allergies || null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateCheckoutSessionSchema.parse(body)

    const subscriptionItems = validatedData.items.filter(item => item.isSubscription)
    const regularItems = validatedData.items.filter(item => !item.isSubscription)

    // Stripe doesn't allow mixing subscription and one-time items in one session.
    if (subscriptionItems.length > 0 && regularItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot mix subscription and one-time items in the same checkout. Please complete them separately.' },
        { status: 400 }
      )
    }

    if (subscriptionItems.length > 0) {
      return await createIgniteSubscriptionCheckout(subscriptionItems, validatedData.customerInfo, request)
    }

    return await createRegularCheckout(regularItems, validatedData.customerInfo, request)
  } catch (error) {
    console.error('Create checkout session error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// -----------------------------------------------------------------------------
// Ignite subscriptions.
//
// Everything price/quantity/location/schedule related is resolved SERVER-SIDE
// from config so the client cannot influence billing. Student rows + OrderItems
// are created up front (PENDING order); the webhook reads them to create the
// subscription links + bookings after payment. See src/app/api/stripe/webhooks.
// -----------------------------------------------------------------------------
async function createIgniteSubscriptionCheckout(
  subscriptionItems: CheckoutItem[],
  customerInfo: CustomerInfo,
  request: NextRequest
) {
  if (subscriptionItems.length > 1) {
    return NextResponse.json(
      { error: 'Please purchase Ignite subscriptions one at a time.' },
      { status: 400 }
    )
  }

  const item = subscriptionItems[0]
  const session = getIgniteSessionConfig(item.productId)
  if (!session) {
    return NextResponse.json({ error: 'Ignite session not found' }, { status: 404 })
  }

  const students = item.students
  if (students.length < 1 || students.length > MAX_IGNITE_STUDENTS) {
    return NextResponse.json({ error: 'Please add at least one child.' }, { status: 400 })
  }
  if (item.quantity !== students.length) {
    return NextResponse.json({ error: 'Ignite quantity must match the number of children.' }, { status: 400 })
  }
  for (const s of students) {
    const birthdate = s.dateOfBirth ? new Date(s.dateOfBirth) : null
    if (!birthdate || Number.isNaN(birthdate.getTime()) || birthdate >= new Date()) {
      return NextResponse.json({ error: 'A valid date of birth is required for each child.' }, { status: 400 })
    }
    if (!s.emergencyContact?.name.trim() || !s.emergencyContact.phone.trim() || !s.emergencyContact.relationship.trim()) {
      return NextResponse.json({ error: 'Emergency contact details are required for each child.' }, { status: 400 })
    }
  }

  // Server-side Product (FK target for OrderItems/Bookings).
  const product = await prisma.product.findFirst({
    where: { id: igniteProductId(session.id), isActive: true },
  })
  if (!product) {
    return NextResponse.json(
      { error: 'This Ignite program is not set up yet. Please contact us.' },
      { status: 400 }
    )
  }

  // Resolve the location BEFORE charging — never silently fall back.
  const location = await prisma.location.findFirst({
    where: { name: { equals: session.location, mode: 'insensitive' }, isActive: true },
  })
  if (!location) {
    return NextResponse.json(
      { error: 'This Ignite location is not available for booking yet. Please contact us.' },
      { status: 400 }
    )
  }

  // Schedule the current/next term. The first future occurrence is the
  // enrollment effective date stored on the OrderItem.
  const schedule = getIgniteScheduleFrom(session, new Date())
  if (!schedule || schedule.occurrences.length === 0) {
    return NextResponse.json(
      { error: 'There are no upcoming sessions for this program yet. Please contact us.' },
      { status: 400 }
    )
  }
  const firstOccurrence = schedule.occurrences[0].start
  const weeklyPerChild = Number(product.price)

  const stripePrice = await stripe.prices.retrieve(session.stripePriceId)
  if (
    !stripePrice.active ||
    stripePrice.currency !== 'aud' ||
    stripePrice.recurring?.interval !== 'week' ||
    stripePrice.unit_amount !== Math.round(weeklyPerChild * 100)
  ) {
    console.error('Ignite Stripe price does not match product configuration', {
      sessionId: session.id,
      stripePriceId: session.stripePriceId
    })
    return NextResponse.json(
      { error: 'This Ignite program is temporarily unavailable. Please contact us.' },
      { status: 503 }
    )
  }

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        status: 'PENDING',
        totalAmount: weeklyPerChild * students.length,
        stripePaymentIntentId: null,
      },
    })

    for (const s of students) {
      const student = await tx.student.create({
        data: {
          name: `${s.firstName} ${s.lastName}`,
          birthdate: new Date(s.dateOfBirth as string),
          allergies: normalizeAllergies(s.allergies),
          school: s.school || null,
          medicalNotes: s.medicalNotes || null,
          emergencyContactName: s.emergencyContact?.name || s.parentName || null,
          emergencyContactPhone: s.emergencyContact?.phone || s.parentPhone || null,
        },
      })
      await tx.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: product.id,
          studentId: student.id,
          bookingDate: firstOccurrence,
          price: weeklyPerChild,
          location: session.location,
          notes: item.notes || null,
        },
      })
    }

    return createdOrder
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`

  const stripeSession = await stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      line_items: [{ price: session.stripePriceId, quantity: students.length }],
      customer_email: customerInfo.email,
      client_reference_id: order.id,
      // No child PII in Stripe metadata — only stable IDs the webhook needs.
      metadata: {
        orderId: order.id,
        isSubscription: 'true',
        subscriptionProductId: session.id,
        locationId: location.id,
      },
      subscription_data: {
        metadata: {
          orderId: order.id,
          igniteSessionId: session.id,
          locationId: location.id,
        },
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${appUrl}/checkout?canceled=true`,
    },
    { idempotencyKey: `ignite-checkout-${order.id}` }
  )

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: stripeSession.id },
  })

  return NextResponse.json({
    sessionId: stripeSession.id,
    orderId: order.id,
    url: stripeSession.url,
  })
}

// -----------------------------------------------------------------------------
// Camps & birthdays (one-time payment). Behaviour unchanged from before.
// -----------------------------------------------------------------------------
async function createRegularCheckout(
  regularItems: CheckoutItem[],
  customerInfo: CustomerInfo,
  request: NextRequest
) {
  for (const item of regularItems) {
    for (const student of item.students) {
      if (!student.age || !student.parentEmail) {
        return NextResponse.json(
          { error: 'Age and parent email are required for every camp or birthday participant.' },
          { status: 400 }
        )
      }
    }
  }

  const productIds = regularItems.map(item => item.productId)
  const products = productIds.length > 0 ? await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  }) : []

  if (regularItems.length > 0 && products.length !== productIds.length) {
    return NextResponse.json(
      { error: 'One or more products not found or inactive' },
      { status: 404 }
    )
  }

  let subtotal = 0
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  const orderItems = []

  for (const item of regularItems) {
    const product = products.find(p => p.id === item.productId)!
    const unitPrice = Number(product.price)
    const isBundle = item.productId.includes('bundle')
    const numberOfDays = item.selectedDates?.length || 1
    const numberOfStudents = item.students.length
    // For bundles, don't multiply by days - the bundle price already includes all days
    const quantity = isBundle ? numberOfStudents : numberOfDays * numberOfStudents

    subtotal += unitPrice * quantity

    lineItems.push({
      price_data: {
        currency: 'aud',
        product_data: {
          name: isBundle ? product.name : (numberOfDays > 1 ? `${product.name} (${numberOfDays} days)` : product.name),
          description: product.description,
        },
        unit_amount: Math.round(unitPrice * 100),
      },
      quantity,
    })

    for (const student of item.students) {
      const birthdate = new Date(new Date().getFullYear() - student.age!, 0, 1)
      const createdStudent = await prisma.student.create({
        data: {
          name: `${student.firstName} ${student.lastName}`,
          birthdate,
          allergies: normalizeAllergies(student.allergies),
        }
      })

      // Get all booking dates
      let bookingDates: Date[] = []
      if (item.selectedDates && item.selectedDates.length > 0) {
        bookingDates = item.selectedDates
          .filter(d => d && d !== 'undefined')
          .map(d => d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00.000Z'))
      } else if (item.selectedDate && item.selectedDate !== 'undefined') {
        const date = item.selectedDate.includes('T')
          ? new Date(item.selectedDate)
          : new Date(item.selectedDate + 'T00:00:00.000Z')
        bookingDates = [date]
      }

      if (bookingDates.length === 0) {
        console.error('No valid date provided for booking')
        throw new Error('Valid booking date is required')
      }

      // For birthday parties the customer picks a specific time slot. Encode
      // the slot's start time into the bookingDate so the webhook and admin
      // schedule render the actual party time rather than defaulting to 9am.
      if (product.type === 'BIRTHDAY' && item.selectedTimeSlot?.start) {
        const [hh, mm] = item.selectedTimeSlot.start.split(':').map(Number)
        if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
          bookingDates = bookingDates.map(d => {
            const withTime = new Date(d)
            withTime.setUTCHours(hh, mm, 0, 0)
            return withTime
          })
        }
      }

      // For bundles, create an order item for EACH date
      // For regular camps, create one order item per date selected
      const pricePerDay = isBundle ? unitPrice / bookingDates.length : unitPrice

      for (const bookingDate of bookingDates) {
        orderItems.push({
          productId: product.id,
          studentId: createdStudent.id,
          bookingDate,
          price: pricePerDay,
          location: item.location || null,
          venueAddress: item.venueAddress || null,
          notes: item.notes || null,
        })
      }
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`

  const order = await prisma.order.create({
    data: {
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
      status: 'PENDING',
      totalAmount: subtotal,
      stripePaymentIntentId: null,
      orderItems: orderItems.length > 0 ? {
        create: orderItems,
      } : undefined,
    },
  })

  const metadata: Record<string, string> = {
    orderId: order.id,
    customerName: customerInfo.name,
    customerPhone: customerInfo.phone,
    location: regularItems[0]?.location || '',
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: customerInfo.email,
    client_reference_id: order.id,
    metadata,
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    cancel_url: `${appUrl}/checkout?canceled=true`,
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: session.id },
  })

  return NextResponse.json({
    sessionId: session.id,
    orderId: order.id,
    url: session.url,
  })
}

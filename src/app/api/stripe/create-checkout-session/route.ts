import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { assertCampCapacity, CampCapacityExceededError, utcDateKey } from '@/lib/campCapacity'
import { assertBirthdaySlotAvailable, birthdaySlotStart, BirthdaySlotUnavailableError } from '@/lib/birthdayAvailability'
import { getIgniteCheckoutPlan, getIgniteSessionConfig, igniteProductId, SYDNEY_TZ } from '@/lib/ignite'
import { calculateAgeOnDate } from '@/lib/bookingSchema'
import { formatInTimeZone } from 'date-fns-tz'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Upper bound on children per Ignite subscription (defensive; UI adds one at a time).
const MAX_IGNITE_STUDENTS = 20

const CreateCheckoutSessionSchema = z.object({
  bookingSchemaVersion: z.literal(1).optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      students: z.array(
        z.object({
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
          emergencyContact: z
            .object({
              name: z.string(),
              phone: z.string(),
              relationship: z.string().optional(),
            })
            .optional(),
        })
      ),
      selectedDate: z.string().optional(),
      selectedDates: z.array(z.string()).optional(),
      selectedTimeSlot: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
      isSubscription: z.boolean().optional(),
      stripePriceId: z.string().optional(),
      productName: z.string().optional(),
      productPrice: z.number().optional(),
      location: z.string().optional(),
      venueAddress: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  customerInfo: z.object({
    name: z.string().min(1),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  emergencyContact: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(1),
      relationship: z.string().optional(),
    })
    .optional(),
})

type CheckoutItem = z.infer<typeof CreateCheckoutSessionSchema>['items'][number]
type CustomerInfo = z.infer<typeof CreateCheckoutSessionSchema>['customerInfo']

function normalizeAllergies(allergies: string | string[] | undefined): string | null {
  if (!allergies) return null
  return Array.isArray(allergies) ? allergies.join(', ') || null : allergies || null
}

function getMetaCheckoutMetadata(request: NextRequest): Record<string, string> {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const clientIpAddress = forwardedFor || request.headers.get('x-real-ip') || ''
  const clientUserAgent = request.headers.get('user-agent')?.slice(0, 500) || ''

  return {
    metaFbp: request.cookies.get('_fbp')?.value || '',
    metaFbc: request.cookies.get('_fbc')?.value || '',
    metaClientIp: clientIpAddress,
    metaClientUserAgent: clientUserAgent,
  }
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

    return await createRegularCheckout(
      regularItems,
      validatedData.customerInfo,
      validatedData.emergencyContact,
      validatedData.bookingSchemaVersion,
      request
    )
  } catch (error) {
    console.error('Create checkout session error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
async function createIgniteSubscriptionCheckout(subscriptionItems: CheckoutItem[], customerInfo: CustomerInfo, request: NextRequest) {
  if (subscriptionItems.length > 1) {
    return NextResponse.json({ error: 'Please purchase Ignite subscriptions one at a time.' }, { status: 400 })
  }

  const item = subscriptionItems[0]
  const session = getIgniteSessionConfig(item.productId)
  if (!session) {
    return NextResponse.json({ error: 'Ignite session not found' }, { status: 404 })
  }
  if (session.isBookable === false) {
    return NextResponse.json({ error: 'This Ignite session is no longer available.' }, { status: 410 })
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
    // Relationship is not collected by the Ignite wizard. Support parentName/
    // parentPhone as a fallback for carts persisted before emergencyContact was
    // added to the shared student shape.
    const emergencyContactName = s.emergencyContact?.name.trim() || s.parentName.trim()
    const emergencyContactPhone = s.emergencyContact?.phone.trim() || s.parentPhone.trim()
    if (!emergencyContactName || !emergencyContactPhone) {
      return NextResponse.json({ error: 'Emergency contact details are required for each child.' }, { status: 400 })
    }
  }

  // Server-side Product (FK target for OrderItems/Bookings).
  const product = await prisma.product.findFirst({
    where: { id: igniteProductId(session.id), isActive: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'This Ignite program is not set up yet. Please contact us.' }, { status: 400 })
  }

  // Resolve the location BEFORE charging — never silently fall back.
  const location = await prisma.location.findFirst({
    where: { name: { equals: session.location, mode: 'insensitive' }, isActive: true },
  })
  if (!location) {
    return NextResponse.json({ error: 'This Ignite location is not available for booking yet. Please contact us.' }, { status: 400 })
  }

  // Resolve the next payable occurrence and billing mode. Fixed-term sessions
  // can charge the next class immediately, anchor recurring billing to the
  // following class, and fall back to one-time checkout for their final class.
  const checkoutPlan = getIgniteCheckoutPlan(session, new Date())
  if (!checkoutPlan) {
    return NextResponse.json({ error: 'There are no upcoming sessions for this program yet. Please contact us.' }, { status: 400 })
  }
  const firstOccurrence = checkoutPlan.firstOccurrence.start
  const weeklyPerChild = Number(product.price)

  if (session.ageMin !== undefined || session.ageMax !== undefined) {
    const activityDate = formatInTimeZone(firstOccurrence, SYDNEY_TZ, 'yyyy-MM-dd')
    const ineligible = students.some(student => {
      const age = calculateAgeOnDate(student.dateOfBirth!, activityDate)
      return age === null || age < (session.ageMin ?? 0) || age > (session.ageMax ?? 99)
    })
    if (ineligible) {
      return NextResponse.json(
        { error: `${session.name} is for children aged ${session.ageMin}–${session.ageMax}.` },
        { status: 400 }
      )
    }
  }

  if (session.capacity !== undefined) {
    const startOfDay = new Date(`${firstOccurrence.toISOString().slice(0, 10)}T00:00:00.000Z`)
    const booked = await prisma.booking.count({
      where: {
        productId: igniteProductId(session.id),
        locationId: location.id,
        startDate: { gte: startOfDay, lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) },
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    })
    if (booked + students.length > session.capacity) {
      return NextResponse.json({ error: 'This Ignite session is sold out.' }, { status: 409 })
    }
  }

  const stripePrice = await stripe.prices.retrieve(session.stripePriceId)
  if (
    !stripePrice.active ||
    stripePrice.currency !== 'aud' ||
    stripePrice.recurring?.interval !== 'week' ||
    stripePrice.unit_amount !== Math.round(weeklyPerChild * 100)
  ) {
    console.error('Ignite Stripe price does not match product configuration', {
      sessionId: session.id,
      stripePriceId: session.stripePriceId,
    })
    return NextResponse.json({ error: 'This Ignite program is temporarily unavailable. Please contact us.' }, { status: 503 })
  }

  const order = await prisma.$transaction(async tx => {
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

  const isOneTime = checkoutPlan.kind === 'one-time'
  const isPrepaidSubscription = checkoutPlan.kind === 'prepaid-subscription'
  const oneTimeLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    price_data: {
      currency: 'aud',
      product: session.stripeProductId,
      unit_amount: Math.round(weeklyPerChild * 100)
    },
    quantity: students.length
  }
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = isOneTime
    ? [oneTimeLineItem]
    : isPrepaidSubscription
      ? [oneTimeLineItem, { price: session.stripePriceId, quantity: students.length }]
      : [{ price: session.stripePriceId, quantity: students.length }]

  const stripeSession = await stripe.checkout.sessions.create(
    {
      mode: isOneTime ? 'payment' : 'subscription',
      line_items: lineItems,
      customer_email: customerInfo.email,
      client_reference_id: order.id,
      // No child PII in Stripe metadata — only stable IDs the webhook needs.
      metadata: {
        orderId: order.id,
        isSubscription: String(!isOneTime),
        isIgniteSingleSession: String(isOneTime),
        igniteSessionId: session.id,
        subscriptionProductId: session.id,
        locationId: location.id,
        customerPhone: customerInfo.phone,
        ...getMetaCheckoutMetadata(request),
      },
      ...(!isOneTime ? {
        subscription_data: {
          ...(checkoutPlan.recurringStartsAt ? {
            trial_end: Math.floor(checkoutPlan.recurringStartsAt.getTime() / 1000)
          } : {}),
          metadata: {
            orderId: order.id,
            igniteSessionId: session.id,
            locationId: location.id,
          },
        }
      } : {}),
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
  emergencyContact: { name: string; phone: string; relationship?: string } | undefined,
  bookingSchemaVersion: 1 | undefined,
  request: NextRequest
) {
  for (const item of regularItems) {
    for (const student of item.students) {
      if (bookingSchemaVersion === 1) {
        if (!student.dateOfBirth) {
          return NextResponse.json({ error: 'Date of birth is required for every camp participant.' }, { status: 400 })
        }
      } else if (!student.age || !student.parentEmail) {
        return NextResponse.json({ error: 'Age and parent email are required for every camp or birthday participant.' }, { status: 400 })
      }
    }
  }

  const productIds = regularItems.map(item => item.productId)
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true },
        })
      : []

  if (regularItems.length > 0 && products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products not found or inactive' }, { status: 404 })
  }

  if (bookingSchemaVersion === 1) {
    if (products.some(product => product.type !== 'CAMP')) {
      return NextResponse.json({ error: 'This booking flow only supports camps.' }, { status: 400 })
    }
    for (const item of regularItems) {
      const product = products.find(candidate => candidate.id === item.productId)!
      const activityDates = item.selectedDates?.length ? item.selectedDates : item.selectedDate ? [item.selectedDate] : []
      for (const student of item.students) {
        const ages = activityDates.map(date => calculateAgeOnDate(student.dateOfBirth!, date.slice(0, 10)))
        if (ages.length === 0 || ages.some(age => age === null || age < product.ageMin || age > product.ageMax)) {
          return NextResponse.json({ error: `${product.name} is for children aged ${product.ageMin}–${product.ageMax}.` }, { status: 400 })
        }
      }
    }
  }

  // Validate the combined number of children across every camp product for a
  // location and date before sending the customer to Stripe. Capacity is
  // checked again under a database lock when payment completes.
  const capacityRequests = new Map<string, { location: string; date: Date; spots: number }>()
  for (const item of regularItems) {
    const product = products.find(candidate => candidate.id === item.productId)!
    if (product.type !== 'CAMP') continue

    if (!item.location) {
      return NextResponse.json({ error: 'A camp location is required.' }, { status: 400 })
    }

    const rawDates = item.selectedDates?.length ? item.selectedDates : item.selectedDate ? [item.selectedDate] : []
    if (rawDates.length === 0) {
      return NextResponse.json({ error: 'A valid camp date is required.' }, { status: 400 })
    }
    for (const rawDate of rawDates) {
      const date = new Date(rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00.000Z`)
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: 'A valid camp date is required.' }, { status: 400 })
      }

      const key = `${item.location}:${utcDateKey(date)}`
      const existing = capacityRequests.get(key)
      capacityRequests.set(key, {
        location: item.location,
        date,
        spots: (existing?.spots ?? 0) + item.students.length,
      })
    }
  }

  try {
    for (const request of capacityRequests.values()) {
      await assertCampCapacity(prisma, request.location, request.date, request.spots)
    }
  } catch (error) {
    if (error instanceof CampCapacityExceededError) {
      return NextResponse.json(
        {
          error:
            error.remaining === 0
              ? `${error.locationName} is sold out on ${error.date}.`
              : `Only ${error.remaining} camp place${error.remaining === 1 ? '' : 's'} remain at ${error.locationName} on ${error.date}.`,
          code: 'CAMP_CAPACITY_EXCEEDED',
          remaining: error.remaining,
        },
        { status: 409 }
      )
    }
    throw error
  }

  const birthdaySlots = new Map<string, Date>()
  for (const item of regularItems) {
    const product = products.find(candidate => candidate.id === item.productId)!
    if (product.type !== 'BIRTHDAY') continue

    const rawDate = item.selectedDate || item.selectedDates?.[0]
    const startTime = item.selectedTimeSlot?.start
    let dateKey: string | null = rawDate || null
    if (rawDate?.includes('T')) {
      const parsedDate = new Date(rawDate)
      dateKey = Number.isNaN(parsedDate.getTime()) ? null : utcDateKey(parsedDate)
    }
    const startDate = dateKey && startTime ? birthdaySlotStart(dateKey, startTime) : null
    if (!startDate) {
      return NextResponse.json({ error: 'A valid birthday date and time are required.' }, { status: 400 })
    }

    const slotKey = startDate.toISOString()
    if (birthdaySlots.has(slotKey)) {
      return NextResponse.json({ error: 'Only one birthday party can be booked in each time slot.' }, { status: 400 })
    }
    birthdaySlots.set(slotKey, startDate)
  }

  try {
    for (const startDate of birthdaySlots.values()) {
      await assertBirthdaySlotAvailable(prisma, startDate)
    }
  } catch (error) {
    if (error instanceof BirthdaySlotUnavailableError) {
      return NextResponse.json(
        {
          error: 'That birthday time has just been booked. Please choose another available time.',
          code: 'BIRTHDAY_SLOT_UNAVAILABLE',
        },
        { status: 409 }
      )
    }
    throw error
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
          name: isBundle ? product.name : numberOfDays > 1 ? `${product.name} (${numberOfDays} days)` : product.name,
          description: product.description,
        },
        unit_amount: Math.round(unitPrice * 100),
      },
      quantity,
    })

    for (const student of item.students) {
      const birthdate =
        bookingSchemaVersion === 1
          ? new Date(`${student.dateOfBirth}T00:00:00.000Z`)
          : new Date(new Date().getFullYear() - student.age!, 0, 1)
      const studentEmergencyContact = student.emergencyContact || emergencyContact
      const createdStudent = await prisma.student.create({
        data: {
          name: `${student.firstName} ${student.lastName}`,
          firstName: bookingSchemaVersion === 1 ? student.firstName : null,
          lastName: bookingSchemaVersion === 1 ? student.lastName : null,
          birthdate,
          allergies: normalizeAllergies(student.allergies),
          school: student.school?.trim() || null,
          medicalNotes: student.medicalNotes?.trim() || null,
          emergencyContactName: studentEmergencyContact?.name || student.parentName || null,
          emergencyContactPhone: studentEmergencyContact?.phone || student.parentPhone || null,
        },
      })

      // Get all booking dates
      let bookingDates: Date[] = []
      if (item.selectedDates && item.selectedDates.length > 0) {
        bookingDates = item.selectedDates
          .filter(d => d && d !== 'undefined')
          .map(d => (d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00.000Z')))
      } else if (item.selectedDate && item.selectedDate !== 'undefined') {
        const date = item.selectedDate.includes('T') ? new Date(item.selectedDate) : new Date(item.selectedDate + 'T00:00:00.000Z')
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
        bookingDates = bookingDates.map(d => birthdaySlotStart(utcDateKey(d), item.selectedTimeSlot!.start)!)
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
      customerFirstName: customerInfo.firstName || null,
      customerLastName: customerInfo.lastName || null,
      customerPhone: customerInfo.phone,
      emergencyContactName: emergencyContact?.name || customerInfo.name,
      emergencyContactPhone: emergencyContact?.phone || customerInfo.phone,
      emergencyContactRelationship: emergencyContact?.relationship || null,
      bookingSchemaVersion: bookingSchemaVersion || null,
      status: 'PENDING',
      totalAmount: subtotal,
      stripePaymentIntentId: null,
      orderItems:
        orderItems.length > 0
          ? {
              create: orderItems,
            }
          : undefined,
    },
  })

  const metadata: Record<string, string> = {
    orderId: order.id,
    customerName: customerInfo.name,
    customerPhone: customerInfo.phone,
    location: regularItems[0]?.location || '',
    ...getMetaCheckoutMetadata(request),
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: customerInfo.email,
    client_reference_id: order.id,
    metadata,
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    cancel_url: bookingSchemaVersion === 1 ? `${appUrl}/book/camps?canceled=true` : `${appUrl}/checkout?canceled=true`,
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

import type { Prisma, PrismaClient } from '@prisma/client'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { getLocationAvailabilityById, isDateKeyAvailableForLocation } from '@/data/locationAvailability'
import { getIgniteScheduleFrom, igniteProductId } from '@/lib/ignite'
import { assertCampCapacityForLocation, CampCapacityExceededError, resolveCampLocation } from '@/lib/campCapacity'
import { assertBirthdaySlotAvailable, BirthdaySlotUnavailableError, birthdaySlotStart, lockBirthdaySlot } from '@/lib/birthdayAvailability'
import { BookingActionError } from '@/lib/campBookingActions'

const SYDNEY_TZ = 'Australia/Sydney'
export const PARTY_START_TIMES = ['10:00', '13:00', '15:30'] as const

/** What the super admin is booking outside the normal checkout. */
export type ManualBookingRequest =
  | { kind: 'ignite'; sessionId: string; fromDate: string }
  | { kind: 'camp'; locationId: string; dates: string[]; allDay: boolean }
  | { kind: 'party'; productId: string; date: string; startTime: string; venueAddress?: string }

export interface ManualBookingInput {
  student:
    | { id: string }
    | { firstName: string; lastName: string; birthdate: string; allergies?: string; medicalNotes?: string; school?: string }
  parent: { name: string; email: string; phone?: string }
  booking: ManualBookingRequest
  payment: { kind: 'invoiced'; amount: number } | { kind: 'complimentary' }
}

interface PlannedItem {
  productId: string
  locationId: string
  locationName: string
  start: Date
  end: Date
  bookingDate: Date
  label: string
}

export interface ManualBookingPlan {
  items: PlannedItem[]
  suggestedAmount: number
  summary: string
}

type Db = Pick<PrismaClient, '$transaction' | 'booking' | 'product' | 'location' | 'student' | 'order' | '$executeRaw'>
type Tx = Prisma.TransactionClient

const isDateKey = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const utcDay = (dateKey: string) => {
  const start = new Date(`${dateKey}T00:00:00.000Z`)
  return { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
}
const prettyDate = (dateKey: string) => formatInTimeZone(new Date(`${dateKey}T12:00:00Z`), 'UTC', 'EEE d MMM')
const money = (value: number) => Math.round(value * 100) / 100

/**
 * Work out exactly which sessions a manual booking creates and what the
 * normal price would be. Capacity and slot checks run here (and again under a
 * lock when the booking is created), so the preview shows real problems.
 */
export async function planManualBooking(db: Tx | Db, request: ManualBookingRequest, studentId: string | null): Promise<ManualBookingPlan> {
  if (request.kind === 'ignite') {
    const session = IGNITE_SESSIONS.find(candidate => candidate.id === request.sessionId)
    if (!session) throw new BookingActionError('Choose an Ignite session.')
    if (!isDateKey(request.fromDate)) throw new BookingActionError('Choose a start date.')

    const from = fromZonedTime(`${request.fromDate}T00:00:00`, SYDNEY_TZ)
    const occurrences = (getIgniteScheduleFrom(session, from)?.occurrences ?? []).filter(occurrence => occurrence.start >= from)
    if (occurrences.length === 0) throw new BookingActionError(`${session.location} has no sessions left this term from that date.`)

    const [location, product] = await Promise.all([
      db.location.findFirst({ where: { name: { equals: session.location, mode: 'insensitive' }, isActive: true } }),
      db.product.findUnique({ where: { id: igniteProductId(session.id) } })
    ])
    if (!location || !product) throw new BookingActionError(`${session.location} is not set up for Ignite yet.`, 409)

    const already = studentId
      ? await db.booking.findMany({
          where: {
            studentId,
            productId: product.id,
            status: { in: ['CONFIRMED', 'PENDING'] },
            startDate: { in: occurrences.map(o => o.start) }
          },
          select: { startDate: true }
        })
      : []
    const taken = new Set(already.map(booking => booking.startDate.getTime()))
    const remaining = occurrences.filter(occurrence => !taken.has(occurrence.start.getTime()))
    if (remaining.length === 0) throw new BookingActionError('This child is already booked into every remaining session.', 409)

    const first = formatInTimeZone(remaining[0].start, SYDNEY_TZ, 'EEE d MMM')
    const last = formatInTimeZone(remaining[remaining.length - 1].start, SYDNEY_TZ, 'EEE d MMM')
    return {
      items: remaining.map(occurrence => ({
        productId: product.id,
        locationId: location.id,
        locationName: location.name,
        start: occurrence.start,
        end: occurrence.end,
        bookingDate: occurrence.start,
        label: formatInTimeZone(occurrence.start, SYDNEY_TZ, 'EEE d MMM')
      })),
      suggestedAmount: money(session.priceWeekly * remaining.length),
      summary: `${remaining.length} Ignite session${remaining.length === 1 ? '' : 's'} at ${session.location}, ${first}${remaining.length > 1 ? ` – ${last}` : ''}${taken.size ? ` (${taken.size} already booked)` : ''}`
    }
  }

  if (request.kind === 'camp') {
    const camp = getLocationAvailabilityById(request.locationId)
    if (!camp) throw new BookingActionError('Choose a camp location.')
    const dates = [...new Set(request.dates)].sort()
    if (dates.length === 0 || !dates.every(isDateKey)) throw new BookingActionError('Add at least one camp date.')
    if (request.allDay && !camp.availableCampTypes.includes('allday'))
      throw new BookingActionError(`${camp.locationName} only runs Day Camp.`)

    const [location, product] = await Promise.all([
      resolveCampLocation(db, camp.locationName),
      db.product.findUnique({ where: { id: request.allDay ? 'all-day-camp' : 'day-camp' } })
    ])
    if (!location || !product) throw new BookingActionError(`${camp.locationName} is not set up for camps yet.`, 409)

    for (const dateKey of dates) {
      if (!isDateKeyAvailableForLocation(dateKey, camp.locationName)) {
        throw new BookingActionError(`${camp.locationName} has no camp on ${prettyDate(dateKey)}.`, 409)
      }
      if (studentId) {
        const clash = await db.booking.findFirst({
          where: { studentId, status: { in: ['CONFIRMED', 'PENDING'] }, product: { type: 'CAMP' }, startDate: utcDay(dateKey) }
        })
        if (clash) throw new BookingActionError(`This child is already booked into camp on ${prettyDate(dateKey)}.`, 409)
      }
      try {
        await assertCampCapacityForLocation(db, location, new Date(`${dateKey}T00:00:00.000Z`), 1)
      } catch (error) {
        if (error instanceof CampCapacityExceededError)
          throw new BookingActionError(`${camp.locationName} is full on ${prettyDate(dateKey)}.`, 409)
        throw error
      }
    }

    return {
      items: dates.map(dateKey => ({
        productId: product.id,
        locationId: location.id,
        locationName: camp.locationName,
        start: new Date(`${dateKey}T09:00:00.000Z`),
        end: new Date(`${dateKey}T${request.allDay ? '17' : '15'}:00:00.000Z`),
        bookingDate: new Date(`${dateKey}T00:00:00.000Z`),
        label: prettyDate(dateKey)
      })),
      suggestedAmount: money(Number(product.price) * dates.length),
      summary: `${dates.length} ${product.name} day${dates.length === 1 ? '' : 's'} at ${camp.locationName}: ${dates.map(prettyDate).join(', ')}`
    }
  }

  const product = await db.product.findUnique({ where: { id: request.productId } })
  if (!product || product.type !== 'BIRTHDAY') throw new BookingActionError('Choose a party.')
  // Birthday times are Sydney wall-clock fields stored as UTC (10:00 → T10:00Z).
  const start = PARTY_START_TIMES.includes(request.startTime as (typeof PARTY_START_TIMES)[number])
    ? birthdaySlotStart(request.date, request.startTime)
    : null
  if (!start) throw new BookingActionError('Choose a party date and time.')
  try {
    await assertBirthdaySlotAvailable(db, start)
  } catch (error) {
    if (error instanceof BirthdaySlotUnavailableError) throw new BookingActionError('Another party is already booked at that time.', 409)
    throw error
  }

  const atTheirVenue = !!request.venueAddress?.trim()
  const location = atTheirVenue
    ? ((await db.location.findFirst({ where: { name: 'Your Venue' } })) ??
      (await db.location.create({ data: { name: 'Your Venue', address: 'Customer-provided venue', capacity: 0 } })))
    : await resolveCampLocation(db, 'TinkerTank Neutral Bay')
  if (!location) throw new BookingActionError('The Neutral Bay studio is not set up as a location.', 409)

  return {
    items: [
      {
        productId: product.id,
        locationId: location.id,
        locationName: atTheirVenue ? 'Your Venue' : 'TinkerTank Neutral Bay',
        start,
        end: new Date(start.getTime() + (product.duration || 120) * 60 * 1000),
        bookingDate: start,
        label: `${prettyDate(request.date)} ${request.startTime}`
      }
    ],
    suggestedAmount: money(Number(product.price)),
    summary: `${product.name} on ${prettyDate(request.date)} at ${request.startTime}, ${atTheirVenue ? request.venueAddress!.trim() : 'Neutral Bay studio'}`
  }
}

function validateInput(input: ManualBookingInput) {
  const name = input.parent?.name?.trim()
  const email = input.parent?.email?.trim().toLowerCase()
  if (!name) throw new BookingActionError("Enter the parent's name.")
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BookingActionError("Enter the parent's email.")
  if (!('id' in input.student)) {
    if (!input.student.firstName?.trim() || !input.student.lastName?.trim())
      throw new BookingActionError("Enter the child's first and last name.")
    if (!isDateKey(input.student.birthdate)) throw new BookingActionError("Enter the child's date of birth.")
  }
  const amount = input.payment.kind === 'invoiced' ? Number(input.payment.amount) : 0
  if (!Number.isFinite(amount) || amount < 0) throw new BookingActionError('Enter the invoiced amount.')
  return { name, email, phone: input.parent.phone?.trim() || null, amount: money(amount) }
}

/**
 * Book a child outside the normal checkout (e.g. a term invoiced directly).
 * Creates the child if needed, the bookings, and a paid order so the family
 * shows under Customers and the amount counts as revenue now.
 */
export async function createManualBooking(db: Db, input: ManualBookingInput) {
  const { name, email, phone, amount } = validateInput(input)
  const label = input.payment.kind === 'invoiced' ? `Invoiced $${amount.toFixed(2)}` : 'Complimentary'

  return db.$transaction(async tx => {
    let studentId: string
    if ('id' in input.student) {
      const student = await tx.student.findUnique({ where: { id: input.student.id }, select: { id: true } })
      if (!student) throw new BookingActionError('That child no longer exists.', 404)
      studentId = student.id
    } else {
      const child = input.student
      const created = await tx.student.create({
        data: {
          name: `${child.firstName.trim()} ${child.lastName.trim()}`,
          firstName: child.firstName.trim(),
          lastName: child.lastName.trim(),
          birthdate: new Date(`${child.birthdate}T00:00:00.000Z`),
          school: child.school?.trim() || null,
          allergies: child.allergies?.trim() || null,
          medicalNotes: child.medicalNotes?.trim() || null,
          emergencyContactName: name,
          emergencyContactPhone: phone
        }
      })
      studentId = created.id
    }

    // Lock what is being booked, then plan against the locked state.
    if (input.booking.kind === 'camp') {
      const camp = getLocationAvailabilityById(input.booking.locationId)
      const location = camp ? await resolveCampLocation(tx, camp.locationName) : null
      if (location) {
        for (const dateKey of [...new Set(input.booking.dates)].filter(isDateKey).sort()) {
          await assertCampCapacityForLocation(tx, location, new Date(`${dateKey}T00:00:00.000Z`), 0, true)
        }
      }
    } else if (input.booking.kind === 'party') {
      const start = birthdaySlotStart(input.booking.date, input.booking.startTime)
      if (start) await lockBirthdaySlot(tx, start)
    }
    const plan = await planManualBooking(tx, input.booking, studentId)

    // Spread the amount over the sessions so per-day prices add up to the total.
    const cents = Math.round(amount * 100)
    const each = Math.floor(cents / plan.items.length)
    const priceFor = (index: number) => (each + (index === plan.items.length - 1 ? cents - each * plan.items.length : 0)) / 100

    const order = await tx.order.create({
      data: {
        customerEmail: email,
        customerName: name,
        customerFirstName: name.split(' ')[0],
        customerLastName: name.split(' ').slice(1).join(' ') || null,
        customerPhone: phone,
        status: 'PAID',
        totalAmount: amount,
        orderItems: {
          create: plan.items.map((item, index) => ({
            productId: item.productId,
            studentId,
            bookingDate: item.bookingDate,
            price: priceFor(index),
            location: item.locationName,
            venueAddress: input.booking.kind === 'party' ? input.booking.venueAddress?.trim() || null : null,
            notes: `Added by admin · ${label}`
          }))
        }
      }
    })

    await tx.booking.createMany({
      data: plan.items.map((item, index) => ({
        studentId,
        productId: item.productId,
        locationId: item.locationId,
        startDate: item.start,
        endDate: item.end,
        status: 'CONFIRMED' as const,
        totalPrice: priceFor(index),
        // Ignite bookings without a Stripe subscription stay on the roster only as an override.
        rosterOverride: input.booking.kind === 'ignite',
        notes: `Order: ${order.id} | Added by admin · ${label}`
      }))
    })

    return { orderId: order.id, studentId, customerEmail: email, count: plan.items.length, summary: plan.summary, amount }
  })
}

import type { Prisma, PrismaClient } from '@prisma/client'
import type Stripe from 'stripe'
import { formatInTimeZone } from 'date-fns-tz'
import { getLocationAvailabilityById, isDateKeyAvailableForLocation } from '@/data/locationAvailability'
import { assertCampCapacityForLocation, CampCapacityExceededError, resolveCampLocation, utcDateKey } from '@/lib/campCapacity'

/** A refusal the super admin can act on, with the HTTP status to return. */
export class BookingActionError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message)
    this.name = 'BookingActionError'
  }
}

type Db = Pick<PrismaClient, '$transaction' | 'booking' | 'orderItem' | 'campCredit'>
type Tx = Prisma.TransactionClient

const bookingInclude = { product: true, location: true, attendance: true, student: true } as const

export function formatCampDate(dateKey: string) {
  return formatInTimeZone(new Date(`${dateKey}T12:00:00.000Z`), 'UTC', 'EEEE d MMMM yyyy')
}

function utcDay(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00.000Z`)
  return { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
}

/** The paid order line behind a camp booking. Emails, reports and parent lookups read it. */
async function findCampOrderItem(tx: Pick<Tx, 'orderItem'>, booking: { studentId: string; productId: string; startDate: Date }) {
  return tx.orderItem.findFirst({
    where: {
      studentId: booking.studentId,
      productId: booking.productId,
      bookingDate: utcDay(utcDateKey(booking.startDate)),
      order: { status: 'PAID' },
    },
    include: { order: true },
    orderBy: { createdAt: 'desc' },
  })
}

function assertMovableCampDay(booking: { product: { type: string }; status: string; attendance: unknown } | null) {
  if (!booking) throw new BookingActionError('Booking not found.', 404)
  if (booking.product.type !== 'CAMP') throw new BookingActionError('Only camp days can be changed here.')
  if (booking.status !== 'CONFIRMED') throw new BookingActionError('Only confirmed camp days can be changed.', 409)
  if (booking.attendance) throw new BookingActionError('This child was already checked in for that day.', 409)
}

/**
 * Move a confirmed camp day to another date and/or camp location. Moves are
 * free, but only to days that location runs camps and still has a place.
 */
export async function moveCampBooking(db: Db, bookingId: string, target: { dateKey: string; locationId: string }, now = new Date()) {
  const { dateKey, locationId } = target
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new BookingActionError('Choose a valid date.')
  if (dateKey < formatInTimeZone(now, 'Australia/Sydney', 'yyyy-MM-dd')) throw new BookingActionError('Choose today or a later date.')

  const camp = getLocationAvailabilityById(locationId)
  if (!camp) throw new BookingActionError('Choose a camp location.')
  if (!isDateKeyAvailableForLocation(dateKey, camp.locationName)) {
    throw new BookingActionError(`${camp.locationName} has no camp on ${formatCampDate(dateKey)}.`, 409)
  }

  try {
    return await db.$transaction(async tx => {
      const found = await tx.booking.findUnique({ where: { id: bookingId }, include: bookingInclude })
      assertMovableCampDay(found)
      const current = found!

      if (current.product.name.toLowerCase().includes('all day') && !camp.availableCampTypes.includes('allday')) {
        throw new BookingActionError(`${camp.locationName} only runs Day Camp.`, 409)
      }

      const location = await resolveCampLocation(tx, camp.locationName)
      if (!location) throw new BookingActionError(`${camp.locationName} is not set up as a location yet.`, 409)

      const fromDateKey = utcDateKey(current.startDate)
      if (fromDateKey === dateKey && location.id === current.locationId) {
        throw new BookingActionError('That is already the booked day and location.')
      }

      const clash = await tx.booking.findFirst({
        where: {
          id: { not: current.id },
          studentId: current.studentId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          product: { type: 'CAMP' },
          startDate: utcDay(dateKey),
        },
      })
      if (clash) throw new BookingActionError(`${current.student.name} is already booked into camp that day.`, 409)

      await assertCampCapacityForLocation(tx, location, new Date(`${dateKey}T00:00:00.000Z`), 1, true)

      // Keep the stored time of day (e.g. 9am–3pm) and change only the date.
      const onNewDate = (date: Date) => new Date(`${dateKey}T${date.toISOString().slice(11)}`)
      const note = `Moved from ${fromDateKey} at ${current.location.name} on ${now.toISOString().slice(0, 10)}`
      const booking = await tx.booking.update({
        where: { id: current.id },
        data: {
          startDate: onNewDate(current.startDate),
          endDate: onNewDate(current.endDate),
          locationId: location.id,
          notes: current.notes ? `${current.notes}\n${note}` : note,
        },
        include: bookingInclude,
      })

      const item = await findCampOrderItem(tx, current)
      if (item) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: { bookingDate: onNewDate(item.bookingDate), location: camp.locationName },
        })
      }

      return {
        booking,
        customer: item ? { email: item.order.customerEmail, name: item.order.customerName } : null,
        from: { dateKey: fromDateKey, locationName: current.location.name },
        to: { dateKey, locationName: camp.locationName, address: camp.address },
      }
    })
  } catch (error) {
    if (error instanceof CampCapacityExceededError) {
      throw new BookingActionError(`${camp.locationName} is full on ${formatCampDate(dateKey)}.`, 409)
    }
    throw error
  }
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function campCreditCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return `TT-${Array.from(bytes, byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('')}`
}

/** Camp credits last one year from the day they are issued. */
export function campCreditExpiry(issuedAt: Date) {
  const expiresAt = new Date(issuedAt)
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1)
  return expiresAt
}

/**
 * Cancel a confirmed camp day and give the family a credit for what they paid
 * for it. The credit is a single-use Stripe promotion code, so Stripe enforces
 * the amount, the single use and the one-year expiry at checkout. No refunds.
 */
export async function issueCampCredit(
  db: Db,
  stripe: { coupons: Pick<Stripe['coupons'], 'create' | 'del'>; promotionCodes: Pick<Stripe['promotionCodes'], 'create'> },
  bookingId: string,
  now = new Date()
) {
  const found = await db.booking.findUnique({ where: { id: bookingId }, include: { ...bookingInclude, campCredit: true } })
  assertMovableCampDay(found)
  const current = found!
  if (current.campCredit) throw new BookingActionError('A credit was already issued for this day.', 409)

  const item = await findCampOrderItem(db, current)
  if (!item) throw new BookingActionError('No paid order was found for this camp day, so there is nothing to credit.', 409)
  const amount = Math.round(Number(item.price) * 100) / 100
  if (!(amount > 0)) throw new BookingActionError('This camp day was free, so there is nothing to credit.', 409)

  const expiresAt = campCreditExpiry(now)
  const dateKey = utcDateKey(current.startDate)
  const metadata = { bookingId: current.id, studentId: current.studentId, orderId: item.orderId, reason: 'camp_cancellation' }

  const coupon = await stripe.coupons.create({
    name: 'TinkerTank camp credit',
    amount_off: Math.round(amount * 100),
    currency: 'aud',
    duration: 'once',
    max_redemptions: 1,
    redeem_by: Math.floor(expiresAt.getTime() / 1000),
    metadata,
  })

  try {
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: campCreditCode(),
      max_redemptions: 1,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      metadata,
    })

    const credit = await db.$transaction(async tx => {
      const cancelled = await tx.booking.updateMany({
        where: { id: current.id, status: 'CONFIRMED' },
        data: { status: 'CANCELLED' },
      })
      if (cancelled.count === 0) throw new BookingActionError('This booking changed while you were working. Refresh and try again.', 409)

      return tx.campCredit.create({
        data: {
          code: promotionCode.code,
          amount,
          customerEmail: item.order.customerEmail.trim().toLowerCase(),
          customerName: item.order.customerName,
          bookingId: current.id,
          stripeCouponId: coupon.id,
          stripePromotionCodeId: promotionCode.id,
          expiresAt,
        },
      })
    })

    return {
      credit,
      studentName: current.student.name,
      productName: current.product.name,
      dateKey,
      locationName: current.location.name,
    }
  } catch (error) {
    // Deleting the coupon also stops any promotion code made from it, so a
    // failed cancellation never leaves a usable credit behind.
    await stripe.coupons.del(coupon.id).catch(() => undefined)
    throw error
  }
}

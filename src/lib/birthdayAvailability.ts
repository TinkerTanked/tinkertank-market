import { Prisma } from '@prisma/client'

type BirthdayAvailabilityClient = Pick<Prisma.TransactionClient, 'booking' | '$executeRaw'>

export class BirthdaySlotUnavailableError extends Error {
  constructor(readonly startDate: Date) {
    super(`Birthday slot is unavailable: ${startDate.toISOString()}`)
    this.name = 'BirthdaySlotUnavailableError'
  }
}

export function birthdaySlotStart(date: string, startTime: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime)) return null

  const startDate = new Date(`${date}T${startTime}:00.000Z`)
  if (Number.isNaN(startDate.getTime())) return null

  const parsedTime = `${String(startDate.getUTCHours()).padStart(2, '0')}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`
  return startDate.toISOString().slice(0, 10) === date && parsedTime === startTime ? startDate : null
}

export async function lockBirthdaySlot(db: BirthdayAvailabilityClient, startDate: Date) {
  const lockKey = `birthday-slot:${startDate.toISOString()}`
  await db.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`)
}

export async function assertBirthdaySlotAvailable(
  db: BirthdayAvailabilityClient,
  startDate: Date,
  lock = false
) {
  if (lock) {
    await lockBirthdaySlot(db, startDate)
  }

  const existingBooking = await db.booking.findFirst({
    where: {
      startDate,
      status: { in: ['CONFIRMED', 'PENDING'] },
      product: { type: 'BIRTHDAY' }
    },
    select: { id: true }
  })

  if (existingBooking) {
    throw new BirthdaySlotUnavailableError(startDate)
  }
}

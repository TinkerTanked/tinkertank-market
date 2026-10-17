import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SCHOOL_TERMS } from '@/config/schoolTerms'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { isClosureDate } from '@/data/closureDates'
import { isDateKeyAvailableForLocation, LOCATION_AVAILABILITY } from '@/data/locationAvailability'
import { resolveCampLocation } from '@/lib/campCapacity'
import { igniteDaysLabel, igniteProductId } from '@/lib/ignite'
import { addDaysToKey, campHolidayWindow, sydneyDateKey, weekdayOfKey } from '@/lib/adminAnalytics'

const DAY_MS = 24 * 60 * 60 * 1000
const PARTY_SLOTS_PER_DAY = 3

const countWhere = (dates: Date[], from: Date, to: Date) => dates.filter(date => date >= from && date < to).length

export async function GET() {
  try {
    const now = new Date()
    const today = sydneyDateKey(now)
    const ago = (days: number) => new Date(now.getTime() - days * DAY_MS)

    // ── Camp fill for the coming school holidays ────────────────────────────
    const holiday = campHolidayWindow(SCHOOL_TERMS, today)
    const campFill = holiday
      ? await Promise.all(
          LOCATION_AVAILABILITY.map(async camp => {
            const location = await resolveCampLocation(prisma, camp.locationName)
            const booked = location
              ? await prisma.booking.findMany({
                  where: {
                    locationId: location.id,
                    status: { in: ['CONFIRMED', 'PENDING'] },
                    product: { type: 'CAMP' },
                    startDate: { gte: new Date(`${holiday.start}T00:00:00Z`), lt: new Date(`${addDaysToKey(holiday.end, 1)}T00:00:00Z`) }
                  },
                  select: { startDate: true }
                })
              : []
            const counts = new Map<string, number>()
            for (const booking of booked) {
              const key = booking.startDate.toISOString().slice(0, 10)
              counts.set(key, (counts.get(key) ?? 0) + 1)
            }
            const days: { date: string; booked: number }[] = []
            for (let key = holiday.start; key <= holiday.end; key = addDaysToKey(key, 1)) {
              const weekday = weekdayOfKey(key)
              const runs =
                weekday !== 0 &&
                weekday !== 6 &&
                isDateKeyAvailableForLocation(key, camp.locationName) &&
                !isClosureDate(new Date(`${key}T12:00:00`))
              if (runs || counts.has(key)) days.push({ date: key, booked: counts.get(key) ?? 0 })
            }
            const capacity = location?.capacity ?? camp.dailyCapacity ?? 35
            return {
              id: camp.locationId,
              name: camp.locationName,
              capacity,
              days,
              booked: days.reduce((sum, day) => sum + day.booked, 0),
              places: days.length * capacity
            }
          })
        )
      : []

    // ── Sales pace from paid orders ─────────────────────────────────────────
    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID', createdAt: { gte: ago(60) } },
      select: { createdAt: true, orderItems: { select: { product: { select: { type: true } } } } }
    })

    const campSales: Date[] = []
    const partySales: Date[] = []
    for (const order of paidOrders) {
      for (const item of order.orderItems) {
        if (item.product.type === 'CAMP') campSales.push(order.createdAt)
        if (item.product.type === 'BIRTHDAY') partySales.push(order.createdAt)
      }
    }

    const round = (value: number) => Math.round(value * 100) / 100

    // ── Ignite ──────────────────────────────────────────────────────────────
    const subscriptions = await prisma.igniteSubscription.findMany({
      select: {
        status: true,
        igniteSessionId: true,
        weeklyAmount: true,
        createdAt: true,
        canceledAt: true,
        cancelAt: true,
        students: { select: { studentId: true } }
      }
    })
    const running = subscriptions.filter(sub => sub.status === 'ACTIVE' || sub.status === 'TRIALING')
    const manualRoster = await prisma.booking.findMany({
      where: { rosterOverride: true, igniteSubscriptionId: null, status: 'CONFIRMED', startDate: { gte: now } },
      select: { studentId: true, productId: true },
      distinct: ['studentId', 'productId']
    })
    const sessions = IGNITE_SESSIONS.map(session => {
      const enrolled = new Set([
        ...running.filter(sub => sub.igniteSessionId === session.id).flatMap(sub => sub.students.map(link => link.studentId)),
        ...manualRoster.filter(booking => booking.productId === igniteProductId(session.id)).map(booking => booking.studentId)
      ])
      return {
        id: session.id,
        location: session.location,
        days: igniteDaysLabel(session),
        isBookable: session.isBookable !== false,
        enrolled: enrolled.size,
        capacity: session.capacity ?? 20
      }
    })
      .filter(session => session.isBookable || session.enrolled > 0)
      .sort((a, b) => a.enrolled / a.capacity - b.enrolled / b.capacity)

    // ── Party slots over the next 8 weeks (Fri and Sat, three slots each) ────
    const partyDays: string[] = []
    for (let key = today; key < addDaysToKey(today, 56); key = addDaysToKey(key, 1)) {
      const weekday = weekdayOfKey(key)
      if ((weekday === 5 || weekday === 6) && !isClosureDate(new Date(`${key}T12:00:00`))) partyDays.push(key)
    }
    const parties = partyDays.length
      ? await prisma.booking.findMany({
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
            product: { type: 'BIRTHDAY' },
            startDate: {
              gte: new Date(`${partyDays[0]}T00:00:00Z`),
              lt: new Date(`${addDaysToKey(partyDays[partyDays.length - 1], 1)}T00:00:00Z`)
            }
          },
          select: { startDate: true }
        })
      : []
    const partyWeeks = new Map<string, { weekStart: string; booked: number; slots: number }>()
    for (const key of partyDays) {
      const week = addDaysToKey(key, -((weekdayOfKey(key) + 6) % 7))
      const entry = partyWeeks.get(week) ?? { weekStart: week, booked: 0, slots: 0 }
      entry.slots += PARTY_SLOTS_PER_DAY
      // Party times are Sydney wall-clock fields stored as UTC, so the UTC date is the party date.
      entry.booked += parties.filter(party => party.startDate.toISOString().slice(0, 10) === key).length
      partyWeeks.set(week, entry)
    }

    return NextResponse.json({
      generatedAt: now.toISOString(),
      campFill: holiday ? { name: holiday.name, start: holiday.start, end: holiday.end, locations: campFill } : null,
      pace: {
        campDays: {
          last7: countWhere(campSales, ago(7), now),
          prev7: countWhere(campSales, ago(14), ago(7)),
          last30: countWhere(campSales, ago(30), now),
          prev30: countWhere(campSales, ago(60), ago(30))
        },
        parties: { last30: countWhere(partySales, ago(30), now), prev30: countWhere(partySales, ago(60), ago(30)) },
        igniteNew: {
          last30: countWhere(
            subscriptions.map(sub => sub.createdAt),
            ago(30),
            now
          ),
          prev30: countWhere(
            subscriptions.map(sub => sub.createdAt),
            ago(60),
            ago(30)
          )
        }
      },
      ignite: {
        active: running.length,
        weeklyRecurring: round(running.reduce((sum, sub) => sum + Number(sub.weeklyAmount), 0)),
        paused: subscriptions.filter(sub => sub.status === 'PAUSED').length,
        cancelling: running.filter(sub => sub.cancelAt && sub.cancelAt > now).length,
        // Stripe sets canceled_at when a cancellation is scheduled, so only count ones that have ended.
        cancelledLast30: countWhere(
          subscriptions.flatMap(sub => (sub.status === 'CANCELED' && sub.canceledAt ? [sub.canceledAt] : [])),
          ago(30),
          now
        ),
        manualStudents: new Set(manualRoster.map(booking => booking.studentId)).size,
        sessions
      },
      parties: { weeks: [...partyWeeks.values()], booked: parties.length, slots: partyDays.length * PARTY_SLOTS_PER_DAY }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}

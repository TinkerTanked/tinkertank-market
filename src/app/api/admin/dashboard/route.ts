import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { addDaysToKey, sydneyDateKey } from '@/lib/adminAnalytics'

const DAY_MS = 24 * 60 * 60 * 1000
const sessionName = (id: string | null) => IGNITE_SESSIONS.find(session => session.id === id)?.location ?? 'Ignite'

/** What the super admin should act on today. Today's roster comes from the schedule API. */
export async function GET() {
  try {
    const now = new Date()
    const today = sydneyDateKey(now)

    const [unpaid, ending, parties, upcoming] = await Promise.all([
      prisma.igniteSubscription.findMany({
        where: { status: 'PAST_DUE' },
        select: { id: true, customerName: true, customerEmail: true, igniteSessionId: true }
      }),
      prisma.igniteSubscription.findMany({
        where: { status: { in: ['ACTIVE', 'TRIALING'] }, cancelAt: { gt: now, lte: new Date(now.getTime() + 14 * DAY_MS) } },
        orderBy: { cancelAt: 'asc' },
        select: { id: true, customerName: true, customerEmail: true, igniteSessionId: true, cancelAt: true }
      }),
      // Party times are Sydney wall-clock fields stored as UTC.
      prisma.booking.findMany({
        where: {
          status: { in: ['CONFIRMED', 'PENDING'] },
          product: { type: 'BIRTHDAY' },
          startDate: { gte: new Date(`${today}T00:00:00Z`), lt: new Date(`${addDaysToKey(today, 8)}T00:00:00Z`) }
        },
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          startDate: true,
          studentId: true,
          student: { select: { name: true } },
          product: { select: { name: true } },
          location: { select: { name: true } }
        }
      }),
      prisma.booking.findMany({
        where: { status: 'CONFIRMED', startDate: { gte: now, lt: new Date(now.getTime() + 14 * DAY_MS) } },
        select: { student: { select: { id: true, name: true, emergencyContactPhone: true, birthdateEstimated: true } } },
        distinct: ['studentId']
      })
    ])

    const missingDetails = upcoming
      .map(booking => booking.student)
      .filter(student => !student.emergencyContactPhone?.trim() || student.birthdateEstimated)
      .map(student => ({
        studentId: student.id,
        name: student.name,
        reason: !student.emergencyContactPhone?.trim() ? 'No emergency contact phone' : 'Date of birth is an estimate'
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      unpaid: unpaid.map(sub => ({
        id: sub.id,
        customerName: sub.customerName || sub.customerEmail,
        customerEmail: sub.customerEmail,
        session: sessionName(sub.igniteSessionId)
      })),
      endingSoon: ending.map(sub => ({
        id: sub.id,
        customerName: sub.customerName || sub.customerEmail,
        customerEmail: sub.customerEmail,
        session: sessionName(sub.igniteSessionId),
        cancelAt: sub.cancelAt!.toISOString()
      })),
      parties: parties.map(party => ({
        id: party.id,
        startsAt: party.startDate.toISOString().slice(0, 16),
        studentId: party.studentId,
        studentName: party.student.name,
        productName: party.product.name,
        venue: party.location.name
      })),
      missingDetails
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

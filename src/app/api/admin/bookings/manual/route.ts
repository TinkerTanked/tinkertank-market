import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { LOCATION_AVAILABILITY } from '@/data/locationAvailability'
import { BookingActionError } from '@/lib/campBookingActions'
import { igniteDaysLabel } from '@/lib/ignite'
import { createManualBooking, PARTY_START_TIMES, planManualBooking, type ManualBookingInput } from '@/lib/adminManualBooking'

/** Choices for the Add booking form. */
export async function GET() {
  const parties = await prisma.product.findMany({
    where: { type: 'BIRTHDAY', isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, price: true }
  })
  return NextResponse.json({
    igniteSessions: IGNITE_SESSIONS.map(session => ({
      id: session.id,
      label: `${session.location} · ${igniteDaysLabel(session)} ${session.startTime}`,
      priceWeekly: session.priceWeekly
    })),
    campLocations: LOCATION_AVAILABILITY.map(location => ({
      id: location.locationId,
      name: location.locationName,
      allDay: location.availableCampTypes.includes('allday')
    })),
    parties: parties.map(party => ({ id: party.id, name: party.name, price: Number(party.price) })),
    partyStartTimes: PARTY_START_TIMES
  })
}

/** Preview (`preview: true`) or create a booking made outside the normal checkout. Super admin only (middleware). */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ManualBookingInput & { preview?: boolean }
  try {
    if (body.preview) {
      const studentId = body.student && 'id' in body.student ? body.student.id : null
      const plan = await planManualBooking(prisma, body.booking, studentId)
      return NextResponse.json({ summary: plan.summary, count: plan.items.length, suggestedAmount: plan.suggestedAmount })
    }
    const result = await createManualBooking(prisma, body)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof BookingActionError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Manual booking failed:', error)
    return NextResponse.json({ error: 'Failed to add the booking' }, { status: 500 })
  }
}

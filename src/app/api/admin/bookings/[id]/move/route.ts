import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminRoleFromAuthorization } from '@/lib/adminAuth'
import { BookingActionError, formatCampDate, moveCampBooking } from '@/lib/campBookingActions'
import { sendCampMoveEmail } from '@/lib/email'

/** Super admin: move a camp day to another date and/or location, then tell the parent. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (adminRoleFromAuthorization(request.headers.get('authorization')) !== 'super') {
    return NextResponse.json({ error: 'Only a super admin can move bookings.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  try {
    const moved = await moveCampBooking(prisma, id, { dateKey: String(body.date || ''), locationId: String(body.locationId || '') })

    const email = moved.customer
      ? await sendCampMoveEmail(moved.customer.email, {
          customerName: moved.customer.name,
          studentName: moved.booking.student.name,
          productName: moved.booking.product.name,
          from: { date: formatCampDate(moved.from.dateKey), locationName: moved.from.locationName },
          to: { date: formatCampDate(moved.to.dateKey), locationName: moved.to.locationName, address: moved.to.address },
        })
      : { success: false }

    return NextResponse.json({
      booking: { id: moved.booking.id, date: moved.to.dateKey, locationName: moved.to.locationName },
      emailSent: email.success,
    })
  } catch (error) {
    if (error instanceof BookingActionError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Error moving booking:', error)
    return NextResponse.json({ error: 'Failed to move booking' }, { status: 500 })
  }
}

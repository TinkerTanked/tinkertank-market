import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { formatInTimeZone } from 'date-fns-tz'
import { prisma } from '@/lib/prisma'
import { adminRoleFromAuthorization } from '@/lib/adminAuth'
import { BookingActionError, formatCampDate, issueCampCredit } from '@/lib/campBookingActions'
import { sendCampCreditEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

/** Super admin: cancel a camp day and email the parent a one-year credit code. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (adminRoleFromAuthorization(request.headers.get('authorization')) !== 'super') {
    return NextResponse.json({ error: 'Only a super admin can cancel bookings.' }, { status: 403 })
  }

  const { id } = await params

  try {
    const result = await issueCampCredit(prisma, stripe, id)
    const amount = Number(result.credit.amount)
    const email = await sendCampCreditEmail(result.credit.customerEmail, {
      customerName: result.credit.customerName || 'there',
      studentName: result.studentName,
      productName: result.productName,
      date: formatCampDate(result.dateKey),
      locationName: result.locationName,
      code: result.credit.code,
      amount,
      expiresAt: formatInTimeZone(result.credit.expiresAt, 'Australia/Sydney', 'd MMMM yyyy'),
    })

    return NextResponse.json({
      credit: { code: result.credit.code, amount, expiresAt: result.credit.expiresAt, customerEmail: result.credit.customerEmail },
      emailSent: email.success,
    })
  } catch (error) {
    if (error instanceof BookingActionError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Error issuing camp credit:', error)
    return NextResponse.json({ error: 'Failed to cancel and credit this booking' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { birthdaySlotStart } from '@/lib/birthdayAvailability'

export async function GET(request: NextRequest) {
  const date = new URL(request.url).searchParams.get('date')
  const dayStart = date ? birthdaySlotStart(date, '00:00') : null

  if (!dayStart) {
    return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 })
  }

  try {
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const bookings = await prisma.booking.findMany({
      where: {
        startDate: { gte: dayStart, lt: dayEnd },
        status: { in: ['CONFIRMED', 'PENDING'] },
        product: { type: 'BIRTHDAY' }
      },
      select: { startDate: true }
    })

    const unavailableStartTimes = [...new Set(bookings.map(booking => {
      const hours = String(booking.startDate.getUTCHours()).padStart(2, '0')
      const minutes = String(booking.startDate.getUTCMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    }))]

    return NextResponse.json(
      { date, unavailableStartTimes },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Birthday availability error:', error)
    return NextResponse.json({ error: 'Unable to check birthday availability.' }, { status: 500 })
  }
}

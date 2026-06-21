import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface AttendanceBody {
  bookingId?: string
  action?: 'checkin' | 'checkout'
  mentorName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AttendanceBody = await request.json()
    const { bookingId, action } = body
    const mentorName = body.mentorName?.trim()

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
    }
    if (action !== 'checkin' && action !== 'checkout') {
      return NextResponse.json({ error: "action must be 'checkin' or 'checkout'" }, { status: 400 })
    }
    if (!mentorName) {
      return NextResponse.json({ error: 'mentorName is required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { attendance: true }
    })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const now = new Date()

    if (action === 'checkin') {
      if (booking.attendance) {
        return NextResponse.json({ error: 'Student is already checked in' }, { status: 409 })
      }
      const record = await prisma.attendanceRecord.create({
        data: {
          studentId: booking.studentId,
          bookingId: booking.id,
          checkInAt: now,
          checkInBy: mentorName
        }
      })
      return NextResponse.json({ attendance: record })
    }

    // checkout
    if (!booking.attendance) {
      return NextResponse.json({ error: 'Student has not been checked in' }, { status: 409 })
    }
    if (booking.attendance.checkOutAt) {
      return NextResponse.json({ error: 'Student is already checked out' }, { status: 409 })
    }
    const record = await prisma.attendanceRecord.update({
      where: { id: booking.attendance.id },
      data: { checkOutAt: now, checkOutBy: mentorName }
    })
    return NextResponse.json({ attendance: record })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
  }
}

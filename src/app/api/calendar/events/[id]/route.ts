import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { prismaBookingToCalendarEvent } from '@/lib/calendar-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        product: true,
        student: true,
        location: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    const calendarEvent = prismaBookingToCalendarEvent(booking)

    return NextResponse.json({
      success: true,
      event: calendarEvent,
      booking,
    })
  } catch (error) {
    console.error('Error fetching calendar event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        startDate: data.startDateTime ? new Date(data.startDateTime) : undefined,
        endDate: data.endDateTime ? new Date(data.endDateTime) : undefined,
        status: data.status,
        totalPrice: data.totalAmount,
        notes: data.specialRequests || data.notes,
      },
      include: {
        product: true,
        student: true,
        location: true,
      },
    })

    const calendarEvent = prismaBookingToCalendarEvent(booking)

    return NextResponse.json({
      success: true,
      event: calendarEvent,
      booking,
    })
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.booking.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}

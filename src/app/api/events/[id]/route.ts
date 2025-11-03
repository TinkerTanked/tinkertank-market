import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

const UpdateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDateTime: z.string().transform(str => new Date(str)).optional(),
  endDateTime: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  maxCapacity: z.number().min(1).max(50).optional(),
  instructorNotes: z.string().optional()
}).refine(data => {
  if (data.startDateTime && data.endDateTime) {
    return data.endDateTime > data.startDateTime
  }
  return true
}, {
  message: 'End time must be after start time',
  path: ['endDateTime']
})

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        location: true,
        bookings: {
          include: {
            student: true,
            product: true
          }
        },
        recurringTemplate: true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)

  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateEventSchema.parse(body)

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Prevent updating past events (except status changes)
    const now = new Date()
    if (existingEvent.startDateTime < now && validatedData.startDateTime) {
      return NextResponse.json(
        { error: 'Cannot modify start time of past events' },
        { status: 400 }
      )
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: validatedData,
      include: {
        location: true,
        bookings: {
          include: {
            student: true,
            product: true
          }
        },
        recurringTemplate: true
      }
    })

    return NextResponse.json(updatedEvent)

  } catch (error) {
    console.error('Error updating event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      include: { bookings: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if event can be cancelled (not completed or in progress)
    if (event.status === 'COMPLETED' || event.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Cannot delete completed or in-progress events' },
        { status: 400 }
      )
    }

    // For events with bookings, change status to cancelled instead of deleting
    if (event.bookings.length > 0) {
      const cancelledEvent = await prisma.event.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          currentCount: 0
        },
        include: {
          location: true,
          bookings: {
            include: {
              student: true,
              product: true
            }
          }
        }
      })

      // Also cancel associated bookings
      await prisma.booking.updateMany({
        where: { eventId: id },
        data: { status: 'CANCELLED' }
      })

      return NextResponse.json({
        message: 'Event cancelled successfully',
        event: cancelledEvent
      })
    } else {
      // If no bookings, can safely delete
      await prisma.event.delete({
        where: { id }
      })

      return NextResponse.json({
        message: 'Event deleted successfully'
      })
    }

  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}

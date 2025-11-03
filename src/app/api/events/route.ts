import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { eventService } from '@/lib/events'
import { z } from 'zod'

// Validation schemas
const CreateEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['CAMP', 'BIRTHDAY', 'SUBSCRIPTION', 'RECURRING_SESSION']),
  startDateTime: z.string().transform(str => new Date(str)),
  endDateTime: z.string().transform(str => new Date(str)),
  locationId: z.string().min(1),
  maxCapacity: z.number().min(1).max(50).default(10),
  ageMin: z.number().min(3).max(18).optional(),
  ageMax: z.number().min(3).max(18).optional(),
  isRecurring: z.boolean().default(false),
  recurringTemplateId: z.string().optional(),
  instructorNotes: z.string().optional()
}).refine(data => data.endDateTime > data.startDateTime, {
  message: 'End time must be after start time',
  path: ['endDateTime']
})

const GetEventsQuerySchema = z.object({
  start: z.string().optional().transform(str => str ? new Date(str) : undefined),
  end: z.string().optional().transform(str => str ? new Date(str) : undefined),
  type: z.enum(['CAMP', 'BIRTHDAY', 'SUBSCRIPTION', 'RECURRING_SESSION']).optional(),
  locationId: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  includeBookings: z.boolean().default(false)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = GetEventsQuerySchema.parse({
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      type: searchParams.get('type'),
      locationId: searchParams.get('locationId'),
      status: searchParams.get('status'),
      includeBookings: searchParams.get('includeBookings') === 'true'
    })

    const whereClause: any = {}
    
    if (query.start || query.end) {
      whereClause.startDateTime = {}
      if (query.start) whereClause.startDateTime.gte = query.start
      if (query.end) whereClause.startDateTime.lte = query.end
    }
    
    if (query.type) whereClause.type = query.type
    if (query.locationId) whereClause.locationId = query.locationId
    if (query.status) whereClause.status = query.status

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        location: true,
        bookings: query.includeBookings ? {
          include: {
            student: true,
            product: true
          }
        } : false,
        recurringTemplate: true
      },
      orderBy: { startDateTime: 'asc' }
    })

    return NextResponse.json(events)

  } catch (error) {
    console.error('Error fetching events:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateEventSchema.parse(body)

    const event = await eventService.createEvent(validatedData)

    return NextResponse.json(event, { status: 201 })

  } catch (error) {
    console.error('Error creating event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

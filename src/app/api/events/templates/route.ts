import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { eventService } from '@/lib/events'
import { z } from 'zod'

const CreateRecurringTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['CAMP', 'BIRTHDAY', 'SUBSCRIPTION', 'RECURRING_SESSION']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, 'At least one day must be selected'),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)).optional(),
  maxCapacity: z.number().min(1).max(50).default(10),
  locationId: z.string().min(1),
  ageMin: z.number().min(3).max(18).optional(),
  ageMax: z.number().min(3).max(18).optional()
}).refine(data => {
  const [startHours, startMinutes] = data.startTime.split(':').map(Number)
  const [endHours, endMinutes] = data.endTime.split(':').map(Number)
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  return endTotalMinutes > startTotalMinutes
}, {
  message: 'End time must be after start time',
  path: ['endTime']
}).refine(data => {
  return !data.endDate || data.endDate > data.startDate
}, {
  message: 'End date must be after start date',
  path: ['endDate']
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active') === 'true'
    const type = searchParams.get('type')
    const locationId = searchParams.get('locationId')

    const whereClause: any = {}
    if (isActive !== undefined) whereClause.isActive = isActive
    if (type) whereClause.type = type
    if (locationId) whereClause.locationId = locationId

    const templates = await prisma.recurringTemplate.findMany({
      where: whereClause,
      include: {
        location: true,
        events: {
          take: 5,
          orderBy: { startDateTime: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(templates)

  } catch (error) {
    console.error('Error fetching recurring templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateRecurringTemplateSchema.parse(body)

    const template = await eventService.createRecurringTemplate(validatedData)

    // Generate initial events if requested
    const generateEvents = request.url.includes('generateEvents=true')
    let events: any[] = []
    
    if (generateEvents) {
      events = await eventService.generateRecurringEvents(template.id)
    }

    return NextResponse.json({
      template,
      eventsGenerated: events.length,
      events: generateEvents ? events : undefined
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating recurring template:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid template data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create recurring template' },
      { status: 500 }
    )
  }
}

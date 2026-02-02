import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { getSubscriptionStartTerm, getTermDatesForDayOfWeek, DAY_NAME_TO_NUMBER } from '@/config/schoolTerms'

/**
 * Admin endpoint to manually create Ignite events for a subscription
 * POST /api/admin/create-ignite-events
 * Body: { sessionId: string, customerName: string, customerEmail: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, customerName, customerEmail } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Find the Ignite session config
    const igniteSession = IGNITE_SESSIONS.find(s => s.id === sessionId)
    
    if (!igniteSession) {
      return NextResponse.json({ error: 'Ignite session not found' }, { status: 404 })
    }

    // Get the term to schedule for
    const term = getSubscriptionStartTerm(new Date())
    
    if (!term) {
      return NextResponse.json({ error: 'No school term found' }, { status: 400 })
    }

    console.log(`Creating Ignite events for ${igniteSession.name} in ${term.name}`)

    const result = await prisma.$transaction(async (tx) => {
      // Find location
      let location = await tx.location.findFirst({
        where: { 
          name: { contains: igniteSession.location },
          isActive: true 
        },
      })

      if (!location) {
        location = await tx.location.findFirst({
          where: { isActive: true },
        })
      }

      if (!location) {
        throw new Error('No active location found')
      }

      // Check if recurring template already exists
      const existingTemplate = await tx.recurringTemplate.findFirst({
        where: {
          name: { contains: igniteSession.id },
          isActive: true,
        },
      })

      let recurringTemplate = existingTemplate

      if (!recurringTemplate) {
        // Create a recurring template
        recurringTemplate = await tx.recurringTemplate.create({
          data: {
            name: `${igniteSession.name} - ${customerName || 'Subscriber'}`,
            description: `Ignite subscription for ${customerEmail || 'subscriber'}`,
            type: 'RECURRING_SESSION',
            startTime: igniteSession.startTime,
            endTime: igniteSession.endTime,
            duration: calculateDurationMinutes(igniteSession.startTime, igniteSession.endTime),
            daysOfWeek: igniteSession.dayOfWeek.map(d => DAY_NAME_TO_NUMBER[d.toLowerCase()]),
            startDate: term.startDate,
            endDate: term.endDate,
            maxCapacity: 20,
            locationId: location.id,
            isActive: true,
          },
        })
      }

      // Create events for each day of week in the term
      const eventsToCreate = []
      
      for (const dayName of igniteSession.dayOfWeek) {
        const dayNumber = DAY_NAME_TO_NUMBER[dayName.toLowerCase()]
        const dates = getTermDatesForDayOfWeek(term, dayNumber)
        
        for (const date of dates) {
          const [startHour, startMin] = igniteSession.startTime.split(':').map(Number)
          const [endHour, endMin] = igniteSession.endTime.split(':').map(Number)
          
          const startDateTime = new Date(date)
          startDateTime.setHours(startHour, startMin, 0, 0)
          
          const endDateTime = new Date(date)
          endDateTime.setHours(endHour, endMin, 0, 0)
          
          // Check if event already exists
          const existing = await tx.event.findFirst({
            where: {
              recurringTemplateId: recurringTemplate.id,
              startDateTime,
            },
          })

          if (!existing) {
            eventsToCreate.push({
              title: `Ignite - ${igniteSession.location}`,
              description: `${igniteSession.name}`,
              type: 'RECURRING_SESSION' as const,
              status: 'SCHEDULED' as const,
              startDateTime,
              endDateTime,
              isRecurring: true,
              maxCapacity: 20,
              currentCount: 1,
              locationId: location.id,
              recurringTemplateId: recurringTemplate.id,
            })
          }
        }
      }

      // Create all events
      let createdCount = 0
      if (eventsToCreate.length > 0) {
        const result = await tx.event.createMany({
          data: eventsToCreate,
        })
        createdCount = result.count
      }

      return {
        templateId: recurringTemplate.id,
        eventsCreated: createdCount,
        term: term.name,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Created ${result.eventsCreated} events for ${term.name}`,
      ...result,
    })
  } catch (error) {
    console.error('Error creating Ignite events:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create events' },
      { status: 500 }
    )
  }
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}

// GET endpoint to list available sessions
export async function GET() {
  return NextResponse.json({
    sessions: IGNITE_SESSIONS.map(s => ({
      id: s.id,
      name: s.name,
      location: s.location,
      dayOfWeek: s.dayOfWeek,
      time: `${s.startTime} - ${s.endTime}`,
    })),
  })
}

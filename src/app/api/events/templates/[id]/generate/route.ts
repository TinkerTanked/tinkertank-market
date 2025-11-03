import { NextRequest, NextResponse } from 'next/server'
import { eventService } from '@/lib/events'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const events = await eventService.generateRecurringEvents(id)

    return NextResponse.json({
      message: `Generated ${events.length} events from template`,
      eventsCreated: events.length,
      events
    })

  } catch (error) {
    console.error('Error generating events from template:', error)
    return NextResponse.json(
      { error: 'Failed to generate events from template' },
      { status: 500 }
    )
  }
}

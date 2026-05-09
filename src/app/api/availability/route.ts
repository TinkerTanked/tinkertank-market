import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLocationAvailabilityById } from '@/data/locationAvailability'

/**
 * GET /api/availability?locationId=manly-library
 *
 * Returns per-date booking counts for a configured camp location, along with
 * the configured daily capacity. Used by the booking modal to mark sold-out
 * dates so they can no longer be selected.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'locationId is required' },
        { status: 400 }
      )
    }

    const availability = getLocationAvailabilityById(locationId)
    if (!availability) {
      return NextResponse.json(
        { success: false, error: 'Unknown location' },
        { status: 404 }
      )
    }

    const dailyCapacity = availability.dailyCapacity ?? null

    // Look up the matching DB location row by name
    const dbLocation = await prisma.location.findFirst({
      where: { name: availability.locationName }
    })

    // Build a per-date booking count map for camp bookings at this location
    const counts: Record<string, number> = {}

    if (dbLocation) {
      // Constrain query to the configured availability window when present,
      // otherwise look 6 months forward (covers the 3-month booking lookahead
      // plus a safety buffer).
      const dateFilter = availability.availableDates && availability.availableDates.length > 0
        ? {
            gte: new Date(`${availability.availableDates[0]}T00:00:00.000Z`),
            lte: new Date(`${availability.availableDates[availability.availableDates.length - 1]}T23:59:59.999Z`)
          }
        : (() => {
            const start = new Date()
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(start)
            end.setUTCMonth(end.getUTCMonth() + 6)
            return { gte: start, lte: end }
          })()

      const bookings = await prisma.booking.findMany({
        where: {
          locationId: dbLocation.id,
          startDate: dateFilter,
          status: { in: ['CONFIRMED', 'PENDING'] },
          product: { type: 'CAMP' }
        },
        select: { startDate: true }
      })

      for (const b of bookings) {
        const d = b.startDate
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
        counts[key] = (counts[key] || 0) + 1
      }
    }

    // Build the response: include every configured availableDate (so the
    // frontend can render zero-booking days too) and every other date in the
    // window that has any bookings (so locations without a fixed window — like
    // Neutral Bay — can still report sold-out days).
    const datesMap = new Map<string, { date: string; bookings: number; capacity: number | null; soldOut: boolean }>()

    const upsertDate = (date: string) => {
      if (datesMap.has(date)) return
      const bookings = counts[date] ?? 0
      datesMap.set(date, {
        date,
        bookings,
        capacity: dailyCapacity,
        soldOut: dailyCapacity != null && bookings >= dailyCapacity
      })
    }

    for (const date of availability.availableDates ?? []) {
      upsertDate(date)
    }
    for (const date of Object.keys(counts)) {
      upsertDate(date)
    }

    const dates = Array.from(datesMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      locationId,
      locationName: availability.locationName,
      dailyCapacity,
      dates
    })
  } catch (error) {
    console.error('Error fetching location availability:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

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
      // otherwise count everything in the future.
      const dateFilter = availability.availableDates && availability.availableDates.length > 0
        ? {
            gte: new Date(`${availability.availableDates[0]}T00:00:00.000Z`),
            lte: new Date(`${availability.availableDates[availability.availableDates.length - 1]}T23:59:59.999Z`)
          }
        : { gte: new Date() }

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

    const dates = (availability.availableDates ?? []).map(date => ({
      date,
      bookings: counts[date] ?? 0,
      capacity: dailyCapacity,
      soldOut: dailyCapacity != null && (counts[date] ?? 0) >= dailyCapacity
    }))

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

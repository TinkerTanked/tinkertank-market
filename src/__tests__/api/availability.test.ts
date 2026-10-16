import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Production has an inactive, empty "TinkerTank Neutral Bay" row and the real
// bookings on the active legacy "Neutral Bay" row.
const LOCATIONS = [
  { id: 'inactive-empty', name: 'TinkerTank Neutral Bay', capacity: 35, isActive: false },
  { id: 'active-legacy', name: 'Neutral Bay', capacity: 35, isActive: true },
]

vi.mock('@/lib/prisma', () => ({
  prisma: {
    location: {
      findFirst: vi.fn(({ where }: { where: { name: string | { in: string[] }; isActive?: boolean } }) => {
        const names = typeof where.name === 'string' ? [where.name] : where.name.in
        return Promise.resolve(
          LOCATIONS.find(
            location => names.includes(location.name) && (where.isActive === undefined || location.isActive === where.isActive)
          ) ?? null
        )
      }),
    },
    booking: {
      findMany: vi.fn(({ where }: { where: { locationId: string } }) =>
        Promise.resolve(
          where.locationId === 'active-legacy'
            ? Array.from({ length: 35 }, () => ({ startDate: new Date('2026-12-01T09:00:00.000Z') }))
            : []
        )
      ),
    },
  },
}))

import { GET } from '@/app/api/availability/route'

describe('GET /api/availability', () => {
  it('reports Neutral Bay sold out using the same location checkout counts against', async () => {
    const response = await GET(new NextRequest('https://tinkertank.rocks/api/availability?locationId=neutral-bay'))
    const body = await response.json()

    expect(body.dates).toContainEqual({ date: '2026-12-01', bookings: 35, capacity: 35, soldOut: true })
  })
})

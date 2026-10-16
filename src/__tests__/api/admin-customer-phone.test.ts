import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => {
  const prisma = {
    order: {
      findMany: vi.fn().mockResolvedValue([
        { customerName: 'Mia Chen', customerPhone: '0414 745 518', orderItems: [{ studentId: 'blank' }, { studentId: 'old' }] }
      ]),
      updateMany: vi.fn(args => args)
    },
    igniteSubscription: {
      findMany: vi.fn().mockResolvedValue([{ customerName: 'Mia Chen', students: [{ student: { id: 'grandma', name: 'Leo Chen' } }] }])
    },
    campCredit: { findMany: vi.fn().mockResolvedValue([]) },
    student: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'blank', emergencyContactName: null, emergencyContactPhone: null },
        // Same number as the family's order, written differently.
        { id: 'old', emergencyContactName: 'Tom Chen', emergencyContactPhone: '0414745518' },
        { id: 'grandma', emergencyContactName: 'Grandma', emergencyContactPhone: '0499 111 222' }
      ]),
      update: vi.fn(args => args)
    },
    $transaction: vi.fn().mockResolvedValue([])
  }
  return { prisma }
})

vi.mock('@/lib/prisma', () => ({ prisma }))

import { PATCH } from '@/app/api/admin/customers/[email]/route'

const patch = (phone: string) =>
  PATCH(
    new NextRequest('https://tinkertank.rocks/api/admin/customers/mia%40example.com', { method: 'PATCH', body: JSON.stringify({ phone }) }),
    { params: Promise.resolve({ email: 'mia%40example.com' }) }
  )

describe('PATCH /api/admin/customers/[email]', () => {
  it("sets the family phone on orders and on children without a different emergency contact", async () => {
    const response = await patch('0455 123 456')

    expect(response.status).toBe(200)
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { customerEmail: { equals: 'mia@example.com', mode: 'insensitive' }, status: 'PAID' },
      data: { customerPhone: '0455 123 456' }
    })
    const updated = prisma.student.update.mock.calls.map(([args]) => args)
    expect(updated).toEqual([
      { where: { id: 'blank' }, data: { emergencyContactPhone: '0455 123 456', emergencyContactName: 'Mia Chen' } },
      { where: { id: 'old' }, data: { emergencyContactPhone: '0455 123 456', emergencyContactName: undefined } }
    ])
  })

  it('rejects something that is not a phone number', async () => {
    const response = await patch('call me')
    expect(response.status).toBe(400)
  })
})

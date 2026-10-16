import { describe, expect, it } from 'vitest'
import { nextTermResumeDate, stripeUpdateFor } from '@/lib/igniteSubscriptionActions'
import { buildAdminCustomers } from '@/lib/adminCustomers'

const WEEK = 7 * 24 * 60 * 60

describe('Ignite subscription billing actions', () => {
  // Paid through Sunday 18 Oct 2026, 11:59:59 PM AEDT
  const subscription = { current_period_end: Math.floor(new Date('2026-10-18T13:00:00.000Z').getTime() / 1000) }

  it('cancels after the current and next week are billed', () => {
    const update = stripeUpdateFor({ action: 'cancel' }, subscription)

    expect(update).toEqual({ cancel_at: subscription.current_period_end + WEEK })
    expect(new Date((update.cancel_at as number) * 1000).toISOString()).toBe('2026-10-25T13:00:00.000Z')
    expect(update).not.toHaveProperty('cancel_at_period_end')
  })

  it('pauses without creating invoices until the resume date', () => {
    const resumesAt = new Date('2027-02-02T13:00:00.000Z')

    expect(stripeUpdateFor({ action: 'pause', resumesAt }, subscription)).toEqual({
      pause_collection: { behavior: 'void', resumes_at: Math.floor(resumesAt.getTime() / 1000) }
    })
  })

  it('defaults a holiday pause to midnight Sydney on the first day of next term', () => {
    // Summer holidays: next term starts Wednesday 3 Feb 2027 (AEDT, UTC+11)
    expect(nextTermResumeDate(new Date('2026-12-20T00:00:00.000Z'))?.toISOString()).toBe('2027-02-02T13:00:00.000Z')
  })
})

describe('Admin customers', () => {
  it('merges orders and subscriptions by email and omits customers without children', () => {
    const customers = buildAdminCustomers(
      [
        {
          customerEmail: 'Parent@Example.com',
          customerName: 'Old Name',
          customerPhone: '0400 000 000',
          totalAmount: 119.99,
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
          students: [{ id: 's1', name: 'Ada' }]
        },
        {
          customerEmail: 'parent@example.com',
          customerName: 'Pat Parent',
          customerPhone: null,
          totalAmount: 149.99,
          createdAt: new Date('2026-09-01T00:00:00.000Z'),
          students: [{ id: 's1', name: 'Ada' }]
        },
        {
          customerEmail: 'nochildren@example.com',
          customerName: 'No Children',
          customerPhone: null,
          totalAmount: 10,
          createdAt: new Date('2026-09-01T00:00:00.000Z'),
          students: []
        }
      ],
      [
        {
          id: 'sub1',
          customerEmail: 'PARENT@example.com ',
          customerName: null,
          status: 'ACTIVE',
          sessionName: 'Ignite Balgowlah',
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
          students: [{ id: 's2', name: 'Ben' }]
        }
      ]
    )

    expect(customers).toHaveLength(1)
    expect(customers[0]).toMatchObject({
      email: 'parent@example.com',
      name: 'Pat Parent',
      phone: '0400 000 000',
      orderCount: 2,
      totalSpent: 269.98,
      activeSubscriptions: 1,
      lastActivityAt: '2026-09-01T00:00:00.000Z',
      students: [{ id: 's1', name: 'Ada' }, { id: 's2', name: 'Ben' }]
    })
  })
})

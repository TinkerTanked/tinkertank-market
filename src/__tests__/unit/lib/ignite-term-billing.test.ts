import { describe, expect, it } from 'vitest'
import { getIgniteCheckoutPlan, getIgniteScheduleFrom } from '@/lib/ignite'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'

const pittwater = IGNITE_SESSIONS.find(session => session.id === 'ignite-pittwater-house')!

describe('Pittwater House Ignite term billing', () => {
  it('schedules exactly the eight approved Term 4 sessions', () => {
    const schedule = getIgniteScheduleFrom(pittwater, new Date('2026-08-26T00:00:00.000Z'))

    expect(schedule?.occurrences.map(occurrence => occurrence.start.toISOString())).toEqual([
      '2026-10-19T04:30:00.000Z',
      '2026-10-26T04:30:00.000Z',
      '2026-11-02T04:30:00.000Z',
      '2026-11-09T04:30:00.000Z',
      '2026-11-16T04:30:00.000Z',
      '2026-11-23T04:30:00.000Z',
      '2026-11-30T04:30:00.000Z',
      '2026-12-07T04:30:00.000Z'
    ])
  })

  it('charges the first session now and starts recurring billing on 26 October', () => {
    const plan = getIgniteCheckoutPlan(pittwater, new Date('2026-08-26T00:00:00.000Z'))

    expect(plan?.kind).toBe('prepaid-subscription')
    expect(plan?.firstOccurrence.start.toISOString()).toBe('2026-10-19T04:30:00.000Z')
    expect(plan?.recurringStartsAt?.toISOString()).toBe('2026-10-25T13:00:00.000Z')
  })

  it('moves late enrolments to the next session and following Monday anchor', () => {
    const plan = getIgniteCheckoutPlan(pittwater, new Date('2026-10-20T00:00:00.000Z'))

    expect(plan?.firstOccurrence.start.toISOString()).toBe('2026-10-26T04:30:00.000Z')
    expect(plan?.recurringStartsAt?.toISOString()).toBe('2026-11-01T13:00:00.000Z')
  })

  it('uses a one-time purchase when only the final session remains', () => {
    const plan = getIgniteCheckoutPlan(pittwater, new Date('2026-11-30T05:00:00.000Z'))

    expect(plan?.kind).toBe('one-time')
    expect(plan?.firstOccurrence.start.toISOString()).toBe('2026-12-07T04:30:00.000Z')
  })

  it('closes enrolment once the final session starts', () => {
    expect(getIgniteCheckoutPlan(pittwater, new Date('2026-12-07T04:30:00.000Z'))).toBeNull()
  })
})

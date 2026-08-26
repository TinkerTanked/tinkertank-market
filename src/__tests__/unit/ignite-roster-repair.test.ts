import { describe, expect, it } from 'vitest'
import { buildIgniteRosterPlan, IgniteRosterReport, IgniteRosterRow, studentImportReference } from '@/lib/ignite-roster-repair'

function row(overrides: Partial<IgniteRosterRow> = {}): IgniteRosterRow {
  return {
    student: 'Example Student',
    parent_email: 'parent@example.com',
    stripe_subscription_id: 'sub_example',
    local_subscription_id: 'local_example',
    local_subscription_status: 'ACTIVE',
    match_status: 'NO_SAFE_MATCH',
    matched_student_id: '',
    date_of_birth: '2018-01-01',
    already_booked: false,
    proposed_action: 'PREVIEW_CREATE_STUDENT_LINK_AND_BOOK',
    product_id: 'ignite-balgowlah-wed',
    product_ready: true,
    location_id: 'location_example',
    location: 'Example Location',
    start_utc: '2026-08-26T02:45:00.000Z',
    end_utc: '2026-08-26T03:45:00.000Z',
    birthdate_estimated: true,
    ...overrides
  }
}

function report(rows: IgniteRosterRow[]): IgniteRosterReport {
  return {
    summary: {
      targetDate: '2026-08-26',
      rosterChildren: rows.length,
      productionWritesPerformed: false
    },
    rows
  }
}

describe('Ignite roster repair planning', () => {
  it('turns ambiguous matches into deterministic canonical student imports', () => {
    const input = row({ proposed_action: 'REVIEW_STUDENT_MATCH', match_status: 'AMBIGUOUS_DUPLICATE_STUDENTS' })
    const [plan] = buildIgniteRosterPlan(report([input]))

    expect(plan.studentStrategy).toBe('canonical')
    expect(plan.importReference).toBe(studentImportReference('2026-08-26', input))
    expect(plan.rosterOverride).toBe(false)
  })

  it('uses approved exact student links without creating a student', () => {
    const [plan] = buildIgniteRosterPlan(report([
      row({ proposed_action: 'PREVIEW_LINK_EXISTING_STUDENT_AND_BOOK', matched_student_id: 'student_approved' })
    ]))

    expect(plan.studentStrategy).toBe('existing')
    expect(plan.importReference).toBeUndefined()
  })

  it('marks non-Stripe attendance as an explicit roster override', () => {
    const [plan] = buildIgniteRosterPlan(report([
      row({
        proposed_action: 'REQUIRES_NON_STRIPE_ENROLLMENT_SUPPORT',
        stripe_subscription_id: '',
        local_subscription_id: ''
      })
    ]))

    expect(plan.rosterOverride).toBe(true)
    expect(plan.importSubscription).toBe(false)
  })

  it('rejects duplicate roster identities before any database work', () => {
    expect(() => buildIgniteRosterPlan(report([row(), row()]))).toThrow('duplicate roster identity')
  })

  it('requires skipped rows to identify a verified existing booking', () => {
    expect(() => buildIgniteRosterPlan(report([
      row({ proposed_action: 'NO_ACTION_ALREADY_SCHEDULED', already_booked: true, matched_student_id: '' })
    ]))).toThrow('matched_student_id is required')
  })

  it('rejects occurrences outside the approved Sydney date', () => {
    expect(() => buildIgniteRosterPlan(report([
      row({ start_utc: '2026-08-27T02:45:00.000Z', end_utc: '2026-08-27T03:45:00.000Z' })
    ]))).toThrow('outside 2026-08-26 in Sydney')
  })
})

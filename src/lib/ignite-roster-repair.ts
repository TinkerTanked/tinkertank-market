import { createHash } from 'node:crypto'
import { formatInTimeZone } from 'date-fns-tz'

const SYDNEY_TZ = 'Australia/Sydney'

export interface IgniteRosterReport {
  summary: {
    targetDate: string
    rosterChildren: number
    productionWritesPerformed: boolean
  }
  rows: IgniteRosterRow[]
}

export interface IgniteRosterRow {
  student: string
  parent_email: string
  stripe_subscription_id: string
  local_subscription_id: string
  local_subscription_status: string
  match_status: string
  matched_student_id: string
  date_of_birth: string
  already_booked: boolean | string
  proposed_action: string
  product_id: string
  product_ready: boolean | string
  location_id: string
  location: string
  start_utc: string
  end_utc: string
  birthdate_estimated: boolean | string
}

export interface IgniteRosterPlanRow extends Omit<IgniteRosterRow, 'already_booked' | 'product_ready' | 'birthdate_estimated'> {
  already_booked: boolean
  product_ready: boolean
  birthdate_estimated: boolean
  rowNumber: number
  studentStrategy: 'skip' | 'existing' | 'canonical'
  importReference?: string
  rosterOverride: boolean
  importSubscription: boolean
}

const SKIP_ACTION = 'NO_ACTION_ALREADY_SCHEDULED'
const EXISTING_STUDENT_ACTIONS = new Set([
  'PREVIEW_LINK_EXISTING_STUDENT_AND_BOOK',
  'PREVIEW_IMPORT_LEGACY_SUBSCRIPTION_LINK_AND_BOOK'
])
const CANONICAL_STUDENT_ACTIONS = new Set([
  'REVIEW_STUDENT_MATCH',
  'PREVIEW_CREATE_STUDENT_LINK_AND_BOOK',
  'REQUIRES_NON_STRIPE_ENROLLMENT_SUPPORT',
  'PREVIEW_CREATE_STUDENT_IMPORT_LEGACY_AND_BOOK'
])
const SUPPORTED_ACTIONS = new Set([SKIP_ACTION, ...EXISTING_STUDENT_ACTIONS, ...CANONICAL_STUDENT_ACTIONS])

function requiredString(value: unknown, field: string, rowNumber: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Row ${rowNumber}: ${field} is required`)
  }
  return value.trim()
}

function requiredBoolean(value: unknown, field: string, rowNumber: number): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string' && value.toLowerCase() === 'true') return true
  if (typeof value === 'string' && value.toLowerCase() === 'false') return false
  throw new Error(`Row ${rowNumber}: ${field} must be true or false`)
}

export function studentImportReference(targetDate: string, row: Pick<IgniteRosterRow, 'student' | 'parent_email' | 'product_id'>): string {
  const identity = [targetDate, row.product_id, row.student.trim().toLocaleLowerCase('en-AU'), row.parent_email.trim().toLocaleLowerCase('en-AU')].join('|')
  return `ignite-roster:${targetDate}:${createHash('sha256').update(identity).digest('hex').slice(0, 24)}`
}

export function buildIgniteRosterPlan(report: IgniteRosterReport): IgniteRosterPlanRow[] {
  if (!report || typeof report !== 'object' || !report.summary || !Array.isArray(report.rows)) {
    throw new Error('Input must be an Ignite roster preview report')
  }
  const targetDate = requiredString(report.summary.targetDate, 'summary.targetDate', 0)
  if (report.summary.productionWritesPerformed !== false) {
    throw new Error('Refusing a report that is not marked as read-only')
  }
  if (report.summary.rosterChildren !== report.rows.length) {
    throw new Error(`Roster count mismatch: expected ${report.summary.rosterChildren}, found ${report.rows.length}`)
  }

  const seenReferences = new Set<string>()
  return report.rows.map((row, index) => {
    const rowNumber = index + 1
    const action = requiredString(row.proposed_action, 'proposed_action', rowNumber)
    if (!SUPPORTED_ACTIONS.has(action)) throw new Error(`Row ${rowNumber}: unsupported action ${action}`)

    requiredString(row.student, 'student', rowNumber)
    requiredString(row.product_id, 'product_id', rowNumber)
    requiredString(row.location_id, 'location_id', rowNumber)
    requiredString(row.date_of_birth, 'date_of_birth', rowNumber)
    const productReady = requiredBoolean(row.product_ready, 'product_ready', rowNumber)
    const alreadyBooked = requiredBoolean(row.already_booked, 'already_booked', rowNumber)
    const birthdateEstimated = requiredBoolean(row.birthdate_estimated, 'birthdate_estimated', rowNumber)
    if (!productReady) throw new Error(`Row ${rowNumber}: product is not ready`)

    const start = new Date(requiredString(row.start_utc, 'start_utc', rowNumber))
    const end = new Date(requiredString(row.end_utc, 'end_utc', rowNumber))
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new Error(`Row ${rowNumber}: invalid occurrence times`)
    }
    if (formatInTimeZone(start, SYDNEY_TZ, 'yyyy-MM-dd') !== targetDate) {
      throw new Error(`Row ${rowNumber}: occurrence is outside ${targetDate} in Sydney`)
    }

    let studentStrategy: IgniteRosterPlanRow['studentStrategy'] = 'canonical'
    if (action === SKIP_ACTION) {
      requiredString(row.matched_student_id, 'matched_student_id', rowNumber)
      if (!alreadyBooked) throw new Error(`Row ${rowNumber}: skip action is not marked already booked`)
      studentStrategy = 'skip'
    } else if (alreadyBooked) {
      throw new Error(`Row ${rowNumber}: repair action is unexpectedly marked already booked`)
    }
    if (EXISTING_STUDENT_ACTIONS.has(action)) {
      requiredString(row.matched_student_id, 'matched_student_id', rowNumber)
      studentStrategy = 'existing'
    }

    const rosterOverride = action === 'REQUIRES_NON_STRIPE_ENROLLMENT_SUPPORT'
    if (!rosterOverride && studentStrategy !== 'skip') {
      requiredString(row.stripe_subscription_id, 'stripe_subscription_id', rowNumber)
    }

    const importReference = studentStrategy === 'canonical' ? studentImportReference(targetDate, row) : undefined
    if (importReference) {
      if (seenReferences.has(importReference)) throw new Error(`Row ${rowNumber}: duplicate roster identity`)
      seenReferences.add(importReference)
    }

    return {
      ...row,
      product_ready: productReady,
      already_booked: alreadyBooked,
      birthdate_estimated: birthdateEstimated,
      rowNumber,
      studentStrategy,
      importReference,
      rosterOverride,
      importSubscription: !rosterOverride && studentStrategy !== 'skip' && !row.local_subscription_id
    }
  })
}

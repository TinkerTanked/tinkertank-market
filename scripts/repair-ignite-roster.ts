/**
 * Safely applies an approved Ignite roster preview to the database.
 *
 * Dry-run (default):
 *   node repair-ignite-roster.js --input /tmp/wednesday-preview.json
 *
 * Apply (requires an explicit target-date confirmation):
 *   node repair-ignite-roster.js --input /tmp/wednesday-preview.json --apply --confirm-target 2026-08-26
 *
 * The input contains personal information and must be readable only by its owner.
 */
import { readFileSync, statSync } from 'node:fs'
import { Prisma, PrismaClient, IgniteSubscriptionStatus } from '@prisma/client'
import Stripe from 'stripe'
import { buildIgniteRosterPlan, IgniteRosterPlanRow, IgniteRosterReport } from '../src/lib/ignite-roster-repair'

const prisma = new PrismaClient()

interface Arguments {
  input: string
  apply: boolean
  confirmTarget?: string
}

interface StripeImport {
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  customerEmail: string
  customerName?: string
  igniteSessionId: string
  quantity: number
  status: IgniteSubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  weeklyAmount: number
}

const STRIPE_STATUS: Record<string, IgniteSubscriptionStatus> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  paused: 'PAUSED',
  past_due: 'PAST_DUE',
  unpaid: 'PAST_DUE',
  canceled: 'CANCELED',
  incomplete: 'PAST_DUE',
  incomplete_expired: 'CANCELED'
}

function parseArguments(argv: string[]): Arguments {
  const inputIndex = argv.indexOf('--input')
  if (inputIndex === -1 || !argv[inputIndex + 1]) {
    throw new Error('Usage: --input <private-preview.json> [--apply --confirm-target YYYY-MM-DD]')
  }
  const confirmIndex = argv.indexOf('--confirm-target')
  return {
    input: argv[inputIndex + 1],
    apply: argv.includes('--apply'),
    confirmTarget: confirmIndex === -1 ? undefined : argv[confirmIndex + 1]
  }
}

function loadPrivateReport(path: string): IgniteRosterReport {
  const mode = statSync(path).mode & 0o777
  if ((mode & 0o077) !== 0) {
    throw new Error(`Input must not be accessible by group/others (current mode ${mode.toString(8)}; run chmod 600)`)
  }
  return JSON.parse(readFileSync(path, 'utf8')) as IgniteRosterReport
}

async function retrieveStripeImport(stripe: Stripe, stripeSubscriptionId: string, rows: IgniteRosterPlanRow[]): Promise<StripeImport> {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ['customer'] })
  const item = subscription.items.data[0]
  if (!item?.price?.id || item.price.unit_amount == null) throw new Error(`Stripe subscription ${stripeSubscriptionId} has no priced item`)
  const customer = typeof subscription.customer === 'string' ? null : subscription.customer
  if (!customer || customer.deleted) throw new Error(`Stripe subscription ${stripeSubscriptionId} has no active customer record`)

  const sessionIds = new Set(rows.map(row => row.product_id))
  if (sessionIds.size !== 1) throw new Error(`Stripe subscription ${stripeSubscriptionId} maps to multiple Ignite sessions`)
  const quantity = item.quantity || 1
  const status = STRIPE_STATUS[subscription.status]
  if (!status) throw new Error(`Unsupported Stripe subscription status ${subscription.status}`)

  return {
    stripeSubscriptionId,
    stripeCustomerId: customer.id,
    stripePriceId: item.price.id,
    customerEmail: customer.email || rows[0].parent_email,
    customerName: customer.name || undefined,
    igniteSessionId: rows[0].product_id,
    quantity,
    status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    weeklyAmount: (item.price.unit_amount / 100) * quantity
  }
}

async function preflight(plan: IgniteRosterPlanRow[]): Promise<Map<string, StripeImport>> {
  const activeRows = plan.filter(row => row.studentStrategy !== 'skip')
  const productIds = [...new Set(activeRows.map(row => row.product_id))]
  const locationIds = [...new Set(activeRows.map(row => row.location_id))]
  const [products, locations] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds }, type: 'SUBSCRIPTION', isActive: true }, select: { id: true } }),
    prisma.location.findMany({ where: { id: { in: locationIds }, isActive: true }, select: { id: true } })
  ])
  if (products.length !== productIds.length) throw new Error('One or more report products are missing or inactive')
  if (locations.length !== locationIds.length) throw new Error('One or more report locations are missing or inactive')

  const existingStudentIds = [...new Set(plan.filter(row => row.studentStrategy === 'existing' || row.studentStrategy === 'skip').map(row => row.matched_student_id))]
  const existingStudents = await prisma.student.count({ where: { id: { in: existingStudentIds } } })
  if (existingStudents !== existingStudentIds.length) throw new Error('One or more approved existing students no longer exist')

  for (const row of plan.filter(row => row.studentStrategy === 'skip')) {
    const booking = await prisma.booking.findFirst({
      where: {
        studentId: row.matched_student_id,
        productId: row.product_id,
        startDate: new Date(row.start_utc),
        status: { in: ['CONFIRMED', 'PENDING'] }
      },
      select: { id: true }
    })
    if (!booking) throw new Error(`Row ${row.rowNumber}: approved existing booking no longer exists`)
  }

  const importGroups = new Map<string, IgniteRosterPlanRow[]>()
  for (const row of activeRows.filter(row => !row.rosterOverride && !row.local_subscription_id)) {
    const current = importGroups.get(row.stripe_subscription_id) || []
    current.push(row)
    importGroups.set(row.stripe_subscription_id, current)
  }

  const stripeImports = new Map<string, StripeImport>()
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' }) : null
  for (const [stripeSubscriptionId, rows] of importGroups) {
    const existing = await prisma.igniteSubscription.findUnique({ where: { stripeSubscriptionId }, select: { id: true } })
    if (existing) continue
    if (!stripe) throw new Error('STRIPE_SECRET_KEY is required to inspect missing legacy subscriptions')
    stripeImports.set(stripeSubscriptionId, await retrieveStripeImport(stripe, stripeSubscriptionId, rows))
  }

  for (const row of activeRows.filter(row => !row.rosterOverride && row.local_subscription_id)) {
    const subscription = await prisma.igniteSubscription.findUnique({
      where: { id: row.local_subscription_id },
      select: { stripeSubscriptionId: true }
    })
    if (!subscription || subscription.stripeSubscriptionId !== row.stripe_subscription_id) {
      throw new Error(`Row ${row.rowNumber}: local subscription no longer matches the approved Stripe subscription`)
    }
  }

  return stripeImports
}

async function applyPlan(plan: IgniteRosterPlanRow[], stripeImports: Map<string, StripeImport>): Promise<void> {
  await prisma.$transaction(async tx => {
    for (const data of stripeImports.values()) {
      await tx.igniteSubscription.upsert({
        where: { stripeSubscriptionId: data.stripeSubscriptionId },
        create: data,
        update: {}
      })
    }

    for (const row of plan) {
      if (row.studentStrategy === 'skip') continue

      const birthdate = new Date(`${row.date_of_birth.slice(0, 10)}T00:00:00.000Z`)
      const student = row.studentStrategy === 'existing'
        ? await tx.student.findUniqueOrThrow({ where: { id: row.matched_student_id } })
        : await tx.student.upsert({
            where: { importReference: row.importReference! },
            create: {
              name: row.student.trim(),
              birthdate,
              birthdateEstimated: row.birthdate_estimated,
              importReference: row.importReference
            },
            update: {}
          })

      let subscriptionId: string | null = null
      if (!row.rosterOverride) {
        const subscription = row.local_subscription_id
          ? await tx.igniteSubscription.findUniqueOrThrow({ where: { id: row.local_subscription_id } })
          : await tx.igniteSubscription.findUniqueOrThrow({ where: { stripeSubscriptionId: row.stripe_subscription_id } })
        subscriptionId = subscription.id
        await tx.igniteSubscriptionStudent.upsert({
          where: {
            igniteSubscriptionId_studentId: { igniteSubscriptionId: subscription.id, studentId: student.id }
          },
          create: { igniteSubscriptionId: subscription.id, studentId: student.id },
          update: {}
        })
      }

      const bookingData = {
        studentId: student.id,
        productId: row.product_id,
        locationId: row.location_id,
        igniteSubscriptionId: subscriptionId,
        rosterOverride: row.rosterOverride,
        startDate: new Date(row.start_utc),
        endDate: new Date(row.end_utc),
        status: 'CONFIRMED' as const,
        totalPrice: new Prisma.Decimal(0),
        notes: 'Approved Ignite roster repair'
      }

      if (subscriptionId) {
        await tx.booking.upsert({
          where: {
            igniteSubscriptionId_studentId_startDate: {
              igniteSubscriptionId: subscriptionId,
              studentId: student.id,
              startDate: bookingData.startDate
            }
          },
          create: bookingData,
          update: {
            productId: bookingData.productId,
            locationId: bookingData.locationId,
            endDate: bookingData.endDate,
            status: bookingData.status,
            rosterOverride: bookingData.rosterOverride
          }
        })
      } else {
        const existing = await tx.booking.findFirst({
          where: {
            studentId: student.id,
            productId: row.product_id,
            startDate: bookingData.startDate,
            igniteSubscriptionId: null
          }
        })
        if (existing) {
          await tx.booking.update({
            where: { id: existing.id },
            data: { locationId: bookingData.locationId, endDate: bookingData.endDate, status: 'CONFIRMED', rosterOverride: true }
          })
        } else {
          await tx.booking.create({ data: bookingData })
        }
      }
    }
  }, { timeout: 30_000 })
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2))
  const report = loadPrivateReport(args.input)
  const plan = buildIgniteRosterPlan(report)
  const activeRows = plan.filter(row => row.studentStrategy !== 'skip')
  const stripeImports = await preflight(plan)

  console.log(JSON.stringify({
    mode: args.apply ? 'apply' : 'dry-run',
    targetDate: report.summary.targetDate,
    rosterChildren: plan.length,
    alreadyScheduled: plan.length - activeRows.length,
    bookingsToEnsure: activeRows.length,
    canonicalStudentsToEnsure: activeRows.filter(row => row.studentStrategy === 'canonical').length,
    rosterOverridesToEnsure: activeRows.filter(row => row.rosterOverride).length,
    StripeSubscriptionsToImport: stripeImports.size
  }, null, 2))

  if (!args.apply) {
    console.log('Dry-run complete. No database writes performed.')
    return
  }
  if (args.confirmTarget !== report.summary.targetDate) {
    throw new Error(`Apply requires --confirm-target ${report.summary.targetDate}`)
  }

  await applyPlan(plan, stripeImports)
  console.log('Apply complete. Re-run without --apply to verify the idempotent plan.')
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

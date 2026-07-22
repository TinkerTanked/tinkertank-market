/**
 * Read-only Ignite re-enrollment reconciliation report.
 *
 * Cross-references Stripe's Ignite subscriptions with local subscription,
 * student-link, and booking data. It never updates Stripe or the database.
 *
 * Usage:
 *   NEXT_PUBLIC_STRIPE_MODE=production npx tsx scripts/report-ignite-reenrollment.ts
 *   npx tsx scripts/report-ignite-reenrollment.ts --out=/secure/path/ignite-report
 *
 * Produces a detailed CSV for operations and a JSON file containing summary
 * totals plus the same records. Both files contain customer PII and must be
 * stored securely.
 */
import fs from 'fs'
import path from 'path'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

function loadLocalEnvironment(): void {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 1) continue
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function csvValue(value: unknown): string {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function dateValue(unixSeconds: number | null | undefined): string {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : ''
}

function isOpenStatus(status: Stripe.Subscription.Status): boolean {
  return ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'].includes(status)
}

interface ReportRow {
  stripeSubscriptionId: string
  stripeCustomerId: string
  customerName: string
  customerEmail: string
  stripeStatus: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string
  createdAt: string
  workflow: 'LEGACY' | 'NEW'
  igniteSessionId: string
  sessionName: string
  stripePriceId: string
  stripeQuantity: number
  weeklyUnitAmount: number
  weeklyTotalAmount: number
  localRecordPresent: boolean
  localStatus: string
  localQuantity: number | null
  linkedStudentCount: number
  bookingCount: number
  quantityMismatch: boolean
  replacementSubscriptionIds: string
  recommendedAction: string
}

async function main(): Promise<void> {
  loadLocalEnvironment()

  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is required')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

  const stripeMode = process.env.NEXT_PUBLIC_STRIPE_MODE
  const keyMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'production' : 'test'
  if (stripeMode !== keyMode) {
    throw new Error(`Stripe mode mismatch: NEXT_PUBLIC_STRIPE_MODE=${stripeMode || 'unset'}, key=${keyMode}`)
  }

  const { IGNITE_SESSIONS } = await import('../src/config/igniteProducts')
  const sessionsByPrice = new Map(IGNITE_SESSIONS.map(session => [session.stripePriceId, session]))
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  const prisma = new PrismaClient()

  try {
    const localSubscriptions = await prisma.igniteSubscription.findMany({
      include: {
        students: true,
        _count: { select: { bookings: true } }
      }
    })
    const localByStripeId = new Map(localSubscriptions.map(subscription => [subscription.stripeSubscriptionId, subscription]))

    const subscriptions: Stripe.Subscription[] = []
    let startingAfter: string | undefined
    do {
      const page = await stripe.subscriptions.list({
        status: 'all',
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.customer']
      })
      subscriptions.push(...page.data)
      startingAfter = page.has_more ? page.data.at(-1)?.id : undefined
    } while (startingAfter)

    const sourceRows = subscriptions.flatMap(subscription => {
      const priceItem = subscription.items.data.find(item => sessionsByPrice.has(item.price.id))
      if (!priceItem) return []

      const session = sessionsByPrice.get(priceItem.price.id)!
      const customer = typeof subscription.customer === 'string' ? null : subscription.customer
      const customerDeleted = customer?.deleted === true
      const quantity = priceItem.quantity ?? 1
      const unitAmount = (priceItem.price.unit_amount ?? 0) / 100
      const local = localByStripeId.get(subscription.id)

      return [{
        subscription,
        customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
        customerName: !customerDeleted && customer ? customer.name || '' : '',
        customerEmail: !customerDeleted && customer ? customer.email || '' : '',
        normalizedEmail: !customerDeleted && customer ? (customer.email || '').trim().toLowerCase() : '',
        session,
        priceItem,
        quantity,
        unitAmount,
        local,
        workflow: subscription.metadata.orderId && subscription.metadata.igniteSessionId ? 'NEW' as const : 'LEGACY' as const
      }]
    })

    const rows: ReportRow[] = sourceRows.map(source => {
      const replacements = source.workflow === 'LEGACY'
        ? sourceRows.filter(candidate =>
            candidate.workflow === 'NEW' &&
            (
              candidate.customerId === source.customerId ||
              Boolean(source.normalizedEmail && candidate.normalizedEmail === source.normalizedEmail)
            ) &&
            isOpenStatus(candidate.subscription.status)
          )
        : []

      let recommendedAction: string
      if (!isOpenStatus(source.subscription.status)) {
        recommendedAction = 'NO_ACTION_CLOSED'
      } else if (source.workflow === 'NEW') {
        recommendedAction = 'KEEP_NEW_VERIFY_LEGACY_CANCELED'
      } else if (replacements.length > 0) {
        recommendedAction = 'CANCEL_LEGACY_AFTER_VERIFY_NEW'
      } else {
        recommendedAction = 'INVITE_TO_REENROLL'
      }

      return {
        stripeSubscriptionId: source.subscription.id,
        stripeCustomerId: source.customerId,
        customerName: source.customerName,
        customerEmail: source.customerEmail,
        stripeStatus: source.subscription.status,
        cancelAtPeriodEnd: source.subscription.cancel_at_period_end,
        currentPeriodEnd: dateValue(source.subscription.current_period_end),
        createdAt: dateValue(source.subscription.created),
        workflow: source.workflow,
        igniteSessionId: source.session.id,
        sessionName: source.session.name,
        stripePriceId: source.priceItem.price.id,
        stripeQuantity: source.quantity,
        weeklyUnitAmount: source.unitAmount,
        weeklyTotalAmount: source.unitAmount * source.quantity,
        localRecordPresent: Boolean(source.local),
        localStatus: source.local?.status || '',
        localQuantity: source.local?.quantity ?? null,
        linkedStudentCount: source.local?.students.length ?? 0,
        bookingCount: source.local?._count.bookings ?? 0,
        quantityMismatch: Boolean(source.local && source.local.quantity !== source.quantity),
        replacementSubscriptionIds: replacements.map(replacement => replacement.subscription.id).join(';'),
        recommendedAction
      }
    }).sort((a, b) =>
      a.recommendedAction.localeCompare(b.recommendedAction) || a.customerEmail.localeCompare(b.customerEmail)
    )

    const summary = {
      generatedAt: new Date().toISOString(),
      stripeMode,
      totalIgniteSubscriptions: rows.length,
      openSubscriptions: rows.filter(row => isOpenStatus(row.stripeStatus as Stripe.Subscription.Status)).length,
      legacyOpenSubscriptions: rows.filter(row => row.workflow === 'LEGACY' && isOpenStatus(row.stripeStatus as Stripe.Subscription.Status)).length,
      newOpenSubscriptions: rows.filter(row => row.workflow === 'NEW' && isOpenStatus(row.stripeStatus as Stripe.Subscription.Status)).length,
      readyToCancelLegacy: rows.filter(row => row.recommendedAction === 'CANCEL_LEGACY_AFTER_VERIFY_NEW').length,
      awaitingReenrollment: rows.filter(row => row.recommendedAction === 'INVITE_TO_REENROLL').length,
      missingLocalRecord: rows.filter(row => !row.localRecordPresent).length,
      missingLinkedStudents: rows.filter(row => isOpenStatus(row.stripeStatus as Stripe.Subscription.Status) && row.linkedStudentCount === 0).length,
      quantityMismatches: rows.filter(row => row.quantityMismatch).length,
      openWeeklyRevenue: rows
        .filter(row => isOpenStatus(row.stripeStatus as Stripe.Subscription.Status))
        .reduce((total, row) => total + row.weeklyTotalAmount, 0)
    }

    const outputArgument = process.argv.find(argument => argument.startsWith('--out='))?.slice('--out='.length)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputBase = outputArgument || path.join(process.cwd(), 'reports', `ignite-reenrollment-${timestamp}`)
    fs.mkdirSync(path.dirname(outputBase), { recursive: true })

    const headers = Object.keys(rows[0] || {
      stripeSubscriptionId: '', stripeCustomerId: '', customerName: '', customerEmail: '', stripeStatus: '',
      cancelAtPeriodEnd: '', currentPeriodEnd: '', createdAt: '', workflow: '', igniteSessionId: '', sessionName: '',
      stripePriceId: '', stripeQuantity: '', weeklyUnitAmount: '', weeklyTotalAmount: '', localRecordPresent: '',
      localStatus: '', localQuantity: '', linkedStudentCount: '', bookingCount: '', quantityMismatch: '',
      replacementSubscriptionIds: '', recommendedAction: ''
    }) as Array<keyof ReportRow>
    const csv = [
      headers.map(csvValue).join(','),
      ...rows.map(row => headers.map(header => csvValue(row[header])).join(','))
    ].join('\n')

    fs.writeFileSync(`${outputBase}.csv`, `${csv}\n`, { mode: 0o600 })
    fs.writeFileSync(`${outputBase}.json`, `${JSON.stringify({ summary, rows }, null, 2)}\n`, { mode: 0o600 })

    console.log(JSON.stringify(summary, null, 2))
    console.log(`\nDetailed CSV:  ${outputBase}.csv`)
    console.log(`Detailed JSON: ${outputBase}.json`)
    console.log('WARNING: These files contain customer PII. Store and share them securely.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error('Failed to generate Ignite re-enrollment report:', error)
  process.exit(1)
})

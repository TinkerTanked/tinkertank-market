/**
 * Audit and indefinitely pause only Pittwater House Term 4 subscriptions.
 *
 * Dry run (default): node pause-pittwater-term4.js
 * Apply only after every subscription has a paid 7 Dec invoice:
 *   node pause-pittwater-term4.js --apply \
 *     --confirm-session ignite-pittwater-house --confirm-date 2026-12-07
 */
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'
import { formatInTimeZone } from 'date-fns-tz'
import { getIgniteSessionConfig, SYDNEY_TZ } from '../src/lib/ignite'

const SESSION_ID = 'ignite-pittwater-house'
const FINAL_SESSION_DATE = '2026-12-07'
const prisma = new PrismaClient()
const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) throw new Error('STRIPE_SECRET_KEY is required')

const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
const args = process.argv.slice(2)
const apply = args.includes('--apply')

function argumentValue(name: string) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function invoiceCoversFinalSession(invoice: Stripe.Invoice, priceId: string) {
  return invoice.status === 'paid' && invoice.amount_paid > 0 && invoice.lines.data.some(line => {
    const linePriceId = typeof line.price === 'string' ? line.price : line.price?.id
    return linePriceId === priceId && formatInTimeZone(line.period.start * 1000, SYDNEY_TZ, 'yyyy-MM-dd') === FINAL_SESSION_DATE
  })
}

async function main() {
  const config = getIgniteSessionConfig(SESSION_ID)
  if (!config || config.lastSessionDate !== FINAL_SESSION_DATE) {
    throw new Error('Pittwater configuration does not match the audited final session date')
  }
  if (apply && (argumentValue('--confirm-session') !== SESSION_ID || argumentValue('--confirm-date') !== FINAL_SESSION_DATE)) {
    throw new Error(`Apply requires --confirm-session ${SESSION_ID} --confirm-date ${FINAL_SESSION_DATE}`)
  }

  const localSubscriptions = await prisma.igniteSubscription.findMany({
    where: {
      igniteSessionId: SESSION_ID,
      // Canceled subscriptions cannot bill again. Include every other local
      // state so past-due/mismatched rows block the all-clear and paused rows
      // make reruns idempotent.
      status: { not: 'CANCELED' }
    },
    orderBy: { stripeSubscriptionId: 'asc' }
  })
  if (localSubscriptions.length === 0) throw new Error('No non-canceled Pittwater subscriptions found; refusing to continue')

  const audit: Array<{ id: string; ready: boolean; reason: string }> = []
  for (const local of localSubscriptions) {
    const subscription = await stripe.subscriptions.retrieve(local.stripeSubscriptionId)
    const priceId = subscription.items.data[0]?.price.id
    if (subscription.metadata.igniteSessionId !== SESSION_ID) {
      audit.push({ id: subscription.id, ready: false, reason: 'Stripe session metadata mismatch' })
      continue
    }
    if (priceId !== config.stripePriceId) {
      audit.push({ id: subscription.id, ready: false, reason: 'Stripe price mismatch' })
      continue
    }
    if (subscription.pause_collection) {
      audit.push({ id: subscription.id, ready: true, reason: 'already paused' })
      continue
    }
    if (!['active', 'trialing'].includes(subscription.status)) {
      audit.push({ id: subscription.id, ready: false, reason: `Stripe status is ${subscription.status}` })
      continue
    }

    const invoices = await stripe.invoices.list({ subscription: subscription.id, limit: 100 })
    const finalInvoice = invoices.data.find(invoice => invoiceCoversFinalSession(invoice, config.stripePriceId))
    audit.push({
      id: subscription.id,
      ready: Boolean(finalInvoice),
      reason: finalInvoice ? `paid invoice ${finalInvoice.id}` : 'no paid positive invoice covering 7 Dec'
    })
  }

  console.table(audit)
  const blocked = audit.filter(result => !result.ready)
  if (blocked.length > 0) {
    throw new Error(`${blocked.length} of ${audit.length} subscriptions failed preflight; no subscriptions were changed`)
  }
  if (!apply) {
    console.log(`Dry run complete: all ${audit.length} subscriptions are eligible. No subscriptions were changed.`)
    return
  }

  const toPause = audit.filter(result => result.reason !== 'already paused')
  for (const candidate of toPause) {
    await stripe.subscriptions.update(
      candidate.id,
      { pause_collection: { behavior: 'void' } },
      { idempotencyKey: `pause-pittwater-t4-2026-${candidate.id}` }
    )
    console.log(`Paused ${candidate.id}`)
  }
  console.log(`Completed: ${toPause.length} subscriptions paused indefinitely; ${audit.length - toPause.length} were already paused.`)
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

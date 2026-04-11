/**
 * Pause active Ignite subscriptions for school holidays.
 * Only pauses subs whose latest invoice was paid >$0 in the last 4 weeks.
 * Resumes: Wednesday April 22, 2026 (first day back Term 2)
 *
 * Run audit:  npx tsx scripts/pause-subscriptions-april.ts
 * Run pause:  npx tsx scripts/pause-subscriptions-april.ts --pause
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) { console.error('❌ STRIPE_SECRET_KEY not set'); process.exit(1) }

const DRY_RUN = !process.argv.includes('--pause')
const RESUME_DATE = new Date('2026-04-22T00:00:00+10:00')
const RESUME_TIMESTAMP = Math.floor(RESUME_DATE.getTime() / 1000)
const FOUR_WEEKS_AGO = Math.floor((Date.now() - 28 * 24 * 60 * 60 * 1000) / 1000)

async function stripeGet(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } })
  if (!resp.ok) throw new Error(`Stripe GET ${resp.status}: ${await resp.text()}`)
  return resp.json()
}

async function stripePost(path: string, body: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  const resp = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body).toString()
  })
  if (!resp.ok) throw new Error(`Stripe POST ${resp.status}: ${await resp.text()}`)
  return resp.json()
}

interface SubToPause {
  id: string
  customerEmail: string
  customerName: string
  weeklyAmount: number
  lastInvoiceDate: string
  lastInvoiceAmount: number
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║  PAUSE IGNITE SUBSCRIPTIONS — School Holidays       ║')
  console.log('╚═══════════════════════════════════════════════════════╝')
  console.log(`  Mode: ${DRY_RUN ? '🔎 DRY RUN' : '⏸️  PAUSE MODE'}`)
  console.log(`  Resume: ${RESUME_DATE.toISOString().split('T')[0]} (Wed, first day Term 2)`)
  console.log(`  Filter: latest invoice paid >$0 since ${new Date(FOUR_WEEKS_AGO * 1000).toISOString().split('T')[0]}`)
  console.log(`  Time: ${new Date().toISOString()}\n`)

  // Fetch all active subs, check each one's latest invoice
  console.log('Fetching active subscriptions...')
  const toPause: SubToPause[] = []
  let skippedPaused = 0
  let skippedNotWeekly = 0
  let skippedNoRecentCharge = 0
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const params: Record<string, string> = { status: 'active', limit: '100' }
    if (startingAfter) params.starting_after = startingAfter
    const data = await stripeGet('/subscriptions', params)

    for (const sub of data.data) {
      if (sub.pause_collection) { skippedPaused++; continue }

      // Check it's weekly
      const priceItem = sub.items?.data?.[0]
      if (!priceItem?.price?.recurring || priceItem.price.recurring.interval !== 'week') {
        skippedNotWeekly++; continue
      }

      const weeklyAmount = (priceItem.price.unit_amount || 0) / 100
      if (weeklyAmount <= 0) { skippedNotWeekly++; continue }

      // Check latest invoice was paid recently and >$0
      const latestInvoiceId = sub.latest_invoice
      if (!latestInvoiceId) { skippedNoRecentCharge++; continue }

      const invId = typeof latestInvoiceId === 'string' ? latestInvoiceId : latestInvoiceId.id
      let invoice: any
      try {
        invoice = await stripeGet(`/invoices/${invId}`)
      } catch { skippedNoRecentCharge++; continue }

      if (invoice.status !== 'paid' || invoice.amount_paid <= 0 || invoice.created < FOUR_WEEKS_AGO) {
        skippedNoRecentCharge++
        continue
      }

      // Get customer
      let customerEmail = ''
      let customerName = ''
      try {
        const customer = await stripeGet(`/customers/${sub.customer}`)
        customerEmail = customer.email || ''
        customerName = customer.name || ''
      } catch { /* skip */ }

      toPause.push({
        id: sub.id,
        customerEmail,
        customerName,
        weeklyAmount,
        lastInvoiceDate: new Date(invoice.created * 1000).toISOString().split('T')[0],
        lastInvoiceAmount: invoice.amount_paid / 100
      })
    }

    hasMore = data.has_more
    if (data.data.length > 0) startingAfter = data.data[data.data.length - 1].id
    process.stdout.write(`  Processed ${toPause.length + skippedPaused + skippedNotWeekly + skippedNoRecentCharge} subs...\r`)
  }

  console.log(`\n  Skipped: ${skippedPaused} paused, ${skippedNotWeekly} not weekly, ${skippedNoRecentCharge} no recent charge`)
  console.log(`\nFound ${toPause.length} subscriptions to pause:\n`)

  for (const sub of toPause) {
    console.log(`  ${(sub.customerName || '').padEnd(30)} | ${sub.customerEmail.padEnd(35)} | $${sub.weeklyAmount}/wk | last: ${sub.lastInvoiceDate} ($${sub.lastInvoiceAmount})`)
  }

  const totalWeekly = toPause.reduce((sum, s) => sum + s.weeklyAmount, 0)
  const weeksOff = Math.ceil((RESUME_DATE.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
  console.log(`\n  Total weekly revenue: $${totalWeekly.toFixed(2)}`)
  console.log(`  Weeks paused: ~${weeksOff}`)
  console.log(`  Revenue deferred: ~$${(totalWeekly * weeksOff).toFixed(2)}`)

  if (DRY_RUN) {
    console.log(`\n  ℹ️  Run with --pause to execute:`)
    console.log(`     npx tsx scripts/pause-subscriptions-april.ts --pause`)
    return
  }

  console.log('\n  ⏸️  Pausing...\n')
  let success = 0, errors = 0

  for (const sub of toPause) {
    try {
      await stripePost(`/subscriptions/${sub.id}`, {
        'pause_collection[behavior]': 'mark_uncollectible',
        'pause_collection[resumes_at]': String(RESUME_TIMESTAMP)
      })
      success++
      console.log(`  ✅ ${sub.customerName} ($${sub.weeklyAmount}/wk)`)
    } catch (e) {
      errors++
      console.error(`  ❌ ${sub.id}: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`\n  Done: ${success} paused, ${errors} errors`)
  console.log(`  Resume: ${RESUME_DATE.toISOString().split('T')[0]}`)
}

main().catch(e => { console.error('❌', e); process.exit(1) })

/**
 * Analyse Camp Bookings — Last 12 months from Stripe
 * Correlate with NSW public school holidays
 *
 * npx tsx scripts/analyse-camp-bookings.ts
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) { console.error('❌ STRIPE_SECRET_KEY not set'); process.exit(1) }

// ─── NSW SCHOOL HOLIDAYS 2025-2026 ──────────────────────────────────────
// (Gaps between terms = school holidays when camps run)

interface HolidayPeriod {
  name: string
  start: string  // YYYY-MM-DD
  end: string
  termBefore: string
}

const SCHOOL_HOLIDAYS: HolidayPeriod[] = [
  // 2025
  { name: 'Autumn 2025 (Easter)', start: '2025-04-12', end: '2025-04-27', termBefore: 'Term 1 2025' },
  { name: 'Winter 2025', start: '2025-07-05', end: '2025-07-20', termBefore: 'Term 2 2025' },
  { name: 'Spring 2025', start: '2025-09-27', end: '2025-10-12', termBefore: 'Term 3 2025' },
  { name: 'Summer 2025-26', start: '2025-12-20', end: '2026-01-26', termBefore: 'Term 4 2025' },
  // 2026
  { name: 'Autumn 2026 (Easter)', start: '2026-04-03', end: '2026-04-19', termBefore: 'Term 1 2026' },
  { name: 'Winter 2026', start: '2026-07-04', end: '2026-07-19', termBefore: 'Term 2 2026' },
  { name: 'Spring 2026', start: '2026-09-26', end: '2026-10-11', termBefore: 'Term 3 2026' },
]

// ─── STRIPE API ──────────────────────────────────────────────────────────

async function stripeGet(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } })
  if (!resp.ok) throw new Error(`Stripe ${resp.status}: ${await resp.text()}`)
  return resp.json()
}

interface SessionData {
  id: string
  created: number
  amount: number
  email: string
  name: string
  lineItems: Array<{ description: string; quantity: number; amount: number }>
}

async function fetchAllPaidSessions(): Promise<SessionData[]> {
  const sessions: SessionData[] = []
  const oneYearAgo = Math.floor(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime() / 1000)
  let startingAfter: string | undefined
  let hasMore = true

  while (hasMore) {
    const params: Record<string, string> = {
      limit: '100',
      status: 'complete',
      'created[gte]': String(oneYearAgo)
    }
    if (startingAfter) params.starting_after = startingAfter
    const data = await stripeGet('/checkout/sessions', params)

    for (const s of data.data) {
      if (s.payment_status === 'paid' && s.mode === 'payment') {
        // Fetch line items
        let lineItems: any[] = []
        try {
          const li = await stripeGet(`/checkout/sessions/${s.id}/line_items`, { limit: '20' })
          lineItems = li.data
        } catch { /* skip */ }

        sessions.push({
          id: s.id,
          created: s.created,
          amount: (s.amount_total || 0) / 100,
          email: s.customer_details?.email || '',
          name: s.customer_details?.name || '',
          lineItems: lineItems.map((li: any) => ({
            description: li.description || '',
            quantity: li.quantity || 1,
            amount: (li.amount_total || 0) / 100
          }))
        })
      }
    }

    hasMore = data.has_more
    if (data.data.length > 0) startingAfter = data.data[data.data.length - 1].id
  }
  return sessions
}

// ─── ANALYSIS ────────────────────────────────────────────────────────────

function isCampItem(desc: string): boolean {
  const d = desc.toLowerCase()
  return (d.includes('day camp') || d.includes('camp')) &&
    !d.includes('ignite') && !d.includes('after schooler') &&
    !d.includes('extra student') && !d.includes('birthday')
}

function isBirthdayItem(desc: string): boolean {
  return desc.toLowerCase().includes('birthday')
}

function isIgniteItem(desc: string): boolean {
  const d = desc.toLowerCase()
  return d.includes('ignite') || d.includes('after schooler')
}

function getHolidayPeriod(dateStr: string): HolidayPeriod | null {
  for (const h of SCHOOL_HOLIDAYS) {
    if (dateStr >= h.start && dateStr <= h.end) return h
  }
  return null
}

function dateStr(ts: number): string {
  return new Date(ts * 1000).toISOString().split('T')[0]
}

function monthKey(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║  CAMP BOOKING ANALYSIS — Last 12 Months from Stripe ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  const sessions = await fetchAllPaidSessions()
  console.log(`📋 Fetched ${sessions.length} paid checkout sessions\n`)

  // Categorize
  let campSessions = 0, campRevenue = 0, campStudents = 0
  let birthdaySessions = 0, birthdayRevenue = 0
  let igniteSessions = 0, igniteRevenue = 0
  let otherSessions = 0, otherRevenue = 0

  const campByMonth = new Map<string, { sessions: number; revenue: number; students: number }>()
  const campByProduct = new Map<string, { count: number; revenue: number }>()
  const uniqueCustomers = new Set<string>()
  const customerSpend = new Map<string, { name: string; total: number; sessions: number }>()

  for (const s of sessions) {
    const hasCamp = s.lineItems.some(li => isCampItem(li.description))
    const hasBirthday = s.lineItems.some(li => isBirthdayItem(li.description))
    const hasIgnite = s.lineItems.some(li => isIgniteItem(li.description))

    if (hasCamp) {
      campSessions++
      campRevenue += s.amount
      uniqueCustomers.add(s.email)

      const mk = monthKey(s.created)
      if (!campByMonth.has(mk)) campByMonth.set(mk, { sessions: 0, revenue: 0, students: 0 })
      const m = campByMonth.get(mk)!

      m.sessions++
      m.revenue += s.amount

      for (const li of s.lineItems) {
        if (isCampItem(li.description)) {
          campStudents += li.quantity
          m.students += li.quantity

          const prodName = li.description.replace(/ \(\d+ days?\)/i, '').trim()
          if (!campByProduct.has(prodName)) campByProduct.set(prodName, { count: 0, revenue: 0 })
          const p = campByProduct.get(prodName)!
          p.count += li.quantity
          p.revenue += li.amount
        }
      }

      // Track customer spend
      if (!customerSpend.has(s.email)) customerSpend.set(s.email, { name: s.name, total: 0, sessions: 0 })
      const cs = customerSpend.get(s.email)!
      cs.total += s.amount
      cs.sessions++

    } else if (hasBirthday) {
      birthdaySessions++
      birthdayRevenue += s.amount
    } else if (hasIgnite) {
      igniteSessions++
      igniteRevenue += s.amount
    } else {
      otherSessions++
      otherRevenue += s.amount
    }
  }

  // ─── OVERVIEW ──────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════')
  console.log('  OVERVIEW — All Products')
  console.log('═══════════════════════════════════════════════════════\n')

  console.log('  Product Type      | Sessions | Revenue')
  console.log('  ------------------|----------|----------')
  console.log(`  Camps             |    ${String(campSessions).padStart(4)}  | $${campRevenue.toFixed(2)}`)
  console.log(`  Birthdays         |    ${String(birthdaySessions).padStart(4)}  | $${birthdayRevenue.toFixed(2)}`)
  console.log(`  Ignite/After Sch  |    ${String(igniteSessions).padStart(4)}  | $${igniteRevenue.toFixed(2)}`)
  console.log(`  Other             |    ${String(otherSessions).padStart(4)}  | $${otherRevenue.toFixed(2)}`)
  console.log(`  ------------------|----------|----------`)
  const totalRev = campRevenue + birthdayRevenue + igniteRevenue + otherRevenue
  console.log(`  TOTAL             |    ${String(sessions.length).padStart(4)}  | $${totalRev.toFixed(2)}`)

  // ─── CAMP DETAIL ───────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  CAMP BOOKINGS — Monthly Breakdown')
  console.log('═══════════════════════════════════════════════════════\n')

  console.log('  Month      | Bookings | Students | Revenue    | Holiday Period')
  console.log('  -----------|----------|----------|------------|----------------------------')

  const sortedMonths = [...campByMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  for (const [month, data] of sortedMonths) {
    // Check which holiday period this month falls in
    const midMonth = `${month}-15`
    const holiday = getHolidayPeriod(midMonth)
    const holidayName = holiday ? holiday.name : ''

    const bar = '█'.repeat(Math.ceil(data.revenue / 200))
    console.log(`  ${month}    |    ${String(data.sessions).padStart(4)}  |    ${String(data.students).padStart(4)}  | $${data.revenue.toFixed(2).padStart(9)} | ${holidayName}`)
    console.log(`             |          |          |            | ${bar}`)
  }

  // ─── BY PRODUCT ────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  CAMP BOOKINGS — By Product')
  console.log('═══════════════════════════════════════════════════════\n')

  console.log('  Product                      | Qty  | Revenue    | Avg Price')
  console.log('  -----------------------------|------|------------|----------')

  const sortedProducts = [...campByProduct.entries()].sort((a, b) => b[1].revenue - a[1].revenue)
  for (const [name, data] of sortedProducts) {
    const avg = data.count > 0 ? data.revenue / data.count : 0
    console.log(`  ${name.padEnd(29)} | ${String(data.count).padStart(4)} | $${data.revenue.toFixed(2).padStart(9)} | $${avg.toFixed(2)}`)
  }

  // ─── BY HOLIDAY PERIOD ─────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  CAMP BOOKINGS — By School Holiday Period')
  console.log('═══════════════════════════════════════════════════════\n')

  const byHoliday = new Map<string, { sessions: number; revenue: number; students: number; customers: Set<string> }>()
  const outsideHoliday = { sessions: 0, revenue: 0, students: 0 }

  for (const s of sessions) {
    const hasCamp = s.lineItems.some(li => isCampItem(li.description))
    if (!hasCamp) continue

    const ds = dateStr(s.created)
    const holiday = getHolidayPeriod(ds)

    // Also check if purchase was made in the weeks leading up to a holiday (pre-bookings)
    // People book 1-6 weeks before the holiday
    let matchedHoliday: HolidayPeriod | null = holiday
    if (!matchedHoliday) {
      // Find the next upcoming holiday from purchase date
      for (const h of SCHOOL_HOLIDAYS) {
        const daysUntilHoliday = (new Date(h.start).getTime() - new Date(ds).getTime()) / (1000 * 60 * 60 * 24)
        if (daysUntilHoliday >= 0 && daysUntilHoliday <= 60) {
          matchedHoliday = h
          break
        }
      }
    }

    if (matchedHoliday) {
      const key = matchedHoliday.name
      if (!byHoliday.has(key)) byHoliday.set(key, { sessions: 0, revenue: 0, students: 0, customers: new Set() })
      const h = byHoliday.get(key)!
      h.sessions++
      h.revenue += s.amount
      h.customers.add(s.email)
      for (const li of s.lineItems) {
        if (isCampItem(li.description)) h.students += li.quantity
      }
    } else {
      outsideHoliday.sessions++
      outsideHoliday.revenue += s.amount
    }
  }

  console.log('  Holiday Period            | Bookings | Families | Students | Revenue')
  console.log('  -------------------------|----------|----------|----------|----------')

  for (const h of SCHOOL_HOLIDAYS) {
    const data = byHoliday.get(h.name)
    if (!data) continue
    console.log(`  ${h.name.padEnd(25)} |    ${String(data.sessions).padStart(4)}  |    ${String(data.customers.size).padStart(4)}  |    ${String(data.students).padStart(4)}  | $${data.revenue.toFixed(2)}`)
  }

  if (outsideHoliday.sessions > 0) {
    console.log(`  ${'(Outside holiday periods)'.padEnd(25)} |    ${String(outsideHoliday.sessions).padStart(4)}  |          |          | $${outsideHoliday.revenue.toFixed(2)}`)
  }

  // ─── TOP CUSTOMERS ─────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  TOP CAMP CUSTOMERS (by spend)')
  console.log('═══════════════════════════════════════════════════════\n')

  const topCustomers = [...customerSpend.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)

  console.log('  #  | Customer                          | Bookings | Total Spend')
  console.log('  ---|-----------------------------------|----------|------------')
  let rank = 1
  for (const [email, data] of topCustomers) {
    const display = `${data.name} (${email})`.substring(0, 35)
    console.log(`  ${String(rank).padStart(2)} | ${display.padEnd(33)} |    ${String(data.sessions).padStart(4)}  | $${data.total.toFixed(2)}`)
    rank++
  }

  // ─── KEY METRICS ───────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  KEY METRICS')
  console.log('═══════════════════════════════════════════════════════\n')

  const avgOrderValue = campSessions > 0 ? campRevenue / campSessions : 0
  const avgStudentsPerBooking = campSessions > 0 ? campStudents / campSessions : 0

  console.log(`  Total camp revenue:        $${campRevenue.toFixed(2)}`)
  console.log(`  Total camp bookings:       ${campSessions}`)
  console.log(`  Total student-days sold:   ${campStudents}`)
  console.log(`  Unique families:           ${uniqueCustomers.size}`)
  console.log(`  Avg order value:           $${avgOrderValue.toFixed(2)}`)
  console.log(`  Avg students per booking:  ${avgStudentsPerBooking.toFixed(1)}`)
  console.log(`  Repeat rate:               ${((campSessions - uniqueCustomers.size) / campSessions * 100).toFixed(1)}% (${campSessions - uniqueCustomers.size} repeat bookings)`)
}

main().catch(e => { console.error('❌', e); process.exit(1) })

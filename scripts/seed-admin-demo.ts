/**
 * Local admin demo data: fake families, children, camp days, a party and
 * Ignite subscriptions (real Stripe TEST subscriptions, so billing works).
 *
 *   npm run db:seed-admin-demo            # replace any previous demo data
 *   npm run db:seed-admin-demo -- --reset # remove demo data only
 *
 * Refuses to run against anything but a localhost database and a Stripe test
 * key. Every record is tagged (student importReference "demo:", parent emails
 * at DEMO_DOMAIN, Stripe metadata demo=true) so a reset removes exactly it.
 */
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'
import { fromZonedTime } from 'date-fns-tz'
import { IGNITE_SESSIONS } from '../src/config/igniteProducts'
import { getIgniteScheduleFrom, igniteProductId } from '../src/lib/ignite'
import { igniteSubscriptionLifecycle, nextTermResumeDate, noticeCancellationTimestamp } from '../src/lib/igniteSubscriptionActions'
import { resolveCampLocation } from '../src/lib/campCapacity'
import { isDateKeyAvailableForLocation } from '../src/data/locationAvailability'

const DEMO_DOMAIN = 'demo.tinkertank.test'
const TZ = 'Australia/Sydney'

const databaseUrl = process.env.DATABASE_URL || ''
const stripeKey = process.env.STRIPE_SECRET_KEY || ''
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl)) throw new Error('Refusing to seed: DATABASE_URL is not a localhost database.')
if (!stripeKey.startsWith('sk_test_')) throw new Error('Refusing to seed: STRIPE_SECRET_KEY is not a Stripe test key.')

const prisma = new PrismaClient()
const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

// Small seeded RNG so every run produces the same families.
let seed = 20261016
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]
const chance = (p: number) => random() < p

const PARENT_FIRST = [
  'Sarah',
  'James',
  'Emma',
  'Michael',
  'Olivia',
  'David',
  'Sophie',
  'Daniel',
  'Chloe',
  'Matthew',
  'Jess',
  'Tom',
  'Priya',
  'Raj',
  'Mei',
  'Wei',
  'Hannah',
  'Ben',
  'Lucy',
  'Sam',
  'Grace',
  'Alex',
  'Nadia',
  'Omar',
]
const SURNAMES = [
  'Nguyen',
  'Smith',
  'Chen',
  'Williams',
  'Patel',
  'Brown',
  'Kim',
  'Taylor',
  "O'Connor",
  'Wilson',
  'Martin',
  'Anderson',
  'Thompson',
  'Singh',
  'White',
  'Harris',
  'Lee',
  'Walker',
  'Robinson',
  'Kelly',
  'Murphy',
  'Clarke',
  'Ryan',
  'Zhang',
  'Wong',
  'Jones',
  'Campbell',
  'Edwards',
  'Hughes',
  'Russo',
]
const CHILD_FIRST = [
  'Oliver',
  'Charlotte',
  'Noah',
  'Amelia',
  'Leo',
  'Isla',
  'Henry',
  'Mia',
  'Hudson',
  'Ava',
  'Jack',
  'Matilda',
  'Theo',
  'Willow',
  'Archie',
  'Harper',
  'Lucas',
  'Ruby',
  'Max',
  'Zoe',
  'Ethan',
  'Ivy',
  'Kai',
  'Aria',
  'Finn',
  'Evie',
  'Arlo',
  'Sienna',
  'Liam',
  'Frankie',
  'Hugo',
  'Poppy',
]
const SCHOOLS = [
  'Neutral Bay Public School',
  'Mosman Public School',
  'Cammeraygal High School',
  'Redlands',
  'Balgowlah Heights Public',
  'Manly Village Public School',
  'Wenona',
  'Shore',
  'St Marys Catholic School',
  'Cremorne Public School',
]
const ALLERGIES = ['Peanuts', 'Tree nuts', 'Dairy', 'Egg', 'Gluten (coeliac)', 'Bee stings', 'Sesame']
const MEDICAL = [
  'Asthma — Ventolin in backpack',
  'Anaphylaxis — EpiPen in front pocket of bag',
  'Type 1 diabetes — checks levels at lunch',
  'ADHD — benefits from movement breaks',
  'Wears glasses for screens',
]

function sydneyDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date)
}
function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
function weekday(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay()
}
function at(dateKey: string, time: string) {
  return fromZonedTime(`${dateKey}T${time}:00`, TZ)
}

async function reset() {
  const students = await prisma.student.findMany({ where: { importReference: { startsWith: 'demo:' } }, select: { id: true } })
  const studentIds = students.map(student => student.id)
  const byDemoEmail = { endsWith: `@${DEMO_DOMAIN}` }

  await prisma.campCredit.deleteMany({ where: { OR: [{ booking: { studentId: { in: studentIds } } }, { customerEmail: byDemoEmail }] } })
  await prisma.attendanceRecord.deleteMany({ where: { studentId: { in: studentIds } } })
  await prisma.booking.deleteMany({ where: { studentId: { in: studentIds } } })
  await prisma.orderItem.deleteMany({ where: { studentId: { in: studentIds } } })
  await prisma.order.deleteMany({ where: { customerEmail: byDemoEmail } })
  await prisma.student.deleteMany({ where: { id: { in: studentIds } } })

  // Deleting a Stripe customer cancels its subscriptions too. Search catches
  // customers from runs whose local rows are already gone (its index lags a minute).
  const customerIds = new Set(
    (await prisma.igniteSubscription.findMany({ where: { customerEmail: byDemoEmail }, select: { stripeCustomerId: true } })).map(
      sub => sub.stripeCustomerId
    )
  )
  for await (const customer of stripe.customers.search({ query: "metadata['demo']:'true'", limit: 100 })) customerIds.add(customer.id)
  let removed = 0
  for (const id of customerIds) {
    await stripe.customers.del(id).then(
      () => removed++,
      () => undefined
    )
  }
  await prisma.igniteSubscription.deleteMany({ where: { customerEmail: byDemoEmail } })
  console.log(`Removed ${studentIds.length} demo students and ${removed} Stripe test customers.`)
}

interface Family {
  parentName: string
  email: string
  phone: string
  children: { id: string; name: string }[]
}

async function createFamilies(count: number): Promise<Family[]> {
  const families: Family[] = []
  let childNumber = 0
  for (let i = 0; i < count; i++) {
    const surname = SURNAMES[i % SURNAMES.length]
    const parentFirst = pick(PARENT_FIRST)
    const email = `${parentFirst}.${surname}${i}`.toLowerCase().replace(/[^a-z0-9.]/g, '') + `@${DEMO_DOMAIN}`
    const phone = `04${String(10000000 + Math.floor(random() * 89999999)).slice(0, 2)} ${String(Math.floor(random() * 900) + 100)} ${String(Math.floor(random() * 900) + 100)}`
    const kids = chance(0.25) ? 2 : chance(0.08) ? 3 : 1
    const children: Family['children'] = []
    for (let k = 0; k < kids; k++) {
      const firstName = pick(CHILD_FIRST)
      const age = 6 + Math.floor(random() * 9)
      const student = await prisma.student.create({
        data: {
          importReference: `demo:${++childNumber}`,
          name: `${firstName} ${surname}`,
          firstName,
          lastName: surname,
          birthdate: new Date(Date.UTC(2026 - age, Math.floor(random() * 12), 1 + Math.floor(random() * 27))),
          school: pick(SCHOOLS),
          allergies: chance(0.2) ? pick(ALLERGIES) : chance(0.3) ? 'NA' : null,
          medicalNotes: chance(0.12) ? pick(MEDICAL) : null,
          emergencyContactName: `${pick(PARENT_FIRST)} ${surname}`,
          emergencyContactPhone: phone,
        },
      })
      children.push({ id: student.id, name: student.name })
    }
    families.push({ parentName: `${parentFirst} ${surname}`, email, phone, children })
  }
  return families
}

async function seedCamps(families: Family[], today: string) {
  const neutralBay = await resolveCampLocation(prisma, 'TinkerTank Neutral Bay')
  const manly = await resolveCampLocation(prisma, 'Manly Library')
  if (!neutralBay || !manly) throw new Error('Camp locations are missing; run the main seed first.')

  const products = await prisma.product.findMany({ where: { id: { in: ['day-camp', 'all-day-camp'] } } })
  const dayCamp = products.find(product => product.id === 'day-camp')!
  const allDayCamp = products.find(product => product.id === 'all-day-camp')!

  const neutralBayDays: string[] = []
  for (let offset = -7; offset <= 14; offset++) {
    const key = addDays(today, offset)
    if (weekday(key) !== 0 && isDateKeyAvailableForLocation(key, 'TinkerTank Neutral Bay')) neutralBayDays.push(key)
  }
  // One sold-out day three camp days out, so "Full" shows when moving bookings.
  const fullDay =
    neutralBayDays.find(key => key > today && neutralBayDays.indexOf(key) >= neutralBayDays.indexOf(today) + 3) ??
    neutralBayDays[neutralBayDays.length - 1]
  const counts = new Map<string, number>()
  const capacityFor = (key: string, location: { id: string; capacity: number }) =>
    key === fullDay && location.id === neutralBay.id ? location.capacity : 12 + Math.floor(random() * 16)
  const targets = new Map(neutralBayDays.map(key => [key, capacityFor(key, neutralBay)]))
  for (const key of ['2026-10-06', '2026-10-07', '2026-10-08']) targets.set(`manly:${key}`, 8 + Math.floor(random() * 10))

  let orders = 0
  let bookings = 0
  const plans: { family: Family; days: { key: string; location: typeof neutralBay; manly: boolean }[] }[] = []
  for (const family of families) {
    if (!chance(0.8)) continue
    const days = new Set<string>()
    const want = 1 + Math.floor(random() * 4)
    for (let tries = 0; tries < 12 && days.size < want; tries++)
      days.add(chance(0.15) ? `manly:${pick(['2026-10-06', '2026-10-07', '2026-10-08'])}` : pick(neutralBayDays))
    plans.push({
      family,
      days: [...days].map(key => ({
        key: key.replace('manly:', ''),
        location: key.startsWith('manly:') ? manly : neutralBay,
        manly: key.startsWith('manly:'),
      })),
    })
  }
  // Top up the sold-out day.
  for (const family of families) plans.push({ family, days: [{ key: fullDay, location: neutralBay, manly: false }] })
  const booked = new Set<string>()

  for (const plan of plans) {
    const items: {
      studentId: string
      productId: string
      price: number
      key: string
      location: typeof neutralBay
      manly: boolean
      product: typeof dayCamp
    }[] = []
    for (const day of plan.days) {
      const countKey = day.manly ? `manly:${day.key}` : day.key
      for (const child of plan.family.children) {
        if ((counts.get(countKey) ?? 0) >= (targets.get(countKey) ?? 0) || booked.has(`${child.id}:${day.key}`)) continue
        booked.add(`${child.id}:${day.key}`)
        counts.set(countKey, (counts.get(countKey) ?? 0) + 1)
        const product = !day.manly && chance(0.3) ? allDayCamp : dayCamp
        items.push({
          studentId: child.id,
          productId: product.id,
          price: Number(product.price),
          key: day.key,
          location: day.location,
          manly: day.manly,
          product,
        })
      }
    }
    if (items.length === 0) continue

    const firstKey = items.map(item => item.key).sort()[0]
    const order = await prisma.order.create({
      data: {
        customerEmail: plan.family.email,
        customerName: plan.family.parentName,
        customerFirstName: plan.family.parentName.split(' ')[0],
        customerLastName: plan.family.parentName.split(' ').slice(1).join(' '),
        customerPhone: plan.family.phone,
        emergencyContactName: plan.family.parentName,
        emergencyContactPhone: plan.family.phone,
        status: 'PAID',
        totalAmount: items.reduce((sum, item) => sum + item.price, 0),
        createdAt: at(addDays(firstKey, -10 - Math.floor(random() * 20)), '20:15'),
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            studentId: item.studentId,
            bookingDate: new Date(`${item.key}T00:00:00.000Z`),
            price: item.price,
            location: item.manly ? 'Manly Library' : 'TinkerTank Neutral Bay',
          })),
        },
      },
    })
    orders++

    for (const item of items) {
      const allDay = item.product.id === 'all-day-camp'
      const booking = await prisma.booking.create({
        data: {
          studentId: item.studentId,
          productId: item.productId,
          locationId: item.location.id,
          startDate: new Date(`${item.key}T09:00:00.000Z`),
          endDate: new Date(`${item.key}T${allDay ? '17' : '15'}:00:00.000Z`),
          status: 'CONFIRMED',
          totalPrice: item.price,
          notes: `Order: ${order.id}`,
        },
      })
      bookings++
      await seedAttendance(booking.id, item.studentId, item.key, today, allDay ? '17:05' : '15:05', '08:50')
    }
  }
  console.log(`Camps: ${orders} paid orders, ${bookings} camp days (Neutral Bay full on ${fullDay}).`)
}

/** Past days were attended; today is part-way through drop-off. */
async function seedAttendance(bookingId: string, studentId: string, key: string, today: string, pickUp: string, dropOff: string) {
  if (key > today || (key === today && !chance(0.55))) return
  const minutes = Math.floor(random() * 25)
  const checkInAt = new Date(at(key, dropOff).getTime() + minutes * 60000)
  const out = key < today || chance(0.1)
  await prisma.attendanceRecord.create({
    data: {
      studentId,
      bookingId,
      checkInAt,
      checkInBy: pick(['Sam', 'Priya', 'Josh']),
      checkOutAt: out ? new Date(at(key, pickUp).getTime() + Math.floor(random() * 30) * 60000) : null,
      checkOutBy: out ? pick(['Sam', 'Priya', 'Josh']) : null,
    },
  })
}

async function seedParty(families: Family[], today: string) {
  const location = await resolveCampLocation(prisma, 'TinkerTank Neutral Bay')
  const product = await prisma.product.findUnique({ where: { id: 'coding-party' } })
  if (!location || !product) return
  let saturday = today
  while (weekday(saturday) !== 6) saturday = addDays(saturday, 1)
  const family = families[3]
  const child = family.children[0]
  // Birthday times are Sydney wall-clock fields stored as UTC (10:00 → T10:00Z).
  const start = new Date(`${saturday}T10:00:00.000Z`)
  await prisma.order.create({
    data: {
      customerEmail: family.email,
      customerName: family.parentName,
      customerPhone: family.phone,
      status: 'PAID',
      totalAmount: product.price,
      orderItems: {
        create: [
          { productId: product.id, studentId: child.id, bookingDate: start, price: product.price, location: 'TinkerTank Neutral Bay' },
        ],
      },
    },
  })
  await prisma.booking.create({
    data: {
      studentId: child.id,
      productId: product.id,
      locationId: location.id,
      startDate: start,
      endDate: new Date(start.getTime() + (product.duration || 120) * 60000),
      status: 'CONFIRMED',
      totalPrice: product.price,
    },
  })
  console.log(`Party: ${child.name}'s Coding Party on ${saturday}.`)
}

async function seedIgnite(families: Family[], today: string) {
  const plan: [string, number][] = [
    ['ignite-nb-monfri', 7],
    ['ignite-nb-ps', 4],
    ['ignite-redlands', 3],
    ['ignite-balgowlah-wed', 3],
  ]
  const resumesAt = nextTermResumeDate()
  const startOfToday = at(today, '00:00')
  let familyIndex = families.length - 1
  let made = 0

  for (const [sessionId, count] of plan) {
    const config = IGNITE_SESSIONS.find(session => session.id === sessionId)!
    const location = await prisma.location.findFirst({ where: { name: { equals: config.location, mode: 'insensitive' }, isActive: true } })
    if (!location) {
      console.warn(`Skipping ${sessionId}: no "${config.location}" location.`)
      continue
    }
    const occurrences = getIgniteScheduleFrom(config, startOfToday)?.occurrences ?? []

    for (let i = 0; i < count; i++) {
      const family = families[familyIndex--]
      const child = family.children[0]
      const customer = await stripe.customers.create({
        email: family.email,
        name: family.parentName,
        phone: family.phone,
        payment_method: 'pm_card_visa',
        invoice_settings: { default_payment_method: 'pm_card_visa' },
        metadata: { demo: 'true' },
      })
      let subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: config.stripePriceId }],
        metadata: { demo: 'true', igniteSessionId: config.id, studentIds: child.id },
      })
      // A mix of states to exercise the admin: two paused, one cancelling.
      if (i === 1 && resumesAt) {
        subscription = await stripe.subscriptions.update(subscription.id, {
          pause_collection: { behavior: 'void', resumes_at: Math.floor(resumesAt.getTime() / 1000) },
        })
      } else if (i === 2 && count > 3) {
        subscription = await stripe.subscriptions.update(subscription.id, { cancel_at: noticeCancellationTimestamp(subscription) })
      }

      const local = await prisma.igniteSubscription.create({
        data: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customer.id,
          stripePriceId: config.stripePriceId,
          customerEmail: family.email,
          customerName: family.parentName,
          igniteSessionId: config.id,
          weeklyAmount: config.priceWeekly,
          createdAt: at(addDays(today, -40 - i), '19:30'),
          ...igniteSubscriptionLifecycle(subscription),
          students: { create: [{ studentId: child.id }] },
        },
      })
      made++

      // Paused families are off the roster until they resume.
      const bookingDays = local.status === 'PAUSED' ? [] : occurrences.filter(occurrence => sydneyDateKey(occurrence.start) >= today)
      for (const occurrence of bookingDays) {
        const booking = await prisma.booking.create({
          data: {
            studentId: child.id,
            productId: igniteProductId(config.id),
            locationId: location.id,
            igniteSubscriptionId: local.id,
            startDate: occurrence.start,
            endDate: occurrence.end,
            status: 'CONFIRMED',
            totalPrice: 0,
            notes: `Ignite: ${config.name} | Demo`,
          },
        })
        const key = sydneyDateKey(occurrence.start)
        if (key === today) await seedAttendance(booking.id, child.id, key, today, config.endTime, config.startTime)
      }
    }
  }
  console.log(`Ignite: ${made} Stripe test subscriptions with term bookings.`)
}

async function main() {
  await reset()
  if (process.argv.includes('--reset')) return

  const today = sydneyDateKey()
  const families = await createFamilies(60)
  await seedCamps(families, today)
  await seedParty(families, today)
  await seedIgnite(families, today)
  console.log(`Seeded ${families.length} demo families (${families.reduce((sum, family) => sum + family.children.length, 0)} children).`)
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

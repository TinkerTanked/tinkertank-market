// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv/config')
  } catch {
    // dotenv not available in production, that's fine
  }
}
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { IGNITE_SESSIONS } from '../src/config/igniteProducts'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
})

const prisma = new PrismaClient()

type IgniteSubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'

const statusMap: Record<string, IgniteSubscriptionStatus> = {
  active: 'ACTIVE',
  paused: 'PAUSED',
  canceled: 'CANCELED',
  past_due: 'PAST_DUE',
  trialing: 'TRIALING',
  incomplete: 'PAST_DUE',
  incomplete_expired: 'CANCELED',
  unpaid: 'PAST_DUE',
}

async function syncSubscriptions() {
  console.log('🔄 Syncing Stripe subscriptions to database...\n')

  let synced = 0
  let skipped = 0
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.customer'],
    })

    for (const subscription of subscriptions.data) {
      try {
        const customer = subscription.customer as Stripe.Customer
        if (customer.deleted) {
          console.log(`⏭️  Skipping ${subscription.id} - customer deleted`)
          skipped++
          continue
        }

        const priceItem = subscription.items.data[0]
        if (!priceItem) {
          console.log(`⏭️  Skipping ${subscription.id} - no price item`)
          skipped++
          continue
        }

        const price = await stripe.prices.retrieve(priceItem.price.id)
        const weeklyAmount = price.recurring?.interval === 'week'
          ? (price.unit_amount || 0) / 100
          : 0

        const igniteSession = IGNITE_SESSIONS.find(s => s.stripePriceId === priceItem.price.id)

        await prisma.igniteSubscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          create: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customer.id,
            stripePriceId: priceItem.price.id,
            customerEmail: customer.email || '',
            customerName: customer.name || null,
            igniteSessionId: igniteSession?.id || null,
            status: statusMap[subscription.status] || 'ACTIVE',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            weeklyAmount,
          },
          update: {
            stripePriceId: priceItem.price.id,
            customerEmail: customer.email || '',
            customerName: customer.name || null,
            igniteSessionId: igniteSession?.id || null,
            status: statusMap[subscription.status] || 'ACTIVE',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            weeklyAmount,
          },
        })

        const sessionName = igniteSession?.name || 'Unknown session'
        console.log(`✅ Synced: ${subscription.id} (${customer.email}) - ${sessionName}`)
        synced++
      } catch (error) {
        console.error(`❌ Error syncing ${subscription.id}:`, error)
      }
    }

    hasMore = subscriptions.has_more
    if (hasMore && subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Synced: ${synced}`)
  console.log(`   Skipped: ${skipped}`)
}

async function main() {
  try {
    await syncSubscriptions()
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })

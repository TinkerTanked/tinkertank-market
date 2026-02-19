import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

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

export async function POST(request: Request) {
  // Simple auth check using admin credentials
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Basic ${Buffer.from(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`).toString('base64')}`
  
  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔄 Syncing Stripe subscriptions to database...')

    let synced = 0
    let skipped = 0
    const results: string[] = []
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
            results.push(`⏭️ Skipped ${subscription.id} - customer deleted`)
            skipped++
            continue
          }

          const priceItem = subscription.items.data[0]
          if (!priceItem) {
            results.push(`⏭️ Skipped ${subscription.id} - no price item`)
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
          results.push(`✅ Synced: ${subscription.id} (${customer.email}) - ${sessionName}`)
          synced++
        } catch (error) {
          results.push(`❌ Error syncing ${subscription.id}: ${error}`)
        }
      }

      hasMore = subscriptions.has_more
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      results,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed', details: String(error) }, { status: 500 })
  }
}

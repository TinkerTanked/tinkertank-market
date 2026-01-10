import 'dotenv/config'
import Stripe from 'stripe'
import { writeFileSync } from 'fs'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
})

async function main() {
  const resumeDate = new Date('2026-02-01T00:00:00+11:00') // Feb 1, 2026 Sydney time
  const resumeTimestamp = Math.floor(resumeDate.getTime() / 1000)

  console.log('🔍 Fetching active Stripe subscriptions...\n')
  console.log(`📅 Will pause until: ${resumeDate.toISOString().split('T')[0]}\n`)

  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 100,
  })

  const toPause = []

  for (const sub of subscriptions.data) {
    for (const item of sub.items.data) {
      const price = await stripe.prices.retrieve(item.price.id)
      
      if (price.recurring?.interval === 'week') {
        const weeklyAmount = (price.unit_amount || 0) / 100
        
        if (weeklyAmount > 0 && weeklyAmount < 75) {
          toPause.push({
            subscriptionId: sub.id,
            customerId: sub.customer,
            weeklyAmount,
          })
          break // Only add once per subscription
        }
      }
    }
  }

  console.log(`Found ${toPause.length} subscriptions to pause\n`)
  
  if (toPause.length === 0) {
    console.log('No subscriptions to pause!')
    return
  }

  // Confirm before proceeding
  console.log('⚠️  WARNING: About to pause subscriptions!')
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
  
  await new Promise(resolve => setTimeout(resolve, 5000))

  const pausedSubscriptions = []
  let successCount = 0
  let errorCount = 0

  for (const sub of toPause) {
    try {
      const updated = await stripe.subscriptions.update(sub.subscriptionId, {
        pause_collection: {
          behavior: 'mark_uncollectible',
          resumes_at: resumeTimestamp,
        }
      })

      pausedSubscriptions.push({
        subscriptionId: sub.subscriptionId,
        customerId: sub.customerId,
        weeklyAmount: sub.weeklyAmount,
        pausedAt: new Date().toISOString(),
        resumesAt: resumeDate.toISOString(),
      })

      successCount++
      console.log(`✅ Paused: ${sub.subscriptionId} ($${sub.weeklyAmount}/week)`)
    } catch (error) {
      errorCount++
      console.error(`❌ Failed: ${sub.subscriptionId} - ${error}`)
    }
  }

  // Save results to file
  const resultFile = `paused-subscriptions-${Date.now()}.json`
  writeFileSync(resultFile, JSON.stringify(pausedSubscriptions, null, 2))

  console.log(`\n✅ Complete!`)
  console.log(`Successfully paused: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Subscription IDs saved to: ${resultFile}`)
  console.log(`\nSubscriptions will resume on: ${resumeDate.toISOString().split('T')[0]}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })

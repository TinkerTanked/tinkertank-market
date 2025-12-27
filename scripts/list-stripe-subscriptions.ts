import 'dotenv/config'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
})

async function main() {
  console.log('🔍 Fetching active Stripe subscriptions...\n')

  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 100,
  })

  const weeklySubscriptions = []

  for (const sub of subscriptions.data) {
    for (const item of sub.items.data) {
      const price = await stripe.prices.retrieve(item.price.id)
      
      if (price.recurring?.interval === 'week') {
        const weeklyAmount = (price.unit_amount || 0) / 100
        
        if (weeklyAmount > 0 && weeklyAmount < 75) {
          weeklySubscriptions.push({
            subscriptionId: sub.id,
            customerId: sub.customer,
            priceId: price.id,
            weeklyAmount,
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            createdAt: new Date(sub.created * 1000),
          })
        }
      }
    }
  }

  console.log(`Found ${weeklySubscriptions.length} weekly subscriptions between $0-$75:\n`)
  
  weeklySubscriptions.forEach((sub, idx) => {
    console.log(`${idx + 1}. Subscription: ${sub.subscriptionId}`)
    console.log(`   Customer: ${sub.customerId}`)
    console.log(`   Weekly Amount: $${sub.weeklyAmount.toFixed(2)}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Current Period Ends: ${sub.currentPeriodEnd.toISOString().split('T')[0]}`)
    console.log(`   Created: ${sub.createdAt.toISOString().split('T')[0]}`)
    console.log('')
  })

  console.log(`\n📊 Summary:`)
  console.log(`Total subscriptions: ${weeklySubscriptions.length}`)
  console.log(`Total weekly revenue: $${weeklySubscriptions.reduce((sum, s) => sum + s.weeklyAmount, 0).toFixed(2)}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })

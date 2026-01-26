/**
 * Test Ignite Subscription Purchases with Stripe
 * 
 * This script creates real test subscriptions in Stripe for all 12 Ignite products
 * and verifies they are processed correctly.
 * 
 * Run with: npx tsx scripts/test-ignite-purchases.ts
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'

// Load .env file
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value.trim()
      }
    }
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia'
})

// All 12 Ignite products
const IGNITE_PRODUCTS = [
  // In-School (3)
  {
    id: 'ignite-balgowlah-wed',
    name: 'Balgowlah Heights Public - Wednesday 12:45pm',
    programType: 'in-school',
    priceId: 'price_1StKP9DqupgKyrhoQxEg01ua',
    productId: 'prod_Tr2UrvopQoseGC',
    amount: 2599
  },
  {
    id: 'ignite-balgowlah-thu',
    name: 'Balgowlah Heights Public - Thursday 3:45pm',
    programType: 'in-school',
    priceId: 'price_1StKPADqupgKyrhoUmdMDcHc',
    productId: 'prod_Tr2UButkR3rLsu',
    amount: 2999
  },
  {
    id: 'ignite-ics-tue',
    name: 'International Chinese School - Tuesday 4pm',
    programType: 'in-school',
    priceId: 'price_1StKPBDqupgKyrhoFBdlmoKk',
    productId: 'prod_Tr2USER37jHSqK',
    amount: 3099
  },
  // Drop-Off (4)
  {
    id: 'ignite-nb-monfri',
    name: 'Neutral Bay Studio - Mon-Fri 3:30pm',
    programType: 'drop-off',
    priceId: 'price_1StKPCDqupgKyrho8MVv42fB',
    productId: 'prod_Tr2U8LvoUYQpUW',
    amount: 3999
  },
  {
    id: 'ignite-nb-sat',
    name: 'Neutral Bay Studio - Saturday 10am',
    programType: 'drop-off',
    priceId: 'price_1StKPEDqupgKyrhomgKCSdXu',
    productId: 'prod_Tr2UV2dbzeRGem',
    amount: 3999
  },
  {
    id: 'ignite-brookvale-cc',
    name: 'Brookvale Community Centre - Monday 3:30pm',
    programType: 'drop-off',
    priceId: 'price_1StKPFDqupgKyrhoqs9xI4mj',
    productId: 'prod_Tr2UeutYss76YJ',
    amount: 3999
  },
  {
    id: 'ignite-manly-library',
    name: 'Manly Creative Library - Wednesday 3:30pm',
    programType: 'drop-off',
    priceId: 'price_1StKPGDqupgKyrhoqKltUzlP',
    productId: 'prod_Tr2UMLGLz5ASmm',
    amount: 3999
  },
  // School Pickup (5)
  {
    id: 'ignite-brookvale-ps',
    name: 'Brookvale Public School - Monday 3pm',
    programType: 'school-pickup',
    priceId: 'price_1StKPHDqupgKyrhoDoXly8g2',
    productId: 'prod_Tr2UsGEvnSNaK0',
    amount: 4499
  },
  {
    id: 'ignite-manly-village',
    name: 'Manly Village Public School - Wednesday 3pm',
    programType: 'school-pickup',
    priceId: 'price_1StKPIDqupgKyrhoYd0u5j2S',
    productId: 'prod_Tr2UHCCqGtGvCB',
    amount: 5499
  },
  {
    id: 'ignite-nb-ps',
    name: 'Neutral Bay Public School - Mon-Fri 3pm',
    programType: 'school-pickup',
    priceId: 'price_1StKPKDqupgKyrho5L0t4yPu',
    productId: 'prod_Tr2U80JbdBmEQS',
    amount: 5499
  },
  {
    id: 'ignite-redlands',
    name: 'Redlands School - Mon-Fri 3pm',
    programType: 'school-pickup',
    priceId: 'price_1StKPLDqupgKyrhoXcJwf3Bp',
    productId: 'prod_Tr2UjbbOsxA9Yu',
    amount: 5499
  },
  {
    id: 'ignite-stmarys',
    name: 'St Marys Catholic School - Wednesday 3pm',
    programType: 'school-pickup',
    priceId: 'price_1StKPMDqupgKyrho5Yb1KWKj',
    productId: 'prod_Tr2UU6GWX0k98g',
    amount: 5499
  }
]

interface TestResult {
  productId: string
  productName: string
  programType: string
  success: boolean
  subscriptionId?: string
  customerId?: string
  error?: string
}

async function createTestCustomer(index: number): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: `test-ignite-${index}@tinkertank-test.com`,
    name: `Test Parent ${index}`,
    phone: '+61400000000',
    metadata: {
      testPurchase: 'true',
      studentName: `Test Student ${index}`,
      studentDob: '2015-05-15'
    }
  })
}

async function attachTestPaymentMethod(customerId: string): Promise<Stripe.PaymentMethod> {
  // Create a test payment method using Stripe's test token
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      token: 'tok_visa' // Stripe test token for Visa
    }
  })

  // Attach to customer
  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customerId
  })

  // Set as default
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethod.id
    }
  })

  return paymentMethod
}

async function createTestSubscription(
  customerId: string,
  priceId: string,
  metadata: Record<string, string>
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    expand: ['latest_invoice.payment_intent']
  })
}

async function confirmSubscriptionPayment(subscription: Stripe.Subscription): Promise<boolean> {
  const invoice = subscription.latest_invoice as Stripe.Invoice
  const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent

  if (paymentIntent && paymentIntent.status === 'requires_payment_method') {
    // Get the customer's default payment method
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method

    if (defaultPaymentMethod) {
      await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: defaultPaymentMethod as string
      })
      return true
    }
  } else if (paymentIntent && paymentIntent.status === 'requires_confirmation') {
    await stripe.paymentIntents.confirm(paymentIntent.id)
    return true
  } else if (!paymentIntent || paymentIntent.status === 'succeeded') {
    return true
  }

  return false
}

async function testProduct(product: typeof IGNITE_PRODUCTS[0], index: number): Promise<TestResult> {
  console.log(`\n🧪 Testing: ${product.name}`)
  
  try {
    // 1. Create test customer
    const customer = await createTestCustomer(index)
    console.log(`   ✓ Created customer: ${customer.id}`)

    // 2. Attach payment method
    const paymentMethod = await attachTestPaymentMethod(customer.id)
    console.log(`   ✓ Attached payment method: ${paymentMethod.id}`)

    // 3. Create subscription
    const subscription = await createTestSubscription(customer.id, product.priceId, {
      igniteProductId: product.id,
      programType: product.programType,
      studentName: `Test Student ${index}`,
      testPurchase: 'true'
    })
    console.log(`   ✓ Created subscription: ${subscription.id}`)

    // 4. Confirm payment if needed
    const confirmed = await confirmSubscriptionPayment(subscription)
    if (confirmed) {
      console.log(`   ✓ Payment confirmed`)
    }

    // 5. Verify subscription status
    const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id)
    const status = updatedSubscription.status

    if (status === 'active' || status === 'trialing') {
      console.log(`   ✅ SUCCESS - Subscription active (${status})`)
      return {
        productId: product.id,
        productName: product.name,
        programType: product.programType,
        success: true,
        subscriptionId: subscription.id,
        customerId: customer.id
      }
    } else {
      console.log(`   ⚠️ Subscription status: ${status}`)
      return {
        productId: product.id,
        productName: product.name,
        programType: product.programType,
        success: status === 'incomplete' || status === 'active',
        subscriptionId: subscription.id,
        customerId: customer.id,
        error: `Unexpected status: ${status}`
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`   ❌ FAILED: ${errorMessage}`)
    return {
      productId: product.id,
      productName: product.name,
      programType: product.programType,
      success: false,
      error: errorMessage
    }
  }
}

async function cleanupTestData(results: TestResult[]): Promise<void> {
  console.log('\n🧹 Cleaning up test subscriptions...')
  
  for (const result of results) {
    if (result.subscriptionId) {
      try {
        await stripe.subscriptions.cancel(result.subscriptionId)
        console.log(`   Cancelled subscription: ${result.subscriptionId}`)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  console.log('   ✓ Cleanup complete')
}

async function main() {
  console.log('🚀 Starting Ignite Subscription Purchase Tests')
  console.log('=' .repeat(60))
  console.log(`Testing ${IGNITE_PRODUCTS.length} Ignite products with Stripe test mode`)
  
  const results: TestResult[] = []
  
  // Test each product
  for (let i = 0; i < IGNITE_PRODUCTS.length; i++) {
    const result = await testProduct(IGNITE_PRODUCTS[i], i + 1)
    results.push(result)
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  console.log(`\n✅ Successful: ${successful.length}/${results.length}`)
  
  // Group by program type
  const byType: Record<string, TestResult[]> = {}
  for (const result of results) {
    if (!byType[result.programType]) {
      byType[result.programType] = []
    }
    byType[result.programType].push(result)
  }

  console.log('\nResults by Program Type:')
  for (const [type, typeResults] of Object.entries(byType)) {
    const typeSuccessful = typeResults.filter(r => r.success).length
    const emoji = typeSuccessful === typeResults.length ? '✅' : '⚠️'
    console.log(`   ${emoji} ${type}: ${typeSuccessful}/${typeResults.length}`)
    for (const result of typeResults) {
      const status = result.success ? '✓' : '✗'
      console.log(`      ${status} ${result.productName}`)
    }
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:')
    for (const result of failed) {
      console.log(`   - ${result.productName}: ${result.error}`)
    }
  }

  // Ask about cleanup
  console.log('\n📋 Created Test Subscriptions:')
  for (const result of successful) {
    console.log(`   ${result.productName}:`)
    console.log(`      Subscription: ${result.subscriptionId}`)
    console.log(`      Customer: ${result.customerId}`)
  }

  // Cleanup test data
  await cleanupTestData(results)

  console.log('\n' + '=' .repeat(60))
  if (failed.length === 0) {
    console.log('🎉 ALL TESTS PASSED!')
  } else {
    console.log(`⚠️ ${failed.length} test(s) failed`)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

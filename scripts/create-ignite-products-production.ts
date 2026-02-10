/**
 * Create Ignite Products in PRODUCTION Stripe
 * 
 * Run with: npx tsx scripts/create-ignite-products-production.ts
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

// Use production key - check command line arg first, then env vars
const STRIPE_KEY = process.argv[2] || process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_PRODUCTION_KEY

if (!STRIPE_KEY) {
  console.error('❌ Production Stripe key not found')
  console.error('   Usage: npx tsx scripts/create-ignite-products-production.ts sk_live_xxx')
  console.error('   Or set STRIPE_SECRET_KEY_LIVE in .env')
  process.exit(1)
}

if (!STRIPE_KEY.startsWith('sk_live_')) {
  console.error('❌ This script requires a LIVE Stripe key (sk_live_...)')
  console.error('   Provided key starts with:', STRIPE_KEY.substring(0, 10))
  process.exit(1)
}

const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: '2025-02-24.acacia'
})

console.log('🔴 PRODUCTION MODE - Creating products in LIVE Stripe account')
console.log('')

interface IgniteProduct {
  name: string
  programType: 'in-school' | 'drop-off' | 'school-pickup'
  location: string
  address?: string
  dayOfWeek: string
  startTime: string
  endTime: string
  priceWeekly: number
  description: string
}

const IGNITE_PRODUCTS: IgniteProduct[] = [
  // In-School Ignite Program
  {
    name: 'Balgowlah Heights Public - Wednesday 12:45pm-1:45pm',
    programType: 'in-school',
    location: 'Balgowlah Heights Public',
    dayOfWeek: 'wednesday',
    startTime: '12:45',
    endTime: '13:45',
    priceWeekly: 25.99,
    description: 'In-School Ignite Program at Balgowlah Heights Public School - Wednesday lunchtime session'
  },
  {
    name: 'Balgowlah Heights Public - Thursday 3:45pm-5:15pm',
    programType: 'in-school',
    location: 'Balgowlah Heights Public',
    dayOfWeek: 'thursday',
    startTime: '15:45',
    endTime: '17:15',
    priceWeekly: 29.99,
    description: 'In-School Ignite Program at Balgowlah Heights Public School - Thursday after school session'
  },
  {
    name: 'International Chinese School - Tuesday 4:00pm-5:30pm',
    programType: 'in-school',
    location: 'International Chinese School',
    dayOfWeek: 'tuesday',
    startTime: '16:00',
    endTime: '17:30',
    priceWeekly: 30.99,
    description: 'In-School Ignite Program at International Chinese School - Tuesday after school session'
  },

  // Drop-Off Studio Ignite
  {
    name: 'Neutral Bay Mon-Fri 3:30pm-5:30pm',
    programType: 'drop-off',
    location: 'Neutral Bay',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    dayOfWeek: 'monday,tuesday,wednesday,thursday,friday',
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99,
    description: 'Drop-Off Studio Ignite at our Neutral Bay studio - Weekday after school sessions'
  },
  {
    name: 'Neutral Bay Saturday 10am-12pm',
    programType: 'drop-off',
    location: 'Neutral Bay',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    dayOfWeek: 'saturday',
    startTime: '10:00',
    endTime: '12:00',
    priceWeekly: 39.99,
    description: 'Drop-Off Studio Ignite at our Neutral Bay studio - Saturday morning session'
  },
  {
    name: 'Brookvale Community Centre Monday 3:30pm-5:30pm',
    programType: 'drop-off',
    location: 'Brookvale Community Centre',
    address: '2 Alfred Rd, Brookvale NSW 2100',
    dayOfWeek: 'monday',
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99,
    description: 'Drop-Off Studio Ignite at Brookvale Community Centre - Monday after school session'
  },
  {
    name: 'Manly Creative Library Wednesday 3:30pm-5:30pm',
    programType: 'drop-off',
    location: 'Manly Creative Library',
    address: '1 Market Ln, Manly NSW 2095',
    dayOfWeek: 'wednesday',
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99,
    description: 'Drop-Off Studio Ignite at Manly Creative Library - Wednesday after school session'
  },

  // School Pickup Ignite
  {
    name: 'Brookvale Public School Monday 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'Brookvale Public School',
    dayOfWeek: 'monday',
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 44.99,
    description: 'School Pickup Ignite with pickup from Brookvale Public School - Monday'
  },
  {
    name: 'Manly Village Public School Wednesday 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'Manly Village Public School',
    dayOfWeek: 'wednesday',
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99,
    description: 'School Pickup Ignite with pickup from Manly Village Public School - Wednesday'
  },
  {
    name: 'Neutral Bay Public School Mon-Fri 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'Neutral Bay Public School',
    dayOfWeek: 'monday,tuesday,wednesday,thursday,friday',
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99,
    description: 'School Pickup Ignite with pickup from Neutral Bay Public School - Weekdays'
  },
  {
    name: 'Redlands School Mon-Fri 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'Redlands School',
    dayOfWeek: 'monday,tuesday,wednesday,thursday,friday',
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99,
    description: 'School Pickup Ignite with pickup from Redlands School - Weekdays'
  },
  {
    name: 'St Marys Catholic School Wednesday 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'St Marys Catholic School',
    dayOfWeek: 'wednesday',
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99,
    description: 'School Pickup Ignite with pickup from St Marys Catholic School - Wednesday'
  }
]

interface CreatedProduct {
  name: string
  productId: string
  priceId: string
  price: number
}

async function checkExistingProduct(product: IgniteProduct): Promise<Stripe.Product | null> {
  try {
    const products = await stripe.products.search({
      query: `metadata['location']:'${product.location}' AND metadata['dayOfWeek']:'${product.dayOfWeek}' AND metadata['startTime']:'${product.startTime}'`
    })
    
    if (products.data.length > 0) {
      return products.data[0]
    }
  } catch (e) {
    // Search may not be available, continue with creation
  }
  return null
}

async function createProduct(product: IgniteProduct): Promise<CreatedProduct> {
  // Check if product already exists
  const existing = await checkExistingProduct(product)
  
  if (existing) {
    console.log(`⏭️  Already exists: ${product.name}`)
    
    // Get the price
    const prices = await stripe.prices.list({
      product: existing.id,
      active: true,
      limit: 1
    })
    
    return {
      name: product.name,
      productId: existing.id,
      priceId: prices.data[0]?.id || 'unknown',
      price: product.priceWeekly
    }
  }

  // Calculate duration in minutes
  const [startH, startM] = product.startTime.split(':').map(Number)
  const [endH, endM] = product.endTime.split(':').map(Number)
  const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM)

  // Create the product
  const stripeProduct = await stripe.products.create({
    name: product.name,
    description: product.description,
    metadata: {
      programType: product.programType,
      location: product.location,
      address: product.address || '',
      dayOfWeek: product.dayOfWeek,
      startTime: product.startTime,
      endTime: product.endTime,
      duration: String(durationMinutes),
      term: 'Term 1 2026'
    }
  })

  // Create weekly recurring price
  const price = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(product.priceWeekly * 100),
    currency: 'aud',
    recurring: {
      interval: 'week',
      interval_count: 1
    }
  })

  console.log(`✅ Created: ${product.name}`)
  console.log(`   Product ID: ${stripeProduct.id}`)
  console.log(`   Price ID: ${price.id}`)
  console.log(`   Price: $${product.priceWeekly}/week`)

  return {
    name: product.name,
    productId: stripeProduct.id,
    priceId: price.id,
    price: product.priceWeekly
  }
}

async function main() {
  console.log('🚀 Creating Term 1 Ignite products in PRODUCTION Stripe...')
  console.log('')

  const results: CreatedProduct[] = []
  let created = 0
  let existed = 0

  for (const product of IGNITE_PRODUCTS) {
    try {
      const result = await createProduct(product)
      results.push(result)
      
      if (result.productId.startsWith('prod_')) {
        created++
      } else {
        existed++
      }
    } catch (error) {
      console.error(`❌ Failed to create: ${product.name}`)
      console.error(`   Error: ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log('')
  console.log('📊 Summary:')
  console.log(`Total products: ${IGNITE_PRODUCTS.length}`)
  console.log(`Created: ${created}`)
  console.log(`Already existed: ${existed}`)

  console.log('')
  console.log('📋 Product IDs for IgniteWeekCalendarStep.tsx:')
  console.log('')
  
  for (const result of results) {
    console.log(`${result.name}:`)
    console.log(`  Product: ${result.productId}`)
    console.log(`  Price: ${result.priceId}`)
  }

  // Output in format for easy copy-paste to update the component
  console.log('')
  console.log('📝 Copy these price IDs to update IgniteWeekCalendarStep.tsx:')
  console.log('')
  for (const result of results) {
    console.log(`'${result.priceId}', // ${result.name}`)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

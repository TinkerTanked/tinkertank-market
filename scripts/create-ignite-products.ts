import 'dotenv/config'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
})

type ProgramType = 'in-school' | 'drop-off' | 'school-pickup'

interface IgniteProduct {
  name: string
  programType: ProgramType
  location: string
  address?: string
  dayOfWeek: string
  startTime: string
  endTime: string
  pricePerWeek: number
}

const igniteProducts: IgniteProduct[] = [
  // In-School Ignite Programs
  {
    name: 'Balgowlah Heights Public - Wednesday 12:45pm-1:45pm',
    programType: 'in-school',
    location: 'Balgowlah Heights Public',
    dayOfWeek: 'wednesday',
    startTime: '12:45',
    endTime: '13:45',
    pricePerWeek: 25.99,
  },
  {
    name: 'Balgowlah Heights Public - Thursday 3:45pm-5:15pm',
    programType: 'in-school',
    location: 'Balgowlah Heights Public',
    dayOfWeek: 'thursday',
    startTime: '15:45',
    endTime: '17:15',
    pricePerWeek: 29.99,
  },
  {
    name: 'International Chinese School - Tuesday 4:00pm-5:30pm',
    programType: 'in-school',
    location: 'International Chinese School',
    dayOfWeek: 'tuesday',
    startTime: '16:00',
    endTime: '17:30',
    pricePerWeek: 30.99,
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
    pricePerWeek: 39.99,
  },
  {
    name: 'Neutral Bay Saturday 10am-12pm',
    programType: 'drop-off',
    location: 'Neutral Bay',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    dayOfWeek: 'saturday',
    startTime: '10:00',
    endTime: '12:00',
    pricePerWeek: 39.99,
  },
  {
    name: 'Brookvale Community Centre Monday 3:30pm-5:30pm',
    programType: 'drop-off',
    location: 'Brookvale Community Centre',
    address: '2 Alfred Rd, Brookvale NSW 2100',
    dayOfWeek: 'monday',
    startTime: '15:30',
    endTime: '17:30',
    pricePerWeek: 39.99,
  },
  {
    name: 'Manly Creative Library Wednesday 3:30pm-5:30pm',
    programType: 'drop-off',
    location: 'Manly Creative Library',
    address: '1 Market Ln, Manly NSW 2095',
    dayOfWeek: 'wednesday',
    startTime: '15:30',
    endTime: '17:30',
    pricePerWeek: 39.99,
  },

  // School Pickup Ignite
  {
    name: 'Brookvale Public School Monday 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'Brookvale Public School',
    dayOfWeek: 'monday',
    startTime: '15:00',
    endTime: '17:30',
    pricePerWeek: 44.99,
  },
  {
    name: 'Manly Village Public School Wednesday 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'Manly Village Public School',
    dayOfWeek: 'wednesday',
    startTime: '15:00',
    endTime: '17:30',
    pricePerWeek: 54.99,
  },
  {
    name: 'Neutral Bay Public School Mon-Fri 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'Neutral Bay Public School',
    dayOfWeek: 'monday,tuesday,wednesday,thursday,friday',
    startTime: '15:00',
    endTime: '17:30',
    pricePerWeek: 54.99,
  },
  {
    name: 'Redlands School Mon-Fri 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'Redlands School',
    dayOfWeek: 'monday,tuesday,wednesday,thursday,friday',
    startTime: '15:00',
    endTime: '17:30',
    pricePerWeek: 54.99,
  },
  {
    name: 'St Marys Catholic School Wednesday 3:00pm-5:30pm',
    programType: 'school-pickup',
    location: 'St Marys Catholic School',
    dayOfWeek: 'wednesday',
    startTime: '15:00',
    endTime: '17:30',
    pricePerWeek: 54.99,
  },
]

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}

async function findExistingProduct(product: IgniteProduct): Promise<Stripe.Product | null> {
  const products = await stripe.products.search({
    query: `metadata['location']:'${product.location}' AND metadata['dayOfWeek']:'${product.dayOfWeek}' AND metadata['startTime']:'${product.startTime}'`,
    limit: 1,
  })
  return products.data[0] || null
}

async function createIgniteProduct(product: IgniteProduct): Promise<{ productId: string; priceId: string }> {
  const duration = calculateDurationMinutes(product.startTime, product.endTime)

  const metadata: Record<string, string> = {
    programType: product.programType,
    location: product.location,
    dayOfWeek: product.dayOfWeek,
    startTime: product.startTime,
    endTime: product.endTime,
    duration: duration.toString(),
    term: 'Term 1 2026',
  }

  if (product.address) {
    metadata.address = product.address
  }

  const stripeProduct = await stripe.products.create({
    name: `Ignite - ${product.name}`,
    description: `TinkerTank Ignite Program at ${product.location}`,
    metadata,
  })

  const price = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(product.pricePerWeek * 100),
    currency: 'aud',
    recurring: {
      interval: 'week',
    },
    metadata: {
      programType: product.programType,
      location: product.location,
    },
  })

  return {
    productId: stripeProduct.id,
    priceId: price.id,
  }
}

async function main() {
  console.log('🚀 Creating Term 1 Ignite products in Stripe...\n')

  const results: Array<{
    name: string
    productId: string
    priceId: string
    status: 'created' | 'exists'
  }> = []

  for (const product of igniteProducts) {
    try {
      const existing = await findExistingProduct(product)

      if (existing) {
        const prices = await stripe.prices.list({
          product: existing.id,
          active: true,
          limit: 1,
        })

        console.log(`⏭️  Already exists: ${product.name}`)
        console.log(`   Product ID: ${existing.id}`)
        console.log(`   Price ID: ${prices.data[0]?.id || 'N/A'}\n`)

        results.push({
          name: product.name,
          productId: existing.id,
          priceId: prices.data[0]?.id || '',
          status: 'exists',
        })
        continue
      }

      const { productId, priceId } = await createIgniteProduct(product)

      console.log(`✅ Created: ${product.name}`)
      console.log(`   Product ID: ${productId}`)
      console.log(`   Price ID: ${priceId}`)
      console.log(`   Price: $${product.pricePerWeek}/week\n`)

      results.push({
        name: product.name,
        productId,
        priceId,
        status: 'created',
      })
    } catch (error) {
      console.error(`❌ Failed: ${product.name}`)
      console.error(`   Error: ${error}\n`)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`Total products: ${igniteProducts.length}`)
  console.log(`Created: ${results.filter(r => r.status === 'created').length}`)
  console.log(`Already existed: ${results.filter(r => r.status === 'exists').length}`)

  console.log('\n📋 Product IDs for reference:')
  results.forEach(r => {
    console.log(`${r.name}:`)
    console.log(`  Product: ${r.productId}`)
    console.log(`  Price: ${r.priceId}`)
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })

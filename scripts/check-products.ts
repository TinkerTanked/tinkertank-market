/**
 * Check products in the database
 * Run with: npx tsx scripts/check-products.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking products in database...\n')

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })

  console.log(`Found ${products.length} products:\n`)

  for (const product of products) {
    console.log(`ID: ${product.id}`)
    console.log(`  Name: ${product.name}`)
    console.log(`  Type: ${product.type}`)
    console.log(`  Price: $${product.price}`)
    console.log(`  Active: ${product.isActive}`)
    console.log('')
  }

  // Check specifically for day-camp and all-day-camp
  console.log('---')
  console.log('Checking for expected camp IDs:')
  
  const dayCamp = await prisma.product.findUnique({ where: { id: 'day-camp' } })
  const allDayCamp = await prisma.product.findUnique({ where: { id: 'all-day-camp' } })

  if (dayCamp) {
    console.log(`✅ day-camp: Found (active: ${dayCamp.isActive})`)
  } else {
    console.log('❌ day-camp: NOT FOUND')
  }

  if (allDayCamp) {
    console.log(`✅ all-day-camp: Found (active: ${allDayCamp.isActive})`)
  } else {
    console.log('❌ all-day-camp: NOT FOUND')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

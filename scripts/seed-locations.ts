import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📍 Seeding locations...')

  const existingNeutralBay = await prisma.location.findFirst({
    where: { name: 'TinkerTank Neutral Bay' }
  })

  if (!existingNeutralBay) {
    await prisma.location.create({
      data: {
        name: 'TinkerTank Neutral Bay',
        address: '50 Yeo St, Neutral Bay, NSW, 2089',
        capacity: 20,
        timezone: 'Australia/Sydney',
      }
    })
    console.log('✅ Created: Neutral Bay')
  } else {
    console.log('✅ Location already exists: Neutral Bay')
  }

  const existingManly = await prisma.location.findFirst({
    where: { name: 'Manly Library' }
  })

  if (!existingManly) {
    await prisma.location.create({
      data: {
        name: 'Manly Library',
        address: 'Manly Library, Manly NSW 2095',
        capacity: 16,
        timezone: 'Australia/Sydney',
      }
    })
    console.log('✅ Created: Manly Library')
  } else {
    console.log('✅ Location already exists: Manly Library')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

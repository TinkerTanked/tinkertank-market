import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📍 Seeding locations...')

  const neutralBay = await prisma.location.upsert({
    where: { name: 'TinkerTank Neutral Bay' },
    update: {
      address: '50 Yeo St, Neutral Bay, NSW, 2089',
      capacity: 20,
      timezone: 'Australia/Sydney',
    },
    create: {
      name: 'TinkerTank Neutral Bay',
      address: '50 Yeo St, Neutral Bay, NSW, 2089',
      capacity: 20,
      timezone: 'Australia/Sydney',
    },
  })

  const manlyLibrary = await prisma.location.upsert({
    where: { name: 'Manly Library' },
    update: {
      address: 'Manly Library, Manly NSW 2095',
      capacity: 16,
      timezone: 'Australia/Sydney',
    },
    create: {
      name: 'Manly Library',
      address: 'Manly Library, Manly NSW 2095',
      capacity: 16,
      timezone: 'Australia/Sydney',
    },
  })

  console.log('✅ Locations created/updated:')
  console.log('  - Neutral Bay')
  console.log('  - Manly Library')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

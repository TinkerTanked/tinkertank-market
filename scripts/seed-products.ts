import { PrismaClient, ProductType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📦 Seeding products...')

  const products = [
    {
      id: 'day-camp',
      name: 'Day Camp',
      type: ProductType.CAMP,
      price: 109.99,
      duration: 360,
      description: 'Join us for an exciting day of coding, robotics, and tech adventures! Our day camps provide the perfect introduction to STEAM learning in a fun, engaging environment.',
      ageMin: 6,
      ageMax: 12,
      isActive: true,
    },
    {
      id: 'all-day-camp',
      name: 'All Day Camp',
      type: ProductType.CAMP,
      price: 149.99,
      duration: 480,
      description: 'Extended learning with our comprehensive all-day program! Includes everything from day camp plus additional project time, advanced challenges, and extended care.',
      ageMin: 6,
      ageMax: 12,
      isActive: true,
    },
    {
      id: 'battle-bots-party',
      name: 'Battle Bots Party',
      type: ProductType.BIRTHDAY,
      price: 450,
      duration: 120,
      description: 'Build, program, and battle with custom robots in this epic birthday celebration!',
      ageMin: 8,
      ageMax: 14,
      isActive: true,
    },
    {
      id: 'gamer-party',
      name: 'Gamer Party',
      type: ProductType.BIRTHDAY,
      price: 400,
      duration: 120,
      description: 'Level up your birthday with game design, coding challenges, and multiplayer tournaments!',
      ageMin: 8,
      ageMax: 14,
      isActive: true,
    },
    {
      id: '3d-design-party',
      name: '3D Design Party',
      type: ProductType.BIRTHDAY,
      price: 425,
      duration: 120,
      description: 'Design, create, and 3D print amazing projects in this innovative birthday experience!',
      ageMin: 8,
      ageMax: 14,
      isActive: true,
    },
  ]

  for (const productData of products) {
    const existing = await prisma.product.findUnique({ where: { id: productData.id } })
    
    if (!existing) {
      await prisma.product.create({ data: productData })
      console.log(`✅ Created: ${productData.name}`)
    } else {
      await prisma.product.update({
        where: { id: productData.id },
        data: productData
      })
      console.log(`✅ Updated: ${productData.name}`)
    }
  }

  console.log(`✅ Products seeded: ${products.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

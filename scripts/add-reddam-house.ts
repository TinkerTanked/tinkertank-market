import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function createReddamHouse() {
  const existing = await prisma.location.findFirst({
    where: { name: { contains: 'Reddam' } }
  })
  
  if (existing) {
    console.log('Reddam House already exists:', existing.id)
    return
  }
  
  const location = await prisma.location.create({
    data: {
      name: 'Reddam House',
      address: 'Reddam House Sydney, NSW',
      capacity: 20,
      timezone: 'Australia/Sydney',
      isActive: true
    }
  })
  
  console.log('Created Reddam House location:', location.id)
  await prisma.$disconnect()
}

createReddamHouse()

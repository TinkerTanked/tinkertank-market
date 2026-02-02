import { prisma } from '../src/lib/prisma'

async function main() {
  const events = await prisma.event.findMany({
    where: { title: { contains: 'Balgowlah' } },
    select: { id: true, title: true, startDateTime: true, status: true },
    take: 10
  })
  console.log('Balgowlah events:', JSON.stringify(events, null, 2))
  
  const allEvents = await prisma.event.findMany({
    select: { id: true, title: true, startDateTime: true },
    orderBy: { startDateTime: 'desc' },
    take: 20
  })
  console.log('\nAll events (first 20):', JSON.stringify(allEvents, null, 2))
  
  const templates = await prisma.recurringTemplate.findMany({
    select: { id: true, name: true, startDate: true, endDate: true },
    take: 10
  })
  console.log('\nRecurring templates:', JSON.stringify(templates, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())

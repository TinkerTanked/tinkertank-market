import { PrismaClient } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';

const prisma = new PrismaClient();
const TZ = 'Australia/Sydney';

async function diagnose() {
  const events = await prisma.event.findMany({
    where: {
      type: 'CAMP',
      startDateTime: {
        gte: new Date('2026-01-05T00:00:00Z'),
        lte: new Date('2026-01-10T00:00:00Z'),
      }
    },
    include: {
      bookings: {
        include: {
          product: true,
          student: true,
        }
      }
    },
    orderBy: {
      startDateTime: 'asc'
    },
    take: 5
  });

  console.log('\n📊 Sample Camp Events Diagnosis\n');
  console.log('='.repeat(100));

  for (const event of events) {
    console.log(`\nEvent: ${event.title}`);
    console.log(`ID: ${event.id}`);
    console.log(`\nStored in DB (UTC):`);
    console.log(`  startDateTime: ${event.startDateTime.toISOString()}`);
    console.log(`  endDateTime:   ${event.endDateTime.toISOString()}`);
    
    console.log(`\nDisplayed in Sydney Time:`);
    console.log(`  start: ${formatInTimeZone(event.startDateTime, TZ, 'yyyy-MM-dd HH:mm:ss OOOO')}`);
    console.log(`  end:   ${formatInTimeZone(event.endDateTime, TZ, 'yyyy-MM-dd HH:mm:ss OOOO')}`);
    
    console.log(`\nWhat FullCalendar receives (ISO strings):`);
    console.log(`  start: "${event.startDateTime.toISOString()}"`);
    console.log(`  end:   "${event.endDateTime.toISOString()}"`);
    
    console.log(`\nDay key in Sydney timezone:`);
    console.log(`  ${event.startDateTime.toLocaleDateString('en-CA', { timeZone: TZ })}`);
    
    const spansDays = event.startDateTime.toLocaleDateString('en-CA', { timeZone: TZ }) !== 
                      event.endDateTime.toLocaleDateString('en-CA', { timeZone: TZ });
    
    if (spansDays) {
      console.log(`\n⚠️  WARNING: This event spans multiple days!`);
      console.log(`  Start day: ${event.startDateTime.toLocaleDateString('en-CA', { timeZone: TZ })}`);
      console.log(`  End day:   ${event.endDateTime.toLocaleDateString('en-CA', { timeZone: TZ })}`);
    }
    
    console.log('\n' + '-'.repeat(100));
  }
}

diagnose().finally(() => prisma.$disconnect());

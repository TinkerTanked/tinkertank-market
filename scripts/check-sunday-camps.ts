import { PrismaClient } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';

const prisma = new PrismaClient();
const TZ = 'Australia/Sydney';

async function checkSundayCamps() {
  console.log('\n🔍 Looking for camps that might appear on Sunday...\n');
  
  // Get camps from early January 2026
  const events = await prisma.event.findMany({
    where: {
      type: 'CAMP',
      startDateTime: {
        gte: new Date('2026-01-04T00:00:00Z'),
        lte: new Date('2026-01-08T00:00:00Z'),
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
    }
  });

  for (const event of events) {
    const startSydney = new Date(event.startDateTime.toLocaleString('en-US', { timeZone: TZ }));
    const dayOfWeek = startSydney.getDay(); // 0=Sunday, 1=Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const dateKey = event.startDateTime.toLocaleDateString('en-CA', { timeZone: TZ });
    const utcDateKey = event.startDateTime.toISOString().split('T')[0];
    
    console.log(`Event: ${event.title}`);
    console.log(`  UTC stored:     ${event.startDateTime.toISOString()}`);
    console.log(`  Sydney time:    ${formatInTimeZone(event.startDateTime, TZ, 'yyyy-MM-dd HH:mm:ss EEEE')}`);
    console.log(`  UTC date key:   ${utcDateKey} (${dayNames[new Date(utcDateKey).getUTCDay()]})`);
    console.log(`  Sydney date key: ${dateKey} (${dayNames[new Date(dateKey + 'T00:00:00').getDay()]})`);
    console.log(`  API sends:      { start: "${dateKey}", allDay: true }`);
    
    if (dayOfWeek === 0) {
      console.log(`  ⚠️  WARNING: This is on a SUNDAY in Sydney time - camps shouldn't be on weekends!`);
    }
    
    console.log('');
  }
}

checkSundayCamps().finally(() => prisma.$disconnect());

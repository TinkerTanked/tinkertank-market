import { PrismaClient } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';

const prisma = new PrismaClient();
const TZ = 'Australia/Sydney';

async function checkManlyCamps() {
  const manlyLocation = await prisma.location.findFirst({
    where: {
      name: {
        contains: 'Manly',
        mode: 'insensitive'
      }
    }
  });

  if (!manlyLocation) {
    console.log('❌ Manly Library location not found');
    return;
  }

  console.log(`Found location: ${manlyLocation.name} (${manlyLocation.id})\n`);

  const events = await prisma.event.findMany({
    where: {
      locationId: manlyLocation.id,
      type: 'CAMP',
      startDateTime: {
        gte: new Date('2026-01-01T00:00:00Z'),
        lte: new Date('2026-02-01T00:00:00Z'),
      }
    },
    include: {
      bookings: {
        include: {
          student: true,
          product: true,
        }
      }
    },
    orderBy: {
      startDateTime: 'asc'
    }
  });

  console.log(`Found ${events.length} camp events at Manly Library in January:\n`);

  for (const event of events) {
    const sydneyDate = formatInTimeZone(event.startDateTime, TZ, 'yyyy-MM-dd HH:mm EEEE');
    console.log(`Event: ${event.id}`);
    console.log(`  Title: ${event.title}`);
    console.log(`  Date: ${sydneyDate}`);
    console.log(`  Students: ${event.bookings.length}`);
    console.log('');
  }

  const bookings = await prisma.booking.findMany({
    where: {
      locationId: manlyLocation.id,
      product: {
        type: 'CAMP'
      },
      startDate: {
        gte: new Date('2026-01-01T00:00:00Z'),
        lte: new Date('2026-02-01T00:00:00Z'),
      }
    },
    include: {
      student: true,
      product: true,
      event: true,
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  console.log(`\nFound ${bookings.length} camp bookings at Manly Library in January:\n`);

  for (const booking of bookings) {
    const sydneyDate = formatInTimeZone(booking.startDate, TZ, 'yyyy-MM-dd HH:mm EEEE');
    console.log(`Booking: ${booking.id}`);
    console.log(`  Student: ${booking.student.name}`);
    console.log(`  Product: ${booking.product.name}`);
    console.log(`  Date: ${sydneyDate}`);
    console.log(`  Event: ${booking.eventId || 'NO EVENT'}`);
    console.log('');
  }

  console.log('\nShould be:');
  console.log('- Jan 13, 14, 15: Day camp 9am-3pm');
  console.log('- Jan 20, 21, 22: Day camp 9am-3pm');
}

checkManlyCamps().finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';

const prisma = new PrismaClient();
const TZ = 'Australia/Sydney';

async function checkAPIResponse() {
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
    take: 10
  });

  console.log('\n📊 Checking what API will return\n');
  console.log('='.repeat(100));

  for (const event of events) {
    const dateKey = event.startDateTime.toLocaleDateString('en-CA', { timeZone: TZ });
    const startSydney = formatInTimeZone(event.startDateTime, TZ, 'yyyy-MM-dd HH:mm:ss');
    const endSydney = formatInTimeZone(event.endDateTime, TZ, 'yyyy-MM-dd HH:mm:ss');
    
    console.log(`\nEvent: ${event.title}`);
    console.log(`Database UTC: ${event.startDateTime.toISOString()} → ${event.endDateTime.toISOString()}`);
    console.log(`Sydney Time:  ${startSydney} → ${endSydney}`);
    console.log(`API will send: { start: "${dateKey}", allDay: true }`);
    
    if (event.bookings.length > 0) {
      const booking = event.bookings[0];
      const bookingDateSydney = formatInTimeZone(booking.startDate, TZ, 'yyyy-MM-dd HH:mm:ss');
      console.log(`Original booking date: ${bookingDateSydney}`);
    }
    
    console.log('-'.repeat(100));
  }

  // Now check what the orderItems say
  console.log('\n\n📋 Checking original order items:\n');
  console.log('='.repeat(100));

  const orders = await prisma.order.findMany({
    where: {
      status: 'PAID',
    },
    include: {
      orderItems: {
        where: {
          product: {
            type: 'CAMP'
          }
        },
        include: {
          product: true,
          student: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  for (const order of orders) {
    if (order.orderItems.length === 0) continue;
    
    console.log(`\nOrder: ${order.id} - ${order.customerName}`);
    for (const item of order.orderItems) {
      const bookingDateSydney = formatInTimeZone(item.bookingDate, TZ, 'yyyy-MM-dd HH:mm:ss');
      console.log(`  OrderItem: ${item.product.name} on ${bookingDateSydney} for ${item.student.name}`);
    }
  }
}

checkAPIResponse().finally(() => prisma.$disconnect());

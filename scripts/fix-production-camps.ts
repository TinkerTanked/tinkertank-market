import { PrismaClient } from '@prisma/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const prodDatabaseUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!prodDatabaseUrl) {
  console.error('❌ PRODUCTION_DATABASE_URL not set');
  console.error('Set it with: export PRODUCTION_DATABASE_URL="your-prod-db-url"');
  process.exit(1);
}

console.log('⚠️  WARNING: This will modify PRODUCTION database');
console.log('Database:', prodDatabaseUrl.split('@')[1]?.split('/')[0] || 'unknown');
console.log('\nThis script will:');
console.log('1. Delete all existing camp bookings and events');
console.log('2. Recreate them with correct Australia/Sydney timezone handling\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Type "DELETE AND RECREATE" to continue: ', async (answer: string) => {
  readline.close();
  
  if (answer !== 'DELETE AND RECREATE') {
    console.log('❌ Aborted');
    process.exit(0);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: prodDatabaseUrl
      }
    }
  });

  const TZ = 'Australia/Sydney';

  try {
    console.log('\n🗑️  Step 1: Deleting existing camp events and bookings...\n');

    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        product: {
          type: 'CAMP'
        }
      }
    });

    console.log(`Deleted ${deletedBookings.count} camp bookings`);

    const deletedEvents = await prisma.event.deleteMany({
      where: {
        type: 'CAMP'
      }
    });

    console.log(`Deleted ${deletedEvents.count} camp events\n`);

    console.log('✅ Cleanup complete!\n');
    console.log('🔧 Step 2: Recreating camps with correct timezones...\n');

    const orders = await prisma.order.findMany({
      where: {
        status: 'PAID',
      },
      include: {
        orderItems: {
          include: {
            product: true,
            student: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Processing ${orders.length} paid orders...\n`);

    let bookingsCreated = 0;
    let eventsCreated = 0;
    let eventsLinked = 0;

    for (const order of orders) {
      const campItems = order.orderItems.filter(item => item.product.type === 'CAMP');
      
      if (campItems.length > 0) {
        console.log(`📅 Order: ${order.id} - ${order.customerName}`);
        
        for (const item of campItems) {
          const dateStr = format(item.bookingDate, 'yyyy-MM-dd');
          
          const startOfDay = new Date(`${dateStr}T00:00:00`);
          const endOfDay = new Date(`${dateStr}T23:59:59.999`);
          const startOfDayUtc = fromZonedTime(startOfDay, TZ);
          const endOfDayUtc = fromZonedTime(endOfDay, TZ);

          let booking = await prisma.booking.findFirst({
            where: {
              studentId: item.studentId,
              startDate: {
                gte: startOfDayUtc,
                lt: endOfDayUtc,
              },
            },
            include: {
              event: true,
              location: true,
            },
          });

          console.log(`   ├─ ${dateStr} - ${item.product.name} - ${item.student.name}`);

          if (!booking) {
            const location = await prisma.location.findFirst({
              where: { isActive: true },
            });

            if (!location) {
              console.log(`   │  ❌ No active location found`);
              continue;
            }

            const isFullDay = item.product.name.includes('Full Day');
            const startTime = new Date(`${dateStr}T09:00:00`);
            const endTime = new Date(`${dateStr}T${isFullDay ? '15:00:00' : '12:00:00'}`);
            const startDateTime = fromZonedTime(startTime, TZ);
            const endDateTime = fromZonedTime(endTime, TZ);

            booking = await prisma.booking.create({
              data: {
                studentId: item.studentId,
                productId: item.productId,
                locationId: location.id,
                startDate: startDateTime,
                endDate: endDateTime,
                status: 'CONFIRMED',
                totalPrice: item.price,
              },
              include: {
                event: true,
                location: true,
              },
            });

            console.log(`   │  ✅ Created booking: ${booking.id}`);
            bookingsCreated++;
          } else {
            console.log(`   │  ✓ Booking exists: ${booking.id}`);
          }

          if (!booking.eventId) {
            const existingEvent = await prisma.event.findFirst({
              where: {
                startDateTime: {
                  gte: startOfDayUtc,
                  lt: endOfDayUtc,
                },
                locationId: booking.locationId,
                type: 'CAMP',
              },
            });

            if (existingEvent) {
              await prisma.booking.update({
                where: { id: booking.id },
                data: { eventId: existingEvent.id },
              });

              await prisma.event.update({
                where: { id: existingEvent.id },
                data: { currentCount: { increment: 1 } },
              });

              console.log(`   │  ✅ Linked to existing event: ${existingEvent.id}`);
              eventsLinked++;
            } else {
              const newEvent = await prisma.event.create({
                data: {
                  title: item.product.name,
                  description: item.product.description,
                  type: 'CAMP',
                  status: 'SCHEDULED',
                  startDateTime: booking.startDate,
                  endDateTime: booking.endDate,
                  locationId: booking.locationId,
                  maxCapacity: 10,
                  currentCount: 1,
                  ageMin: item.product.ageMin,
                  ageMax: item.product.ageMax,
                },
              });

              await prisma.booking.update({
                where: { id: booking.id },
                data: { eventId: newEvent.id },
              });

              console.log(`   │  ✅ Created new event: ${newEvent.id}`);
              eventsCreated++;
            }
          } else {
            console.log(`   │  ✓ Event already linked: ${booking.eventId}`);
          }
        }
      }
    }

    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`PRODUCTION UPDATE SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Bookings created: ${bookingsCreated}`);
    console.log(`Events created: ${eventsCreated}`);
    console.log(`Events linked: ${eventsLinked}`);
    console.log(`\n✅ Production camps fixed with correct timezones!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
});

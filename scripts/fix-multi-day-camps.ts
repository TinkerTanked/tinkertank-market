import { PrismaClient } from '@prisma/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const prisma = new PrismaClient();
const TZ = 'Australia/Sydney';

async function fixMultiDayCamps() {
  try {
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

    console.log(`Checking ${orders.length} paid orders...\n`);

    let bookingsCreated = 0;
    let eventsCreated = 0;
    let eventsLinked = 0;

    for (const order of orders) {
      const campItems = order.orderItems.filter(item => item.product.type === 'CAMP');
      
      if (campItems.length > 1) {
        console.log(`\n📅 Processing multi-day order: ${order.id}`);
        console.log(`   Customer: ${order.customerName} (${order.customerEmail})`);
        
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
    console.log(`SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Bookings created: ${bookingsCreated}`);
    console.log(`Events created: ${eventsCreated}`);
    console.log(`Events linked: ${eventsLinked}`);
    console.log(`\n✅ All multi-day camps fixed!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMultiDayCamps();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAndRecreate() {
  try {
    console.log('🗑️  Deleting all existing camp bookings and events...\n');

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

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAndRecreate();

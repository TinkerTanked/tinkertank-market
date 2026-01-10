import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findBooking() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-12-30T00:00:00Z'),
          lt: new Date('2026-01-03T00:00:00Z'),
        },
        totalAmount: 219.98,
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

    console.log(`Found ${orders.length} orders for $219.98 between Dec 30 - Jan 3:\n`);

    for (const order of orders) {
      const dates = order.orderItems.map(item => item.bookingDate.toLocaleDateString());
      const hasDec31 = order.orderItems.some(item => 
        item.bookingDate >= new Date('2025-12-31T00:00:00Z') && 
        item.bookingDate < new Date('2026-01-01T00:00:00Z')
      );
      const hasJan2 = order.orderItems.some(item => 
        item.bookingDate >= new Date('2026-01-02T00:00:00Z') && 
        item.bookingDate < new Date('2026-01-03T00:00:00Z')
      );

      if (hasDec31 && hasJan2 && order.orderItems.length === 2) {
        console.log('🎯 MATCH FOUND!');
      }

      console.log(`Order ID: ${order.id}`);
      console.log(`Email: ${order.customerEmail}`);
      console.log(`Name: ${order.customerName}`);
      console.log(`Total: $${Number(order.totalAmount).toFixed(2)}`);
      console.log(`Status: ${order.status}`);
      console.log(`Stripe Payment Intent: ${order.stripePaymentIntentId || 'N/A'}`);
      console.log(`Created: ${order.createdAt.toLocaleString()}`);
      console.log(`Booking Dates: ${dates.join(', ')}`);
      console.log(`Items:`);
      for (const item of order.orderItems) {
        console.log(`  - ${item.product.name} on ${item.bookingDate.toLocaleDateString()} for ${item.student.name} - $${Number(item.price).toFixed(2)}`);
      }
      console.log('='.repeat(80) + '\n');
    }



  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findBooking();

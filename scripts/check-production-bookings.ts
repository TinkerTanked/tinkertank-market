import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="..." npx tsx scripts/check-production-bookings.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function checkBookings() {
  try {
    console.log('🔍 Checking production bookings...\n');

    // Get recent bookings with all relevant data
    const bookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: true,
        product: true,
        location: true,
        event: true,
      },
    });

    console.log(`📅 Last 10 Bookings:\n`);
    bookings.forEach((booking, idx) => {
      console.log(`${idx + 1}. Booking ID: ${booking.id}`);
      console.log(`   Student: ${booking.student.name}`);
      console.log(`   Product: ${booking.product.name} (${booking.product.type})`);
      console.log(`   Location: ${booking.location.name}`);
      console.log(`   Start Date: ${booking.startDate.toISOString()}`);
      console.log(`   End Date: ${booking.endDate.toISOString()}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Created: ${booking.createdAt.toISOString()}`);
      if (booking.event) {
        console.log(`   Event: ${booking.event.title}`);
        console.log(`   Event Start: ${booking.event.startDateTime.toISOString()}`);
        console.log(`   Event End: ${booking.event.endDateTime.toISOString()}`);
      }
      console.log('');
    });

    // Get recent order items to compare bookingDate
    const orderItems = await prisma.orderItem.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        product: true,
        student: true,
      },
    });

    console.log(`\n💳 Last 10 Order Items:\n`);
    orderItems.forEach((item, idx) => {
      console.log(`${idx + 1}. Order Item ID: ${item.id}`);
      console.log(`   Order: ${item.orderId} (${item.order.status})`);
      console.log(`   Customer: ${item.order.customerName}`);
      console.log(`   Student: ${item.student.name}`);
      console.log(`   Product: ${item.product.name}`);
      console.log(`   Booking Date: ${item.bookingDate.toISOString()}`);
      console.log(`   Created: ${item.createdAt.toISOString()}`);
      console.log('');
    });

    // Cross-reference: Find bookings and their corresponding order items
    console.log(`\n🔗 Cross-Reference (Recent Paid Orders):\n`);
    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: true,
            student: true,
          },
        },
      },
    });

    for (const order of paidOrders) {
      console.log(`Order ${order.id} - ${order.customerName}`);
      console.log(`Created: ${order.createdAt.toISOString()}`);
      
      for (const item of order.orderItems) {
        console.log(`  Item: ${item.product.name} for ${item.student.name}`);
        console.log(`  Order Item bookingDate: ${item.bookingDate.toISOString()}`);
        
        // Find corresponding booking
        const correspondingBooking = await prisma.booking.findFirst({
          where: {
            studentId: item.studentId,
            productId: item.productId,
            createdAt: {
              gte: new Date(order.createdAt.getTime() - 5000), // Within 5 seconds
              lte: new Date(order.createdAt.getTime() + 5000),
            },
          },
          include: {
            event: true,
          },
        });

        if (correspondingBooking) {
          console.log(`  ✓ Found Booking ${correspondingBooking.id}`);
          console.log(`    Booking startDate: ${correspondingBooking.startDate.toISOString()}`);
          console.log(`    Booking endDate: ${correspondingBooking.endDate.toISOString()}`);
          if (correspondingBooking.event) {
            console.log(`    Event startDateTime: ${correspondingBooking.event.startDateTime.toISOString()}`);
            console.log(`    Event endDateTime: ${correspondingBooking.event.endDateTime.toISOString()}`);
          }
          
          // Check if dates match
          const orderItemDate = item.bookingDate.toISOString().split('T')[0];
          const bookingStartDate = correspondingBooking.startDate.toISOString().split('T')[0];
          const eventStartDate = correspondingBooking.event?.startDateTime.toISOString().split('T')[0];
          
          console.log(`    📊 Date Comparison:`);
          console.log(`       OrderItem.bookingDate: ${orderItemDate}`);
          console.log(`       Booking.startDate:     ${bookingStartDate}`);
          if (eventStartDate) {
            console.log(`       Event.startDateTime:   ${eventStartDate}`);
          }
          
          if (orderItemDate !== bookingStartDate) {
            console.log(`    ⚠️  MISMATCH: OrderItem date ≠ Booking startDate`);
          }
          if (eventStartDate && orderItemDate !== eventStartDate) {
            console.log(`    ⚠️  MISMATCH: OrderItem date ≠ Event startDateTime`);
          }
        } else {
          console.log(`  ❌ No corresponding booking found`);
        }
      }
      console.log('');
    }

    // Summary statistics
    const totalBookings = await prisma.booking.count();
    const totalOrders = await prisma.order.count();
    const paidOrdersCount = await prisma.order.count({ where: { status: 'PAID' } });
    
    console.log(`\n📊 Summary:`);
    console.log(`Total Bookings: ${totalBookings}`);
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Paid Orders: ${paidOrdersCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();

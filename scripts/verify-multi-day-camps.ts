import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMultiDayCamps() {
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

    const issues: any[] = [];
    const multiDayOrders: any[] = [];

    for (const order of orders) {
      const campItems = order.orderItems.filter(item => item.product.type === 'CAMP');
      
      if (campItems.length > 1) {
        multiDayOrders.push(order);
        
        const dates = campItems.map(item => item.bookingDate);
        const studentIds = [...new Set(campItems.map(item => item.studentId))];
        
        console.log(`\n📅 Multi-day camp order: ${order.id}`);
        console.log(`   Customer: ${order.customerName} (${order.customerEmail})`);
        console.log(`   Total: $${Number(order.totalAmount).toFixed(2)}`);
        console.log(`   Created: ${order.createdAt.toLocaleDateString()}`);
        console.log(`   Days: ${campItems.length}`);
        console.log(`   Students: ${studentIds.length}`);
        
        for (const item of campItems) {
          const bookings = await prisma.booking.findMany({
            where: {
              studentId: item.studentId,
              startDate: {
                gte: new Date(item.bookingDate.setHours(0, 0, 0, 0)),
                lt: new Date(item.bookingDate.setHours(23, 59, 59, 999)),
              },
            },
            include: {
              event: true,
              product: true,
              student: true,
            },
          });

          console.log(`   ├─ ${item.bookingDate.toLocaleDateString()} - ${item.product.name} - ${item.student.name}`);
          
          if (bookings.length === 0) {
            console.log(`   │  ❌ NO BOOKING FOUND IN DATABASE`);
            issues.push({
              orderId: order.id,
              email: order.customerEmail,
              date: item.bookingDate,
              product: item.product.name,
              student: item.student.name,
              issue: 'No booking in database',
            });
          } else {
            const booking = bookings[0];
            console.log(`   │  ✓ Booking: ${booking.id} (${booking.status})`);
            
            if (booking.eventId) {
              console.log(`   │  ✓ Event: ${booking.event?.title || booking.eventId}`);
            } else {
              console.log(`   │  ⚠️  No event linked`);
              issues.push({
                orderId: order.id,
                email: order.customerEmail,
                date: item.bookingDate,
                product: item.product.name,
                student: item.student.name,
                issue: 'No event linked to booking',
              });
            }
          }
        }
      }
    }

    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total paid orders: ${orders.length}`);
    console.log(`Multi-day camp orders: ${multiDayOrders.length}`);
    console.log(`Issues found: ${issues.length}`);

    if (issues.length > 0) {
      console.log(`\n❌ ISSUES FOUND:\n`);
      for (const issue of issues) {
        console.log(`Order: ${issue.orderId}`);
        console.log(`Customer: ${issue.email}`);
        console.log(`Date: ${issue.date.toLocaleDateString()}`);
        console.log(`Student: ${issue.student}`);
        console.log(`Issue: ${issue.issue}`);
        console.log('');
      }
    } else {
      console.log(`\n✅ All multi-day camp bookings are in the calendar!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMultiDayCamps();

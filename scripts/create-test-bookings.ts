import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEUTRAL_BAY_ID = 'cmhjpww280000sowls6srtcn1'; // TinkerTank Neutral Bay

async function main() {
  const args = process.argv.slice(2);
  const date = args[0]; // Format: YYYY-MM-DD
  const count = parseInt(args[1] || '40');
  const dayName = args[2] || 'Day';

  console.log(`Creating ${count} camp bookings for ${dayName} (${date})...`);

  // Find a camp product
  const camp = await prisma.product.findFirst({
    where: { type: 'CAMP', isActive: true },
  });

  if (!camp) {
    console.error('No active camp product found!');
    process.exit(1);
  }

  console.log(`Using camp: ${camp.name}`);

  const bookingDate = new Date(date + 'T09:00:00Z');
  const students = [];
  const orders = [];
  const bookings = [];

  for (let i = 1; i <= count; i++) {
    const studentName = `Test Student ${dayName}-${i}`;
    const parentEmail = `parent.${dayName.toLowerCase()}.${i}@test.tinkertank.academy`;

    // Create student
    const student = await prisma.student.create({
      data: {
        name: studentName,
        birthdate: new Date('2015-01-15'),
        allergies: i % 5 === 0 ? 'None' : null,
      },
    });

    students.push(student);

    // Create order
    const order = await prisma.order.create({
      data: {
        customerName: `Parent of ${studentName}`,
        customerEmail: parentEmail,
        totalAmount: camp.price,
        status: 'PAID',
        stripePaymentIntentId: `pi_test_${dayName.toLowerCase()}_${i}_${Date.now()}`,
        orderItems: {
          create: {
            productId: camp.id,
            studentId: student.id,
            bookingDate,
            price: camp.price,
          },
        },
      },
    });

    orders.push(order);

    // Create booking
    const endDate = new Date(bookingDate);
    endDate.setHours(endDate.getHours() + (camp.duration || 8));

    const booking = await prisma.booking.create({
      data: {
        studentId: student.id,
        productId: camp.id,
        locationId: NEUTRAL_BAY_ID,
        startDate: bookingDate,
        endDate,
        status: 'CONFIRMED',
        totalPrice: camp.price,
        notes: `Test booking for ${dayName}`,
      },
    });

    bookings.push(booking);

    if (i % 10 === 0) {
      console.log(`  Created ${i}/${count} bookings...`);
    }
  }

  console.log(`✅ Successfully created ${count} bookings for ${dayName} (${date})`);
  console.log(`   Students: ${students.length}`);
  console.log(`   Orders: ${orders.length}`);
  console.log(`   Bookings: ${bookings.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

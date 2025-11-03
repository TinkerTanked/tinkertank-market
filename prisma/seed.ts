import { PrismaClient, ProductType, BookingStatus, OrderStatus, EventType, EventStatus } from '@prisma/client'
import { addDays, addWeeks, setHours, setMinutes } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.event.deleteMany()
  await prisma.recurringTemplate.deleteMany()
  await prisma.student.deleteMany()
  await prisma.product.deleteMany()
  await prisma.location.deleteMany()

  console.log('🧹 Cleaned existing data')

  // Create Neutral Bay location
  const neutralBay = await prisma.location.create({
    data: {
      name: 'TinkerTank Neutral Bay',
      address: '123 Military Road, Neutral Bay NSW 2089',
      capacity: 20,
      timezone: 'Australia/Sydney',
    },
  })
  console.log('📍 Created location: Neutral Bay')

  // Create comprehensive product catalog
  const products = [
    // Day Camps (Full Day)
    {
      name: 'Robotics Mastery Full Day',
      type: ProductType.CAMP,
      price: 85.00,
      duration: 480, // 8 hours
      description: 'Advanced robotics with LEGO Mindstorms, programming challenges, and competitions. Includes lunch.',
      ageMin: 8,
      ageMax: 14,
    },
    {
      name: 'Young Engineers Full Day',
      type: ProductType.CAMP,
      price: 80.00,
      duration: 480,
      description: 'Engineering fundamentals with building challenges, simple machines, and design thinking.',
      ageMin: 6,
      ageMax: 10,
    },
    {
      name: 'Game Design Studio Full Day',
      type: ProductType.CAMP,
      price: 85.00,
      duration: 480,
      description: 'Create your own video games using Scratch and Unity. Lunch included.',
      ageMin: 9,
      ageMax: 15,
    },
    {
      name: '3D Printing Workshop Full Day',
      type: ProductType.CAMP,
      price: 90.00,
      duration: 480,
      description: 'Design and print your own 3D models using CAD software and professional printers.',
      ageMin: 10,
      ageMax: 16,
    },
    
    // Half Day Camps
    {
      name: 'Coding Adventures Half-Day',
      type: ProductType.CAMP,
      price: 55.00,
      duration: 240, // 4 hours
      description: 'Introduction to coding with Scratch, Python basics, and fun programming games.',
      ageMin: 6,
      ageMax: 12,
    },
    {
      name: 'Minecraft Engineering Half-Day',
      type: ProductType.CAMP,
      price: 50.00,
      duration: 240,
      description: 'Build amazing structures and learn engineering concepts in Minecraft Education.',
      ageMin: 7,
      ageMax: 13,
    },
    {
      name: 'Electronics & Circuits Half-Day',
      type: ProductType.CAMP,
      price: 60.00,
      duration: 240,
      description: 'Hands-on electronics with Arduino, LEDs, sensors, and circuit building.',
      ageMin: 8,
      ageMax: 14,
    },
    
    // Birthday Parties
    {
      name: 'Robotics Birthday Party',
      type: ProductType.BIRTHDAY,
      price: 350.00,
      duration: 120, // 2 hours
      description: 'Epic robotics birthday party with competitions, prizes, and robot battles for up to 12 kids.',
      ageMin: 6,
      ageMax: 14,
    },
    {
      name: 'Coding Birthday Bash',
      type: ProductType.BIRTHDAY,
      price: 320.00,
      duration: 120,
      description: 'Interactive coding games, challenges, and creative projects for the birthday child and friends.',
      ageMin: 6,
      ageMax: 12,
    },
    {
      name: 'Minecraft Party Adventure',
      type: ProductType.BIRTHDAY,
      price: 300.00,
      duration: 120,
      description: 'Build, explore, and create in Minecraft with party games and competitions.',
      ageMin: 6,
      ageMax: 13,
    },
    {
      name: 'Engineering Challenge Party',
      type: ProductType.BIRTHDAY,
      price: 330.00,
      duration: 120,
      description: 'Team-based engineering challenges with building materials and design competitions.',
      ageMin: 7,
      ageMax: 14,
    },
    
    // Subscription Programs
    {
      name: 'Ignite Weekly Sessions',
      type: ProductType.SUBSCRIPTION,
      price: 120.00,
      duration: 4, // 4 weeks/month
      description: 'Weekly 90-minute sessions covering robotics, coding, and engineering with progressive skill building.',
      ageMin: 8,
      ageMax: 16,
    },
    {
      name: 'Junior Makers Monthly',
      type: ProductType.SUBSCRIPTION,
      price: 80.00,
      duration: 2, // 2 sessions per month
      description: 'Bi-weekly maker sessions for younger children with hands-on projects and creativity.',
      ageMin: 5,
      ageMax: 9,
    },
    {
      name: 'Advanced Robotics Club',
      type: ProductType.SUBSCRIPTION,
      price: 150.00,
      duration: 4,
      description: 'Intensive weekly robotics program with competition preparation and advanced programming.',
      ageMin: 10,
      ageMax: 16,
    },
  ]

  const createdProducts = []
  for (const product of products) {
    const created = await prisma.product.create({
      data: product,
    })
    createdProducts.push(created)
  }
  console.log(`🎯 Created ${createdProducts.length} products`)

  // Create realistic student dataset
  const studentData = [
    { name: 'Alex Johnson', birthdate: new Date('2012-03-15'), allergies: 'Peanuts' },
    { name: 'Emma Chen', birthdate: new Date('2014-08-22'), allergies: null },
    { name: 'Oliver Smith', birthdate: new Date('2011-11-08'), allergies: 'Dairy, Eggs' },
    { name: 'Sophia Williams', birthdate: new Date('2013-06-12'), allergies: null },
    { name: 'Liam Brown', birthdate: new Date('2015-01-30'), allergies: 'Shellfish' },
    { name: 'Ava Davis', birthdate: new Date('2012-09-18'), allergies: null },
    { name: 'Noah Miller', birthdate: new Date('2010-12-03'), allergies: 'Gluten' },
    { name: 'Isabella Wilson', birthdate: new Date('2013-04-25'), allergies: null },
    { name: 'Mason Taylor', birthdate: new Date('2014-07-14'), allergies: 'Tree nuts' },
    { name: 'Charlotte Anderson', birthdate: new Date('2011-10-20'), allergies: null },
    { name: 'Ethan Thomas', birthdate: new Date('2012-02-28'), allergies: 'Soy' },
    { name: 'Amelia Jackson', birthdate: new Date('2015-05-16'), allergies: null },
    { name: 'Lucas White', birthdate: new Date('2013-12-09'), allergies: 'Latex' },
    { name: 'Harper Harris', birthdate: new Date('2014-03-07'), allergies: null },
    { name: 'Benjamin Martin', birthdate: new Date('2011-08-11'), allergies: 'Fish' },
    { name: 'Evelyn Thompson', birthdate: new Date('2012-06-23'), allergies: null },
    { name: 'James Garcia', birthdate: new Date('2010-04-05'), allergies: 'Sesame' },
    { name: 'Abigail Martinez', birthdate: new Date('2015-09-12'), allergies: null },
    { name: 'William Robinson', birthdate: new Date('2013-01-19'), allergies: 'Milk' },
    { name: 'Emily Clark', birthdate: new Date('2014-11-26'), allergies: null },
    { name: 'Michael Rodriguez', birthdate: new Date('2011-07-04'), allergies: 'Eggs' },
    { name: 'Elizabeth Lewis', birthdate: new Date('2012-10-17'), allergies: null },
    { name: 'David Lee', birthdate: new Date('2015-02-14'), allergies: 'Peanuts, Tree nuts' },
    { name: 'Mia Walker', birthdate: new Date('2013-05-08'), allergies: null },
    { name: 'Daniel Hall', birthdate: new Date('2010-09-21'), allergies: 'Shellfish' },
  ]

  const createdStudents = []
  for (const student of studentData) {
    const created = await prisma.student.create({
      data: student,
    })
    createdStudents.push(created)
  }
  console.log(`👥 Created ${createdStudents.length} students`)

  // Create recurring templates for subscription programs
  const igniteProduct = createdProducts.find(p => p.name === 'Ignite Weekly Sessions')
  const juniorMakersProduct = createdProducts.find(p => p.name === 'Junior Makers Monthly')
  const advancedRoboticsProduct = createdProducts.find(p => p.name === 'Advanced Robotics Club')

  const recurringTemplates = []
  
  if (igniteProduct) {
    const igniteTemplate = await prisma.recurringTemplate.create({
      data: {
        name: 'Ignite Weekly Sessions',
        description: 'Weekly robotics and coding sessions',
        type: EventType.SUBSCRIPTION,
        startTime: '16:00',
        endTime: '17:30',
        duration: 90,
        daysOfWeek: [6], // Saturday
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-08-31'),
        maxCapacity: 12,
        locationId: neutralBay.id,
        ageMin: 8,
        ageMax: 16,
      },
    })
    recurringTemplates.push(igniteTemplate)
  }

  if (juniorMakersProduct) {
    const juniorTemplate = await prisma.recurringTemplate.create({
      data: {
        name: 'Junior Makers Monthly',
        description: 'Bi-weekly maker sessions for younger children',
        type: EventType.SUBSCRIPTION,
        startTime: '14:00',
        endTime: '15:00',
        duration: 60,
        daysOfWeek: [6], // Saturday
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-08-31'),
        maxCapacity: 10,
        locationId: neutralBay.id,
        ageMin: 5,
        ageMax: 9,
      },
    })
    recurringTemplates.push(juniorTemplate)
  }

  console.log(`🔄 Created ${recurringTemplates.length} recurring templates`)

  // Create events for the next 8 weeks
  const now = new Date()
  const events = []

  // Generate Ignite Weekly Sessions (Saturdays 4-5:30pm)
  for (let week = 0; week < 8; week++) {
    const eventDate = addWeeks(now, week)
    const saturday = new Date(eventDate)
    saturday.setDate(saturday.getDate() + (6 - saturday.getDay())) // Next Saturday
    
    const startDateTime = setHours(setMinutes(saturday, 0), 16)
    const endDateTime = setHours(setMinutes(saturday, 30), 17)

    const event = await prisma.event.create({
      data: {
        title: 'Ignite Weekly Sessions',
        description: 'Advanced robotics and coding session',
        type: EventType.SUBSCRIPTION,
        status: week < 2 ? EventStatus.COMPLETED : EventStatus.SCHEDULED,
        startDateTime,
        endDateTime,
        maxCapacity: 12,
        currentCount: week < 2 ? Math.floor(Math.random() * 8) + 6 : Math.floor(Math.random() * 5) + 3,
        locationId: neutralBay.id,
        recurringTemplateId: recurringTemplates[0]?.id,
        ageMin: 8,
        ageMax: 16,
      },
    })
    events.push(event)
  }

  // Generate Junior Makers (Saturdays 2-3pm, bi-weekly)
  for (let session = 0; session < 4; session++) {
    const eventDate = addWeeks(now, session * 2)
    const saturday = new Date(eventDate)
    saturday.setDate(saturday.getDate() + (6 - saturday.getDay()))
    
    const startDateTime = setHours(setMinutes(saturday, 0), 14)
    const endDateTime = setHours(setMinutes(saturday, 0), 15)

    const event = await prisma.event.create({
      data: {
        title: 'Junior Makers Monthly',
        description: 'Creative maker session for young children',
        type: EventType.SUBSCRIPTION,
        status: session < 1 ? EventStatus.COMPLETED : EventStatus.SCHEDULED,
        startDateTime,
        endDateTime,
        maxCapacity: 10,
        currentCount: session < 1 ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 4) + 2,
        locationId: neutralBay.id,
        recurringTemplateId: recurringTemplates[1]?.id,
        ageMin: 5,
        ageMax: 9,
      },
    })
    events.push(event)
  }

  // Create 20 camp bookings for next week (both Day and All-Day camps in Neutral Bay)
  const campProducts = createdProducts.filter(p => p.type === ProductType.CAMP)
  const dayCamps = campProducts.filter(p => p.duration === 480) // Full day (8 hours)
  const halfDayCamps = campProducts.filter(p => p.duration === 240) // Half day (4 hours)
  
  // Create 20 camp events for next week (Monday-Friday)
  let campEventCount = 0
  for (let day = 7; day <= 13; day++) { // Next week (days 7-13 from now)
    const eventDate = addDays(now, day)
    const dayOfWeek = eventDate.getDay()
    
    // Only weekdays (Monday-Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && campEventCount < 20) {
      // Create 2 Day Camps per day (morning slots)
      for (let i = 0; i < 2 && campEventCount < 20; i++) {
        const product = dayCamps[i % dayCamps.length] || campProducts[0]
        const startDateTime = setHours(setMinutes(eventDate, 0), 9) // 9am start
        const endDateTime = setHours(setMinutes(eventDate, 0), 17) // 5pm end (8 hours)

        const event = await prisma.event.create({
          data: {
            title: `${product.name} - Day Camp`,
            description: `${product.description} - All day camp at Neutral Bay`,
            type: EventType.CAMP,
            status: EventStatus.SCHEDULED,
            startDateTime,
            endDateTime,
            maxCapacity: 16,
            currentCount: 0,
            locationId: neutralBay.id,
            ageMin: product.ageMin,
            ageMax: product.ageMax,
          },
        })
        events.push(event)
        campEventCount++
      }
      
      // Create 2 Half-Day Camps per day (afternoon slots)
      for (let i = 0; i < 2 && campEventCount < 20; i++) {
        const product = halfDayCamps[i % halfDayCamps.length] || campProducts[1]
        const startDateTime = setHours(setMinutes(eventDate, 0), 13) // 1pm start
        const endDateTime = setHours(setMinutes(eventDate, 0), 17) // 5pm end (4 hours)

        const event = await prisma.event.create({
          data: {
            title: `${product.name} - Half-Day Camp`,
            description: `${product.description} - Afternoon session at Neutral Bay`,
            type: EventType.CAMP,
            status: EventStatus.SCHEDULED,
            startDateTime,
            endDateTime,
            maxCapacity: 12,
            currentCount: 0,
            locationId: neutralBay.id,
            ageMin: product.ageMin,
            ageMax: product.ageMax,
          },
        })
        events.push(event)
        campEventCount++
      }
    }
  }
  
  console.log(`🏕️  Created ${campEventCount} camp events for next week at Neutral Bay`)

  console.log(`📅 Created ${events.length} events`)

  // Create sample bookings for existing events
  const completedEvents = events.filter(e => e.status === EventStatus.COMPLETED)
  const upcomingEvents = events.filter(e => e.status === EventStatus.SCHEDULED)
  
  const bookings = []
  
  // Create bookings for completed events
  for (const event of completedEvents.slice(0, 3)) {
    const studentsToBook = createdStudents.slice(0, event.currentCount)
    const eventProduct = createdProducts.find(p => p.name === event.title)
    
    for (const student of studentsToBook) {
      if (eventProduct) {
        const booking = await prisma.booking.create({
          data: {
            studentId: student.id,
            productId: eventProduct.id,
            locationId: event.locationId,
            eventId: event.id,
            startDate: event.startDateTime,
            endDate: event.endDateTime,
            status: BookingStatus.COMPLETED,
            totalPrice: eventProduct.price,
            notes: Math.random() > 0.7 ? 'Great session! Student loved the robotics challenges.' : null,
          },
        })
        bookings.push(booking)
      }
    }
  }

  // Create bookings for upcoming events
  for (const event of upcomingEvents.slice(0, 5)) {
    const studentsToBook = createdStudents.slice(0, event.currentCount)
    const eventProduct = createdProducts.find(p => p.name === event.title)
    
    for (const student of studentsToBook) {
      if (eventProduct) {
        const booking = await prisma.booking.create({
          data: {
            studentId: student.id,
            productId: eventProduct.id,
            locationId: event.locationId,
            eventId: event.id,
            startDate: event.startDateTime,
            endDate: event.endDateTime,
            status: BookingStatus.CONFIRMED,
            totalPrice: eventProduct.price,
          },
        })
        bookings.push(booking)
      }
    }
  }

  console.log(`📋 Created ${bookings.length} bookings`)

  // Create sample orders and order items
  const orders = []
  const orderItems = []
  
  // Create 15 sample orders with varying statuses
  for (let i = 0; i < 15; i++) {
    const orderDate = addDays(now, -Math.floor(Math.random() * 30)) // Orders from last 30 days
    const customer = createdStudents[Math.floor(Math.random() * createdStudents.length)]
    
    const order = await prisma.order.create({
      data: {
        customerEmail: `parent${i + 1}@example.com`,
        customerName: `Parent of ${customer.name}`,
        status: i < 12 ? OrderStatus.PAID : i < 14 ? OrderStatus.PENDING : OrderStatus.CANCELLED,
        totalAmount: 0, // Will update after creating order items
        createdAt: orderDate,
      },
    })
    orders.push(order)

    // Add 1-3 items per order
    const itemCount = Math.floor(Math.random() * 3) + 1
    let orderTotal = 0

    for (let j = 0; j < itemCount; j++) {
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)]
      const student = createdStudents[Math.floor(Math.random() * createdStudents.length)]
      
      const bookingDate = addDays(orderDate, Math.floor(Math.random() * 60) + 1) // 1-60 days after order
      
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          studentId: student.id,
          bookingDate,
          price: product.price,
        },
      })
      orderItems.push(orderItem)
      orderTotal += Number(product.price)
    }

    // Update order total
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: orderTotal },
    })
  }

  console.log(`💳 Created ${orders.length} orders with ${orderItems.length} items`)

  // Create some birthday party events for the next month
  const birthdayProducts = createdProducts.filter(p => p.type === ProductType.BIRTHDAY)
  
  for (let i = 0; i < 8; i++) {
    const eventDate = addDays(now, Math.floor(Math.random() * 30) + 7) // Next 30 days
    const product = birthdayProducts[Math.floor(Math.random() * birthdayProducts.length)]
    
    // Schedule birthday parties on weekends
    if (eventDate.getDay() === 0 || eventDate.getDay() === 6) {
      const startTime = 10 + Math.floor(Math.random() * 6) // 10am - 4pm
      const startDateTime = setHours(setMinutes(eventDate, 0), startTime)
      const endDateTime = setHours(setMinutes(eventDate, 0), startTime + 2)

      const event = await prisma.event.create({
        data: {
          title: `${product.name} - Birthday Celebration`,
          description: `Private birthday party: ${product.description}`,
          type: EventType.BIRTHDAY,
          status: EventStatus.SCHEDULED,
          startDateTime,
          endDateTime,
          maxCapacity: 12,
          currentCount: Math.floor(Math.random() * 8) + 4,
          locationId: neutralBay.id,
          ageMin: product.ageMin,
          ageMax: product.ageMax,
          instructorNotes: 'Birthday setup required - decorations and cake table',
        },
      })

      // Create booking for birthday child
      const birthdayChild = createdStudents[Math.floor(Math.random() * createdStudents.length)]
      await prisma.booking.create({
        data: {
          studentId: birthdayChild.id,
          productId: product.id,
          locationId: neutralBay.id,
          eventId: event.id,
          startDate: startDateTime,
          endDate: endDateTime,
          status: BookingStatus.CONFIRMED,
          totalPrice: product.price,
          notes: `Birthday party for ${birthdayChild.name}`,
        },
      })
    }
  }

  console.log('🎂 Created birthday party events')

  // Generate summary statistics
  const stats = {
    locations: await prisma.location.count(),
    products: await prisma.product.count(),
    students: await prisma.student.count(),
    events: await prisma.event.count(),
    bookings: await prisma.booking.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    recurringTemplates: await prisma.recurringTemplate.count(),
  }

  console.log('\n📊 Database seeded successfully!')
  console.log('='.repeat(40))
  console.log(`Locations: ${stats.locations}`)
  console.log(`Products: ${stats.products}`)
  console.log(`Students: ${stats.students}`)
  console.log(`Events: ${stats.events}`)
  console.log(`Bookings: ${stats.bookings}`)
  console.log(`Orders: ${stats.orders}`)
  console.log(`Order Items: ${stats.orderItems}`)
  console.log(`Recurring Templates: ${stats.recurringTemplates}`)
  console.log('='.repeat(40))
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

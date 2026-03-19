import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

const BUNDLE_PRODUCT_NAMES = ['Day Camp 3-Day Bundle', 'All Day Camp 3-Day Bundle']

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'PAID',
        orderItems: {
          some: {
            product: {
              name: { in: BUNDLE_PRODUCT_NAMES }
            }
          }
        }
      },
      include: {
        orderItems: {
          include: {
            product: true,
            student: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const incompleteBundles = orders
      .map((order) => {
        const bundleItemsByStudent = new Map<
          string,
          {
            studentId: string
            studentName: string
            productId: string
            productName: string
            bookingDates: Date[]
            orderId: string
            customerName: string
            customerEmail: string
          }
        >()

        for (const item of order.orderItems) {
          if (BUNDLE_PRODUCT_NAMES.includes(item.product.name)) {
            const key = `${item.studentId}-${item.productId}`
            const existing = bundleItemsByStudent.get(key)

            if (existing) {
              existing.bookingDates.push(item.bookingDate)
            } else {
              bundleItemsByStudent.set(key, {
                studentId: item.studentId,
                studentName: item.student.name,
                productId: item.productId,
                productName: item.product.name,
                bookingDates: [item.bookingDate],
                orderId: order.id,
                customerName: order.customerName,
                customerEmail: order.customerEmail
              })
            }
          }
        }

        return Array.from(bundleItemsByStudent.values()).filter((bundle) => bundle.bookingDates.length < 3)
      })
      .flat()

    return NextResponse.json({ bundles: incompleteBundles })
  } catch (error) {
    console.error('Error fetching incomplete bundles:', error)
    return NextResponse.json({ error: 'Failed to fetch incomplete bundles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, studentId, productId, bookingDates, autoFill } = body

    // Auto-fill mode: calculate consecutive dates from first booking
    if (autoFill && orderId && studentId && productId) {
      return handleAutoFill(orderId, studentId, productId)
    }

    if (!orderId || !studentId || !productId || !bookingDates || !Array.isArray(bookingDates)) {
      return NextResponse.json({ error: 'orderId, studentId, productId, and bookingDates are required' }, { status: 400 })
    }

    const [order, product, location] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            where: { studentId, productId }
          }
        }
      }),
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.location.findFirst({ where: { name: { contains: 'Neutral Bay' } } })
    ])

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const existingDates = order.orderItems.map((item) => item.bookingDate.toISOString().split('T')[0])
    const totalAfterAdd = existingDates.length + bookingDates.length

    if (totalAfterAdd > 3) {
      return NextResponse.json({ error: `Cannot add ${bookingDates.length} dates. Bundle already has ${existingDates.length} bookings.` }, { status: 400 })
    }

    const isDayCamp = product.name.includes('Day Camp 3-Day Bundle') && !product.name.includes('All Day')
    const startHour = 9
    const endHour = isDayCamp ? 15 : 17

    const locationId = location?.id || 'default-location-id'
    const pricePerDay = Number(product.price) / 3

    const result = await prisma.$transaction(async (tx) => {
      const createdItems = []
      const createdBookings = []

      for (const dateStr of bookingDates) {
        const date = new Date(dateStr)
        const startDate = new Date(date)
        startDate.setHours(startHour, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(endHour, 0, 0, 0)

        const orderItem = await tx.orderItem.create({
          data: {
            orderId,
            productId,
            studentId,
            bookingDate: date,
            price: pricePerDay
          }
        })
        createdItems.push(orderItem)

        const booking = await tx.booking.create({
          data: {
            studentId,
            productId,
            locationId,
            startDate,
            endDate,
            status: 'CONFIRMED',
            totalPrice: pricePerDay,
            notes: `Bundle booking - Order: ${orderId}`
          }
        })
        createdBookings.push(booking)
      }

      return { orderItems: createdItems, bookings: createdBookings }
    })

    return NextResponse.json({
      success: true,
      created: result.orderItems.length,
      orderItems: result.orderItems,
      bookings: result.bookings
    })
  } catch (error) {
    console.error('Error adding bundle booking dates:', error)
    return NextResponse.json({ error: 'Failed to add booking dates' }, { status: 500 })
  }
}

async function handleAutoFill(orderId: string, studentId: string, productId: string) {
  try {
    const [order, product, location] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            where: { studentId, productId },
            orderBy: { bookingDate: 'asc' }
          }
        }
      }),
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.location.findFirst({ where: { name: { contains: 'Neutral Bay' } } })
    ])

    if (!order || !product) {
      return NextResponse.json({ error: 'Order or product not found' }, { status: 404 })
    }

    const existingDates = order.orderItems.map(item => item.bookingDate)
    if (existingDates.length === 0) {
      return NextResponse.json({ error: 'No existing booking dates found' }, { status: 400 })
    }
    if (existingDates.length >= 3) {
      return NextResponse.json({ error: 'Bundle already has 3 bookings' }, { status: 400 })
    }

    // Start from the first booking date and fill consecutive days
    const firstDate = existingDates[0]
    const datesToAdd: Date[] = []
    
    // Generate 3 consecutive dates starting from the first
    for (let i = 0; i < 3; i++) {
      const date = addDays(firstDate, i)
      const dateStr = date.toISOString().split('T')[0]
      const existingStr = existingDates.map(d => d.toISOString().split('T')[0])
      
      // Only add if not already booked
      if (!existingStr.includes(dateStr)) {
        datesToAdd.push(date)
      }
    }

    if (datesToAdd.length === 0) {
      return NextResponse.json({ error: 'No dates to add - all consecutive dates already booked' }, { status: 400 })
    }

    const isDayCamp = product.name.includes('Day Camp') && !product.name.includes('All Day')
    const startHour = 9
    const endHour = isDayCamp ? 15 : 17
    const locationId = location?.id || 'default-location-id'
    const pricePerDay = Number(product.price) / 3

    const result = await prisma.$transaction(async (tx) => {
      const createdItems = []
      const createdBookings = []

      for (const date of datesToAdd) {
        const startDate = new Date(date)
        startDate.setHours(startHour, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(endHour, 0, 0, 0)

        const orderItem = await tx.orderItem.create({
          data: {
            orderId,
            productId,
            studentId,
            bookingDate: date,
            price: pricePerDay
          }
        })
        createdItems.push(orderItem)

        const booking = await tx.booking.create({
          data: {
            studentId,
            productId,
            locationId,
            startDate,
            endDate,
            status: 'CONFIRMED',
            totalPrice: pricePerDay,
            notes: `Auto-filled bundle booking - Order: ${orderId}`
          }
        })
        createdBookings.push(booking)
      }

      return { orderItems: createdItems, bookings: createdBookings }
    })

    return NextResponse.json({
      success: true,
      created: result.orderItems.length,
      addedDates: datesToAdd.map(d => d.toISOString().split('T')[0]),
      orderItems: result.orderItems,
      bookings: result.bookings
    })
  } catch (error) {
    console.error('Error auto-filling bundle dates:', error)
    return NextResponse.json({ error: 'Failed to auto-fill bundle dates' }, { status: 500 })
  }
}

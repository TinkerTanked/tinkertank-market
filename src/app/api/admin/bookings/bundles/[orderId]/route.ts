import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BUNDLE_PRODUCT_NAMES = ['Day Camp 3-Day Bundle', 'All Day Camp 3-Day Bundle']

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { studentId, productId, bookingDate } = body

    if (!studentId || !productId || !bookingDate) {
      return NextResponse.json({ error: 'studentId, productId, and bookingDate are required' }, { status: 400 })
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
    if (!BUNDLE_PRODUCT_NAMES.includes(product.name)) {
      return NextResponse.json({ error: 'Product is not a bundle product' }, { status: 400 })
    }

    const existingCount = order.orderItems.length
    if (existingCount >= 3) {
      return NextResponse.json({ error: 'Bundle already has 3 booking dates' }, { status: 400 })
    }

    const existingDates = order.orderItems.map((item) => item.bookingDate.toISOString().split('T')[0])
    const newDateStr = new Date(bookingDate).toISOString().split('T')[0]
    if (existingDates.includes(newDateStr)) {
      return NextResponse.json({ error: 'This date is already booked for this bundle' }, { status: 400 })
    }

    const isDayCamp = product.name.includes('Day Camp 3-Day Bundle') && !product.name.includes('All Day')
    const startHour = 9
    const endHour = isDayCamp ? 15 : 17

    const locationId = location?.id || 'default-location-id'
    const pricePerDay = Number(product.price) / 3

    const date = new Date(bookingDate)
    const startDate = new Date(date)
    startDate.setHours(startHour, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(endHour, 0, 0, 0)

    const result = await prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId,
          productId,
          studentId,
          bookingDate: date,
          price: pricePerDay
        }
      })

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

      return { orderItem, booking }
    })

    return NextResponse.json({
      success: true,
      orderItem: result.orderItem,
      booking: result.booking
    })
  } catch (error) {
    console.error('Error adding bundle booking date:', error)
    return NextResponse.json({ error: 'Failed to add booking date' }, { status: 500 })
  }
}

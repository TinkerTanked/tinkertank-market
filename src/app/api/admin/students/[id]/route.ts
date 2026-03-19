import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
})

interface GroupedOrder {
  orderId: string
  orderDate: string
  status: string
  customerName: string
  customerEmail: string
  productName: string
  productType: string
  bookingDates: string[]
  totalPrice: number
}

async function getPhoneFromStripe(sessionId: string): Promise<string | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session.metadata?.customerPhone || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            product: true,
            event: true,
            location: true
          },
          orderBy: { startDate: 'desc' }
        },
        orderItems: {
          include: {
            order: true,
            product: true
          },
          orderBy: { createdAt: 'desc' }
        },
        igniteSubscriptions: {
          include: {
            igniteSubscription: true
          }
        },
        _count: {
          select: { bookings: true, orderItems: true }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const totalSpend = student.orderItems
      .filter(item => item.order.status === 'PAID')
      .reduce((sum, item) => sum + Number(item.price), 0)

    let parentPhone: string | null = null
    
    if (student.orderItems.length > 0) {
      const mostRecentOrder = student.orderItems[0].order
      if (mostRecentOrder.stripePaymentIntentId) {
        parentPhone = await getPhoneFromStripe(mostRecentOrder.stripePaymentIntentId)
      }
    }
    
    if (!parentPhone) {
      parentPhone = student.emergencyContactPhone || null
    }

    const parentContact = student.orderItems.length > 0
      ? {
          name: student.orderItems[0].order.customerName,
          email: student.orderItems[0].order.customerEmail,
          phone: parentPhone
        }
      : null

    const groupedOrders: GroupedOrder[] = []
    const orderMap = new Map<string, GroupedOrder>()

    for (const item of student.orderItems) {
      const key = `${item.orderId}-${item.productId}`
      const existing = orderMap.get(key)
      
      if (existing) {
        existing.bookingDates.push(item.bookingDate.toISOString())
        existing.totalPrice += Number(item.price)
      } else {
        const grouped: GroupedOrder = {
          orderId: item.orderId,
          orderDate: item.order.createdAt.toISOString(),
          status: item.order.status,
          customerName: item.order.customerName,
          customerEmail: item.order.customerEmail,
          productName: item.product.name,
          productType: item.product.type,
          bookingDates: [item.bookingDate.toISOString()],
          totalPrice: Number(item.price)
        }
        orderMap.set(key, grouped)
        groupedOrders.push(grouped)
      }
    }

    groupedOrders.forEach(order => {
      order.bookingDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    })

    return NextResponse.json({
      ...student,
      totalSpend,
      parentContact,
      groupedOrders
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}

interface UpdateStudentBody {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  school?: string
  allergies?: string
  medicalNotes?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body: UpdateStudentBody = await request.json()

    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const updateData: {
      name?: string
      birthdate?: Date
      school?: string | null
      allergies?: string | null
      medicalNotes?: string | null
      emergencyContactName?: string | null
      emergencyContactPhone?: string | null
    } = {}

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const currentParts = existing.name.split(' ')
      const firstName = body.firstName !== undefined ? body.firstName.trim() : currentParts[0]
      const lastName = body.lastName !== undefined ? body.lastName.trim() : currentParts.slice(1).join(' ')
      updateData.name = `${firstName} ${lastName}`.trim()
    }

    if (body.dateOfBirth !== undefined) {
      updateData.birthdate = new Date(body.dateOfBirth)
    }

    if (body.school !== undefined) {
      updateData.school = body.school || null
    }

    if (body.allergies !== undefined) {
      updateData.allergies = body.allergies || null
    }

    if (body.medicalNotes !== undefined) {
      updateData.medicalNotes = body.medicalNotes || null
    }

    if (body.emergencyContactName !== undefined) {
      updateData.emergencyContactName = body.emergencyContactName || null
    }

    if (body.emergencyContactPhone !== undefined) {
      updateData.emergencyContactPhone = body.emergencyContactPhone || null
    }

    const student = await prisma.student.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.student.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true, orderItems: true }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (existing._count.bookings > 0 || existing._count.orderItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete student with existing bookings or orders. Consider archiving instead.' },
        { status: 400 }
      )
    }

    await prisma.student.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { adminRoleFromAuthorization } from '@/lib/adminAuth'
import { adminSubscriptionView } from '@/lib/adminCustomers'

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

function sydneyDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(date)
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
    // Mentors see the child's record, not what the family has spent.
    const isSuper = adminRoleFromAuthorization(request.headers.get('authorization')) === 'super'

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            product: true,
            location: true,
            attendance: { select: { id: true } },
            campCredit: { select: { code: true } },
            igniteSubscription: { select: { status: true, cancelAt: true } }
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
            igniteSubscription: { include: { students: { include: { student: { select: { id: true, name: true } } } } } }
          }
        },
        attendanceRecords: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const totalSpend = student.orderItems
      .filter(item => item.order.status === 'PAID')
      .reduce((sum, item) => sum + Number(item.price), 0)

    // Total time present, computed from completed (checked-out) attendance
    // records. Forms part of the student's educational record over time.
    const totalAttendanceMinutes = student.attendanceRecords.reduce((sum, r) => {
      if (!r.checkOutAt) return sum
      return sum + Math.max(0, Math.round((r.checkOutAt.getTime() - r.checkInAt.getTime()) / 60000))
    }, 0)

    const latestOrder = student.orderItems[0]?.order
    const latestSubscription = student.igniteSubscriptions[0]?.igniteSubscription
    let parentPhone = latestOrder?.customerPhone || null
    if (!parentPhone && latestOrder?.stripePaymentIntentId) {
      parentPhone = await getPhoneFromStripe(latestOrder.stripePaymentIntentId)
    }
    if (!parentPhone) {
      parentPhone = student.emergencyContactPhone || null
    }

    const parentContact = latestOrder
      ? { name: latestOrder.customerName, email: latestOrder.customerEmail, phone: parentPhone }
      : latestSubscription
        ? { name: latestSubscription.customerName || latestSubscription.customerEmail, email: latestSubscription.customerEmail, phone: parentPhone }
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

    const subscriptions = student.igniteSubscriptions.map(link => adminSubscriptionView(link.igniteSubscription))

    return NextResponse.json({
      id: student.id,
      name: student.name,
      birthdate: student.birthdate,
      birthdateEstimated: student.birthdateEstimated,
      school: student.school,
      allergies: student.allergies,
      medicalNotes: student.medicalNotes,
      emergencyContactName: student.emergencyContactName,
      emergencyContactPhone: student.emergencyContactPhone,
      createdAt: student.createdAt,
      totalAttendanceMinutes,
      parentContact,
      // Same rule as the check-in roster: Ignite sessions only count while the
      // subscription is running (or the session was attended or overridden).
      bookings: student.bookings
        .filter(booking => {
          if (!booking.igniteSubscriptionId || booking.rosterOverride || booking.attendance) return true
          const subscription = booking.igniteSubscription
          return (
            !!subscription &&
            (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING') &&
            (!subscription.cancelAt || booking.startDate < subscription.cancelAt)
          )
        })
        .map(booking => ({
        id: booking.id,
        // Ignite bookings are real instants; camp and party dates are stored on the UTC calendar day.
        dateKey: booking.igniteSubscriptionId ? sydneyDateKey(booking.startDate) : booking.startDate.toISOString().slice(0, 10),
        status: booking.status,
        productName: booking.product.name,
        productType: booking.product.type,
        locationName: booking.location.name,
        checkedIn: !!booking.attendance,
        creditCode: booking.campCredit?.code ?? null,
        ...(isSuper ? { price: Number(booking.totalPrice) } : {})
      })),
      subscriptions: isSuper ? subscriptions : subscriptions.map(({ weeklyAmount: _weeklyAmount, ...subscription }) => subscription),
      ...(isSuper ? { totalSpend, groupedOrders } : {})
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
  birthdateEstimated?: boolean
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
      birthdateEstimated?: boolean
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
      updateData.birthdateEstimated = body.birthdateEstimated ?? false
    } else if (body.birthdateEstimated !== undefined) {
      updateData.birthdateEstimated = body.birthdateEstimated
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

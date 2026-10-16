import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminSubscriptionView } from '@/lib/adminCustomers'

/** Everything the super admin needs about one family, keyed by email (there is no Customer table yet). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const email = decodeURIComponent((await params).email)
      .trim()
      .toLowerCase()
    const byEmail = { equals: email, mode: 'insensitive' as const }

    const [orders, subscriptions, credits] = await Promise.all([
      prisma.order.findMany({
        where: { customerEmail: byEmail, status: 'PAID' },
        orderBy: { createdAt: 'desc' },
        include: { orderItems: { select: { studentId: true } } },
      }),
      prisma.igniteSubscription.findMany({
        where: { customerEmail: byEmail },
        orderBy: { createdAt: 'desc' },
        include: { students: { include: { student: { select: { id: true, name: true } } } } },
      }),
      prisma.campCredit.findMany({ where: { customerEmail: byEmail }, orderBy: { createdAt: 'desc' } }),
    ])

    const studentIds = [
      ...new Set([
        ...orders.flatMap(order => order.orderItems.map(item => item.studentId)),
        ...subscriptions.flatMap(sub => sub.students.map(link => link.student.id)),
      ]),
    ]
    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const [students, bookings] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: studentIds } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, birthdate: true, school: true, allergies: true, medicalNotes: true },
      }),
      prisma.booking.findMany({
        where: { studentId: { in: studentIds }, igniteSubscriptionId: null, product: { type: { in: ['CAMP', 'BIRTHDAY'] } } },
        orderBy: { startDate: 'desc' },
        include: {
          product: { select: { name: true, type: true } },
          location: { select: { name: true } },
          student: { select: { name: true } },
          attendance: { select: { id: true } },
          campCredit: { select: { code: true } },
        },
      }),
    ])

    const latestOrder = orders[0]
    return NextResponse.json({
      customer: {
        email,
        name: latestOrder?.customerName || subscriptions[0]?.customerName || email,
        phone: orders.find(order => order.customerPhone)?.customerPhone ?? null,
        emergencyContactName: latestOrder?.emergencyContactName ?? null,
        emergencyContactPhone: latestOrder?.emergencyContactPhone ?? null,
      },
      totals: {
        orders: orders.length,
        spent: Math.round(orders.reduce((sum, order) => sum + Number(order.totalAmount), 0) * 100) / 100,
      },
      students,
      subscriptions: subscriptions.map(adminSubscriptionView),
      bookings: bookings.map(booking => ({
        id: booking.id,
        dateKey: booking.startDate.toISOString().slice(0, 10),
        productName: booking.product.name,
        productType: booking.product.type,
        locationName: booking.location.name,
        status: booking.status,
        studentId: booking.studentId,
        studentName: booking.student.name,
        price: Number(booking.totalPrice),
        checkedIn: !!booking.attendance,
        creditCode: booking.campCredit?.code ?? null,
      })),
      credits: credits.map(credit => ({
        code: credit.code,
        amount: Number(credit.amount),
        expiresAt: credit.expiresAt.toISOString(),
        redeemedAt: credit.redeemedAt?.toISOString() ?? null,
        createdAt: credit.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

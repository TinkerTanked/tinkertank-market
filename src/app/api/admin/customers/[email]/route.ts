import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminSubscriptionView } from '@/lib/adminCustomers'

async function loadFamily(rawEmail: string) {
  const email = decodeURIComponent(rawEmail).trim().toLowerCase()
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
  return { email, byEmail, orders, subscriptions, credits, studentIds }
}

/** Everything the super admin needs about one family, keyed by email (there is no Customer table yet). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email, orders, subscriptions, credits, studentIds } = await loadFamily((await params).email)
    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const [students, bookings] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: studentIds } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, birthdate: true, school: true, allergies: true, medicalNotes: true, emergencyContactPhone: true },
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
        // Families without orders (Ignite only) fall back to their children's emergency contact.
        phone: orders.find(order => order.customerPhone)?.customerPhone ?? students.find(student => student.emergencyContactPhone)?.emergencyContactPhone ?? null,
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

const digits = (phone: string | null) => (phone || '').replace(/\D/g, '')

/**
 * Set the family's phone. It is stored on their paid orders (shown on the
 * customer page) and on children whose emergency contact phone is blank or was
 * the family's old number (used for tap-to-call at check-in). Children with a
 * different emergency contact keep it.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const body = await request.json().catch(() => ({}))
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    if (!/^\+?[\d\s()-]+$/.test(phone) || digits(phone).length < 8 || digits(phone).length > 15) {
      return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 })
    }

    const { byEmail, orders, subscriptions, studentIds } = await loadFamily((await params).email)
    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const oldPhones = new Set(orders.map(order => digits(order.customerPhone)).filter(Boolean))
    const children = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, emergencyContactName: true, emergencyContactPhone: true },
    })
    const parentName = orders[0]?.customerName || subscriptions[0]?.customerName || null
    const childUpdates = children
      .filter(child => !digits(child.emergencyContactPhone) || oldPhones.has(digits(child.emergencyContactPhone)))
      .map(child =>
        prisma.student.update({
          where: { id: child.id },
          data: { emergencyContactPhone: phone, emergencyContactName: child.emergencyContactName?.trim() ? undefined : parentName },
        })
      )

    await prisma.$transaction([
      prisma.order.updateMany({ where: { customerEmail: byEmail, status: 'PAID' }, data: { customerPhone: phone } }),
      ...childUpdates,
    ])
    return NextResponse.json({ phone, childrenUpdated: childUpdates.length })
  } catch (error) {
    console.error('Error updating customer phone:', error)
    return NextResponse.json({ error: 'Failed to update phone' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { buildAdminCustomers } from '@/lib/adminCustomers'

export async function GET() {
  try {
    const [orders, subscriptions] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'PAID' },
        select: {
          customerEmail: true,
          customerName: true,
          customerPhone: true,
          totalAmount: true,
          createdAt: true,
          orderItems: { select: { student: { select: { id: true, name: true } } } }
        }
      }),
      prisma.igniteSubscription.findMany({
        select: {
          id: true,
          customerEmail: true,
          customerName: true,
          status: true,
          igniteSessionId: true,
          createdAt: true,
          students: { select: { student: { select: { id: true, name: true } } } }
        }
      })
    ])

    const customers = buildAdminCustomers(
      orders.map(order => ({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
        students: order.orderItems.map(item => item.student)
      })),
      subscriptions.map(subscription => ({
        id: subscription.id,
        customerEmail: subscription.customerEmail,
        customerName: subscription.customerName,
        status: subscription.status,
        sessionName: IGNITE_SESSIONS.find(session => session.id === subscription.igniteSessionId)?.name || 'Ignite',
        createdAt: subscription.createdAt,
        students: subscription.students.map(link => link.student)
      }))
    )

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

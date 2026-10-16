import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminSubscriptionView } from '@/lib/adminCustomers'

export async function GET() {
  try {
    const subscriptions = await prisma.igniteSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        students: { include: { student: { select: { id: true, name: true } } } },
      },
    })

    return NextResponse.json({
      subscriptions: subscriptions.map(adminSubscriptionView),
      total: subscriptions.length,
      stats: {
        active: subscriptions.filter(s => s.status === 'ACTIVE').length,
        paused: subscriptions.filter(s => s.status === 'PAUSED').length,
        canceled: subscriptions.filter(s => s.status === 'CANCELED').length,
        weeklyRevenue: subscriptions.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + Number(s.weeklyAmount), 0),
      },
    })
  } catch (error) {
    console.error('Error fetching ignite subscriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

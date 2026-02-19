import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { IgniteSubscription, IgniteSubscriptionStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as IgniteSubscriptionStatus | null

    const where = status ? { status } : {}

    const subscriptions = await prisma.igniteSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const enrichedSubscriptions = subscriptions.map((sub: IgniteSubscription) => {
      const igniteSession = IGNITE_SESSIONS.find(s => s.id === sub.igniteSessionId)
      return {
        ...sub,
        weeklyAmount: Number(sub.weeklyAmount),
        studentNames: sub.studentNames as string[] | null,
        sessionName: igniteSession?.name || 'Unknown session',
        sessionLocation: igniteSession?.location || 'Unknown location',
        sessionDays: igniteSession?.dayOfWeek || [],
        sessionTime: igniteSession ? `${igniteSession.startTime} - ${igniteSession.endTime}` : '',
      }
    })

    return NextResponse.json({
      subscriptions: enrichedSubscriptions,
      total: enrichedSubscriptions.length,
      stats: {
        active: subscriptions.filter((s: IgniteSubscription) => s.status === 'ACTIVE').length,
        paused: subscriptions.filter((s: IgniteSubscription) => s.status === 'PAUSED').length,
        canceled: subscriptions.filter((s: IgniteSubscription) => s.status === 'CANCELED').length,
        weeklyRevenue: subscriptions
          .filter((s: IgniteSubscription) => s.status === 'ACTIVE')
          .reduce((sum: number, s: IgniteSubscription) => sum + Number(s.weeklyAmount), 0),
      },
    })
  } catch (error) {
    console.error('Error fetching ignite subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

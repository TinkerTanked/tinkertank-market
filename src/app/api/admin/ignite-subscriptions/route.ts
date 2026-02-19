import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { IgniteSubscriptionStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as IgniteSubscriptionStatus | null

    const where = status ? { status } : {}

    const subscriptions = await prisma.igniteSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        students: {
          include: { student: true }
        }
      }
    })

    const enrichedSubscriptions = subscriptions.map((sub) => {
      const igniteSession = IGNITE_SESSIONS.find(s => s.id === sub.igniteSessionId)
      return {
        ...sub,
        weeklyAmount: Number(sub.weeklyAmount),
        studentNames: sub.studentNames as Array<{ firstName: string; lastName: string; age?: number; grade?: string; allergies?: string }> | null,
        sessionName: igniteSession?.name || 'Unknown session',
        sessionLocation: igniteSession?.location || 'Unknown location',
        sessionDays: igniteSession?.dayOfWeek || [],
        sessionTime: igniteSession ? `${igniteSession.startTime} - ${igniteSession.endTime}` : '',
        linkedStudents: sub.students.map(link => ({
          id: link.student.id,
          name: link.student.name,
          birthdate: link.student.birthdate,
          allergies: link.student.allergies,
          school: link.student.school,
          medicalNotes: link.student.medicalNotes,
          emergencyContactName: link.student.emergencyContactName,
          emergencyContactPhone: link.student.emergencyContactPhone
        }))
      }
    })

    return NextResponse.json({
      subscriptions: enrichedSubscriptions,
      total: enrichedSubscriptions.length,
      stats: {
        active: subscriptions.filter((s) => s.status === 'ACTIVE').length,
        paused: subscriptions.filter((s) => s.status === 'PAUSED').length,
        canceled: subscriptions.filter((s) => s.status === 'CANCELED').length,
        weeklyRevenue: subscriptions
          .filter((s) => s.status === 'ACTIVE')
          .reduce((sum: number, s) => sum + Number(s.weeklyAmount), 0),
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

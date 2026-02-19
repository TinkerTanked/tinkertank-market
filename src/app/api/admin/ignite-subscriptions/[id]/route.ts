import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface StudentInfo {
  firstName: string
  lastName: string
  age?: number
  grade?: string
  allergies?: string
}

interface UpdateBody {
  studentNames: StudentInfo[]
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body: UpdateBody = await request.json()

    if (!body.studentNames || !Array.isArray(body.studentNames)) {
      return NextResponse.json({ error: 'studentNames must be an array' }, { status: 400 })
    }

    for (const student of body.studentNames) {
      if (!student.firstName || !student.lastName) {
        return NextResponse.json({ error: 'Each student must have firstName and lastName' }, { status: 400 })
      }
    }

    const subscription = await prisma.igniteSubscription.update({
      where: { id },
      data: { studentNames: body.studentNames as unknown as Prisma.InputJsonValue }
    })

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        weeklyAmount: Number(subscription.weeklyAmount)
      }
    })
  } catch (error) {
    console.error('Error updating ignite subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const subscription = await prisma.igniteSubscription.findUnique({
      where: { id }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...subscription,
      weeklyAmount: Number(subscription.weeklyAmount)
    })
  } catch (error) {
    console.error('Error fetching ignite subscription:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

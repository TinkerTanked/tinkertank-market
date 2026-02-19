import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface StudentInfo {
  id?: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  school?: string
  allergies?: string
  medicalNotes?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
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

    const subscription = await prisma.igniteSubscription.findUnique({
      where: { id },
      include: {
        students: {
          include: { student: true }
        }
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.igniteSubscriptionStudent.deleteMany({
        where: { igniteSubscriptionId: id }
      })

      const createdStudents: { id: string; name: string }[] = []

      for (const studentInfo of body.studentNames) {
        const fullName = `${studentInfo.firstName} ${studentInfo.lastName}`.trim()
        const birthdate = studentInfo.dateOfBirth ? new Date(studentInfo.dateOfBirth) : new Date(2015, 0, 1)

        const student = await tx.student.create({
          data: {
            name: fullName,
            birthdate,
            allergies: studentInfo.allergies || null,
            school: studentInfo.school || null,
            medicalNotes: studentInfo.medicalNotes || null,
            emergencyContactName: studentInfo.emergencyContactName || null,
            emergencyContactPhone: studentInfo.emergencyContactPhone || null
          }
        })

        await tx.igniteSubscriptionStudent.create({
          data: {
            igniteSubscriptionId: id,
            studentId: student.id
          }
        })

        createdStudents.push({ id: student.id, name: fullName })
      }

      if (subscription.igniteSessionId) {
        const recurringTemplate = await tx.recurringTemplate.findFirst({
          where: {
            name: { contains: subscription.igniteSessionId },
            isActive: true
          }
        })

        if (recurringTemplate) {
          const now = new Date()
          const futureEvents = await tx.event.findMany({
            where: {
              recurringTemplateId: recurringTemplate.id,
              startDateTime: { gte: now },
              status: { not: 'CANCELLED' }
            }
          })

          const subscriptionProduct = await tx.product.findFirst({
            where: { type: 'SUBSCRIPTION', isActive: true }
          })

          if (subscriptionProduct && futureEvents.length > 0) {
            for (const student of createdStudents) {
              for (const event of futureEvents) {
                const existingBooking = await tx.booking.findFirst({
                  where: {
                    studentId: student.id,
                    eventId: event.id
                  }
                })

                if (!existingBooking) {
                  await tx.booking.create({
                    data: {
                      studentId: student.id,
                      productId: subscriptionProduct.id,
                      locationId: event.locationId,
                      eventId: event.id,
                      startDate: event.startDateTime,
                      endDate: event.endDateTime,
                      status: 'CONFIRMED',
                      totalPrice: 0
                    }
                  })
                }
              }
            }
          }
        }
      }

      const updatedSubscription = await tx.igniteSubscription.update({
        where: { id },
        data: { studentNames: body.studentNames as unknown as Prisma.InputJsonValue },
        include: {
          students: {
            include: { student: true }
          }
        }
      })

      return updatedSubscription
    })

    return NextResponse.json({
      success: true,
      subscription: {
        ...result,
        weeklyAmount: Number(result.weeklyAmount),
        students: result.students.map(link => ({
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
  } catch (error) {
    console.error('Error updating ignite subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const subscription = await prisma.igniteSubscription.findUnique({
      where: { id },
      include: {
        students: {
          include: { student: true }
        }
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...subscription,
      weeklyAmount: Number(subscription.weeklyAmount),
      students: subscription.students.map(link => ({
        id: link.student.id,
        name: link.student.name,
        birthdate: link.student.birthdate,
        allergies: link.student.allergies,
        school: link.student.school,
        medicalNotes: link.student.medicalNotes,
        emergencyContactName: link.student.emergencyContactName,
        emergencyContactPhone: link.student.emergencyContactPhone
      }))
    })
  } catch (error) {
    console.error('Error fetching ignite subscription:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

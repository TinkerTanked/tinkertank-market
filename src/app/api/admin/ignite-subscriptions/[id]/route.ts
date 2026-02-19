import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { getSubscriptionStartTerm, getTermDatesForDayOfWeek, DAY_NAME_TO_NUMBER } from '@/config/schoolTerms'

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
      const existingStudentIds = subscription.students.map(s => s.studentId)
      const incomingStudentIds = body.studentNames.filter(s => s.id).map(s => s.id!)

      const studentsToRemove = existingStudentIds.filter(id => !incomingStudentIds.includes(id))
      if (studentsToRemove.length > 0) {
        await tx.igniteSubscriptionStudent.deleteMany({
          where: {
            igniteSubscriptionId: id,
            studentId: { in: studentsToRemove }
          }
        })
      }

      const linkedStudents: { id: string; name: string }[] = []

      for (const studentInfo of body.studentNames) {
        const fullName = `${studentInfo.firstName} ${studentInfo.lastName}`.trim()
        const birthdate = studentInfo.dateOfBirth ? new Date(studentInfo.dateOfBirth) : new Date(2015, 0, 1)

        let student
        if (studentInfo.id) {
          student = await tx.student.update({
            where: { id: studentInfo.id },
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
        } else {
          student = await tx.student.create({
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
        }

        linkedStudents.push({ id: student.id, name: fullName })
      }

      console.log('Creating bookings - igniteSessionId:', subscription.igniteSessionId, 'linkedStudents:', linkedStudents.length)

      if (subscription.igniteSessionId && linkedStudents.length > 0) {
        const igniteSession = IGNITE_SESSIONS.find(s => s.id === subscription.igniteSessionId)
        console.log('Found igniteSession:', igniteSession?.id, igniteSession?.name)

        if (igniteSession) {
          let subscriptionProduct = await tx.product.findFirst({
            where: {
              type: 'SUBSCRIPTION',
              name: { contains: igniteSession.name.split(' - ')[0] },
              isActive: true
            }
          })

          if (!subscriptionProduct) {
            subscriptionProduct = await tx.product.findFirst({
              where: { type: 'SUBSCRIPTION', isActive: true }
            })
          }

          if (!subscriptionProduct) {
            const productName = igniteSession.name.split(' - ')[0] || 'Ignite Sessions'
            subscriptionProduct = await tx.product.create({
              data: {
                name: productName,
                type: 'SUBSCRIPTION',
                price: igniteSession.priceWeekly,
                description: `Weekly ${productName} subscription`,
                ageMin: 5,
                ageMax: 14,
                isActive: true
              }
            })
            console.log('Created subscription product:', subscriptionProduct.id, subscriptionProduct.name)
          }
          console.log('subscriptionProduct:', subscriptionProduct?.id, subscriptionProduct?.name)

          let location = await tx.location.findFirst({
            where: {
              name: { contains: igniteSession.location.split(' ')[0] },
              isActive: true
            }
          })
          console.log('location (first try):', location?.id, location?.name)

          if (!location) {
            location = await tx.location.findFirst({
              where: { isActive: true }
            })
            console.log('location (fallback):', location?.id, location?.name)
          }

          if (subscriptionProduct && location) {
            const term = getSubscriptionStartTerm(new Date())
            console.log('term:', term?.name)

            if (term) {
              const eventsToCreate: Array<{
                title: string
                description: string
                type: 'RECURRING_SESSION'
                status: 'SCHEDULED'
                startDateTime: Date
                endDateTime: Date
                isRecurring: boolean
                maxCapacity: number
                currentCount: number
                locationId: string
              }> = []

              for (const dayName of igniteSession.dayOfWeek) {
                const dayNumber = DAY_NAME_TO_NUMBER[dayName.toLowerCase()]
                if (dayNumber === undefined) continue

                const dates = getTermDatesForDayOfWeek(term, dayNumber)

                for (const date of dates) {
                  if (date < new Date()) continue

                  const [startHour, startMin] = igniteSession.startTime.split(':').map(Number)
                  const [endHour, endMin] = igniteSession.endTime.split(':').map(Number)

                  const startDateTime = new Date(date)
                  startDateTime.setHours(startHour, startMin, 0, 0)

                  const endDateTime = new Date(date)
                  endDateTime.setHours(endHour, endMin, 0, 0)

                  const existingEvent = await tx.event.findFirst({
                    where: {
                      locationId: location.id,
                      startDateTime,
                      type: 'RECURRING_SESSION'
                    }
                  })

                  if (!existingEvent) {
                    eventsToCreate.push({
                      title: `Ignite - ${igniteSession.location}`,
                      description: igniteSession.name,
                      type: 'RECURRING_SESSION',
                      status: 'SCHEDULED',
                      startDateTime,
                      endDateTime,
                      isRecurring: true,
                      maxCapacity: 20,
                      currentCount: linkedStudents.length,
                      locationId: location.id
                    })
                  }
                }
              }

              console.log('eventsToCreate:', eventsToCreate.length)

              let createdEvents: { id: string; startDateTime: Date; endDateTime: Date; locationId: string }[] = []
              if (eventsToCreate.length > 0) {
                await tx.event.createMany({ data: eventsToCreate })
                createdEvents = await tx.event.findMany({
                  where: {
                    locationId: location.id,
                    type: 'RECURRING_SESSION',
                    startDateTime: { gte: new Date() }
                  },
                  select: { id: true, startDateTime: true, endDateTime: true, locationId: true }
                })
                console.log('Created events, found:', createdEvents.length)
              } else {
                createdEvents = await tx.event.findMany({
                  where: {
                    locationId: location.id,
                    type: 'RECURRING_SESSION',
                    startDateTime: { gte: new Date() },
                    status: { not: 'CANCELLED' }
                  },
                  select: { id: true, startDateTime: true, endDateTime: true, locationId: true }
                })
                console.log('Using existing events:', createdEvents.length)
              }

              let bookingsCreated = 0
              for (const student of linkedStudents) {
                for (const event of createdEvents) {
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
                    bookingsCreated++
                  }
                }
              }
              console.log('Bookings created:', bookingsCreated)
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

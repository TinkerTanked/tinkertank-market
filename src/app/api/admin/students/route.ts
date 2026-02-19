import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        _count: {
          select: { bookings: true }
        },
        igniteSubscriptions: {
          include: {
            igniteSubscription: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

interface CreateStudentBody {
  firstName: string
  lastName: string
  dateOfBirth: string
  school?: string
  allergies?: string
  medicalNotes?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateStudentBody = await request.json()

    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    if (!body.dateOfBirth) {
      return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 })
    }

    const fullName = `${body.firstName.trim()} ${body.lastName.trim()}`

    const student = await prisma.student.create({
      data: {
        name: fullName,
        birthdate: new Date(body.dateOfBirth),
        school: body.school || null,
        allergies: body.allergies || null,
        medicalNotes: body.medicalNotes || null,
        emergencyContactName: body.emergencyContactName || null,
        emergencyContactPhone: body.emergencyContactPhone || null
      }
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  }
}

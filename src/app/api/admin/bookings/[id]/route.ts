import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        student: true,
        product: true,
        location: true,
        event: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...booking,
      totalPrice: Number(booking.totalPrice)
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}

interface UpdateBookingBody {
  status?: BookingStatus
  notes?: string
  startDate?: string
  endDate?: string
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body: UpdateBookingBody = await request.json()

    const existing = await prisma.booking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const updateData: {
      status?: BookingStatus
      notes?: string
      startDate?: Date
      endDate?: Date
    } = {}

    if (body.status) {
      updateData.status = body.status
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.startDate) {
      updateData.startDate = new Date(body.startDate)
    }

    if (body.endDate) {
      updateData.endDate = new Date(body.endDate)
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        student: true,
        product: true,
        location: true
      }
    })

    return NextResponse.json({
      ...booking,
      totalPrice: Number(booking.totalPrice)
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.booking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    await prisma.booking.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { AdminCalendarEvent, BookingStatus, PaymentStatus } from '@/types/booking'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const viewType = searchParams.get('view') || 'customer'

    // Generate mock events for testing
    const mockEvents: AdminCalendarEvent[] = [
      {
        id: 'mock-1',
        title: 'Holiday Camp - Robotics',
        start: new Date(),
        end: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        backgroundColor: '#10B981',
        borderColor: '#059669',
        textColor: '#ffffff',
        extendedProps: {
          bookingId: 'booking-1',
          productType: 'CAMP',
          studentName: 'Test Student 1',
          location: 'Neutral Bay',
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          capacity: 12,
          currentBookings: 8,
          product: {
            id: 'prod-1',
            name: 'Holiday Camp - Robotics',
            type: 'CAMP' as any,
            pricing: {
              basePrice: 150,
              currency: 'AUD'
            },
            capacity: 12,
            duration: 240, // 4 hours
            ageRange: {
              minAge: 6,
              maxAge: 12
            },
            description: 'Learn robotics and programming',
            features: ['Robotics', 'Programming', 'STEM Learning'],
            isActive: true
          } as any,
          bookings: [
            {
              id: 'booking-1',
              productId: 'prod-1',
              studentId: 'student-1',
              locationId: 'loc-1',
              startDateTime: new Date(),
              endDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
              status: BookingStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PAID,
              totalAmount: 150,
              amountPaid: 150,
              discountsApplied: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ] as any[],
          availableSpots: 4
        }
      },
      {
        id: 'mock-2',
        title: 'Birthday Party - Tech Adventure',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow + 2 hours
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        textColor: '#ffffff',
        extendedProps: {
          bookingId: 'booking-2',
          productType: 'BIRTHDAY',
          studentName: 'Birthday Kid',
          location: 'Neutral Bay',
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          capacity: 10,
          currentBookings: 1,
          product: {
            id: 'prod-2',
            name: 'Birthday Party - Tech Adventure',
            type: 'BIRTHDAY' as any,
            pricing: {
              basePrice: 200,
              currency: 'AUD'
            },
            capacity: 10,
            duration: 120,
            ageRange: {
              minAge: 5,
              maxAge: 12
            },
            description: 'Tech-themed birthday party',
            features: ['Technology', 'Games', 'Party Fun'],
            isActive: true
          } as any,
          bookings: [
            {
              id: 'booking-2',
              productId: 'prod-2',
              studentId: 'student-2',
              locationId: 'loc-1',
              startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
              endDateTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
              status: BookingStatus.PENDING,
              paymentStatus: PaymentStatus.PENDING,
              totalAmount: 200,
              amountPaid: 0,
              discountsApplied: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ] as any[],
          availableSpots: 9
        }
      },
      {
        id: 'mock-3',
        title: 'Ignite Session - Coding Basics',
        start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours
        backgroundColor: '#6366F1',
        borderColor: '#4F46E5',
        textColor: '#ffffff',
        extendedProps: {
          bookingId: 'booking-3',
          productType: 'IGNITE',
          studentName: 'Keen Learner',
          location: 'Neutral Bay',
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PARTIALLY_PAID,
          capacity: 6,
          currentBookings: 4,
          product: {
            id: 'prod-3',
            name: 'Ignite Session - Coding Basics',
            type: 'IGNITE' as any,
            pricing: {
              basePrice: 75,
              currency: 'AUD'
            },
            capacity: 6,
            duration: 90,
            ageRange: {
              minAge: 8,
              maxAge: 16
            },
            description: 'Introduction to coding concepts',
            features: ['Programming', 'Logic', 'Problem Solving'],
            isActive: true
          } as any,
          bookings: [
            {
              id: 'booking-3',
              productId: 'prod-3',
              studentId: 'student-3',
              locationId: 'loc-1',
              startDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              endDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
              status: BookingStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PARTIALLY_PAID,
              totalAmount: 75,
              amountPaid: 37.50,
              discountsApplied: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ] as any[],
          availableSpots: 2
        }
      }
    ]

    return NextResponse.json({
      success: true,
      events: mockEvents,
      message: 'Mock data - database not connected'
    })

  } catch (error) {
    console.error('Mock calendar events error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate mock events' },
      { status: 500 }
    )
  }
}

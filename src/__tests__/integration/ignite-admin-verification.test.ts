/**
 * Ignite Admin Verification Tests
 * Tests that Ignite subscriptions appear correctly in admin views (bookings list and calendar)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      count: vi.fn(),
      findMany: vi.fn()
    },
    event: {
      findMany: vi.fn()
    }
  }
}));

// Mock data for different Ignite program types
const mockIgniteBookings = [
  {
    id: 'booking_in_school_1',
    student: {
      name: 'Emma Watson',
      birthdate: new Date('2016-05-15'),
      allergies: 'Peanuts'
    },
    product: {
      name: 'In-School Ignite - Balgowlah Heights',
      type: 'SUBSCRIPTION'
    },
    location: {
      name: 'Balgowlah Heights Public School'
    },
    startDate: new Date('2024-10-14T14:30:00Z'),
    endDate: new Date('2024-10-14T15:30:00Z'),
    status: 'CONFIRMED',
    totalPrice: 35.0,
    notes: 'Wednesday sessions only',
    createdAt: new Date('2024-10-01T10:00:00Z')
  },
  {
    id: 'booking_drop_off_1',
    student: {
      name: 'Oliver Smith',
      birthdate: new Date('2015-08-22'),
      allergies: null
    },
    product: {
      name: 'Drop-Off Studio Ignite',
      type: 'SUBSCRIPTION'
    },
    location: {
      name: 'Neutral Bay Studio'
    },
    startDate: new Date('2024-10-14T15:30:00Z'),
    endDate: new Date('2024-10-14T17:30:00Z'),
    status: 'CONFIRMED',
    totalPrice: 95.0,
    notes: 'Mon-Fri subscription',
    createdAt: new Date('2024-10-02T14:00:00Z')
  },
  {
    id: 'booking_pickup_1',
    student: {
      name: 'Sophia Chen',
      birthdate: new Date('2017-02-10'),
      allergies: 'Dairy'
    },
    product: {
      name: 'School Pickup Ignite - Neutral Bay Public',
      type: 'SUBSCRIPTION'
    },
    location: {
      name: 'Neutral Bay Public School'
    },
    startDate: new Date('2024-10-15T15:00:00Z'),
    endDate: new Date('2024-10-15T17:00:00Z'),
    status: 'CONFIRMED',
    totalPrice: 45.0,
    notes: 'Tuesday pickup only',
    createdAt: new Date('2024-10-03T09:00:00Z')
  }
];

// Mock camp booking for comparison
const mockCampBooking = {
  id: 'booking_camp_1',
  student: {
    name: 'Liam Johnson',
    birthdate: new Date('2014-11-30'),
    allergies: null
  },
  product: {
    name: 'Summer STEM Camp',
    type: 'CAMP'
  },
  location: {
    name: 'Neutral Bay Studio'
  },
  startDate: new Date('2024-12-15T09:00:00Z'),
  endDate: new Date('2024-12-15T15:00:00Z'),
  status: 'CONFIRMED',
  totalPrice: 150.0,
  notes: null,
  createdAt: new Date('2024-10-04T11:00:00Z')
};

describe('Admin Bookings API for Ignite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return Ignite subscriptions in booking list', async () => {
    (prisma.booking.count as any).mockResolvedValue(3);
    (prisma.booking.findMany as any).mockResolvedValue(mockIgniteBookings);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.bookings).toHaveLength(3);
    expect(data.bookings.every((b: any) => b.product.type === 'SUBSCRIPTION')).toBe(true);
    expect(data.total).toBe(3);
  });

  it('should filter by productType SUBSCRIPTION', async () => {
    (prisma.booking.count as any).mockResolvedValue(3);
    (prisma.booking.findMany as any).mockResolvedValue(mockIgniteBookings);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings?productType=SUBSCRIPTION');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ product: { type: 'SUBSCRIPTION' } })
          ])
        })
      })
    );
    expect(data.bookings).toHaveLength(3);
  });

  it('should search by student name and find Ignite bookings', async () => {
    const emmaBooking = mockIgniteBookings.filter(b => b.student.name.includes('Emma'));
    (prisma.booking.count as any).mockResolvedValue(1);
    (prisma.booking.findMany as any).mockResolvedValue(emmaBooking);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings?search=Emma');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({ student: { name: { contains: 'Emma', mode: 'insensitive' } } })
              ])
            })
          ])
        })
      })
    );
    expect(data.bookings).toHaveLength(1);
    expect(data.bookings[0].student.name).toBe('Emma Watson');
  });

  it('should filter by date range for recurring subscriptions', async () => {
    (prisma.booking.count as any).mockResolvedValue(2);
    (prisma.booking.findMany as any).mockResolvedValue(mockIgniteBookings.slice(0, 2));

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings?dateRange=this_week');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              startDate: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date)
              })
            })
          ])
        })
      })
    );
  });

  it('should return correct response format for Ignite bookings', async () => {
    (prisma.booking.count as any).mockResolvedValue(1);
    (prisma.booking.findMany as any).mockResolvedValue([mockIgniteBookings[0]]);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verify response structure
    expect(data).toHaveProperty('bookings');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('totalPages');
    expect(data).toHaveProperty('currentPage');

    // Verify booking structure
    const booking = data.bookings[0];
    expect(booking).toHaveProperty('id');
    expect(booking).toHaveProperty('student');
    expect(booking.student).toHaveProperty('name');
    expect(booking.student).toHaveProperty('birthdate');
    expect(booking.student).toHaveProperty('allergies');
    expect(booking).toHaveProperty('product');
    expect(booking.product).toHaveProperty('name');
    expect(booking.product).toHaveProperty('type');
    expect(booking).toHaveProperty('location');
    expect(booking.location).toHaveProperty('name');
    expect(booking).toHaveProperty('startDate');
    expect(booking).toHaveProperty('endDate');
    expect(booking).toHaveProperty('status');
    expect(booking).toHaveProperty('totalPrice');
    expect(booking).toHaveProperty('notes');
  });

  it('should handle pagination correctly for Ignite bookings', async () => {
    (prisma.booking.count as any).mockResolvedValue(50);
    (prisma.booking.findMany as any).mockResolvedValue(mockIgniteBookings);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings?page=2&limit=20');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20
      })
    );
    expect(data.totalPages).toBe(3);
    expect(data.currentPage).toBe(2);
  });
});

describe('Admin Bookings Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display correct student info for Ignite bookings', async () => {
    (prisma.booking.count as any).mockResolvedValue(1);
    (prisma.booking.findMany as any).mockResolvedValue([mockIgniteBookings[0]]);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings');

    const response = await GET(request);
    const data = await response.json();

    const booking = data.bookings[0];
    expect(booking.student.name).toBe('Emma Watson');
    expect(booking.student.allergies).toBe('Peanuts');
  });

  it('should display correct session details for single-day Ignite', async () => {
    (prisma.booking.count as any).mockResolvedValue(1);
    (prisma.booking.findMany as any).mockResolvedValue([mockIgniteBookings[0]]);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings');

    const response = await GET(request);
    const data = await response.json();

    const booking = data.bookings[0];
    expect(booking.startDate).toBeDefined();
    expect(booking.endDate).toBeDefined();
    expect(typeof booking.startDate).toBe('string');
    expect(typeof booking.endDate).toBe('string');

    // Verify times are parseable as ISO dates
    expect(() => new Date(booking.startDate)).not.toThrow();
    expect(() => new Date(booking.endDate)).not.toThrow();
  });

  it('should display correct pricing for Ignite subscriptions', async () => {
    (prisma.booking.count as any).mockResolvedValue(3);
    (prisma.booking.findMany as any).mockResolvedValue(mockIgniteBookings);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings');

    const response = await GET(request);
    const data = await response.json();

    // In-school Ignite pricing
    expect(data.bookings[0].totalPrice).toBe(35.0);

    // Drop-off Ignite pricing (Mon-Fri)
    expect(data.bookings[1].totalPrice).toBe(95.0);

    // School pickup Ignite pricing
    expect(data.bookings[2].totalPrice).toBe(45.0);

    // Verify all prices are numbers
    data.bookings.forEach((booking: any) => {
      expect(typeof booking.totalPrice).toBe('number');
    });
  });

  it('should display correct program type for Ignite bookings', async () => {
    (prisma.booking.count as any).mockResolvedValue(3);
    (prisma.booking.findMany as any).mockResolvedValue(mockIgniteBookings);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings');

    const response = await GET(request);
    const data = await response.json();

    // All should have SUBSCRIPTION type
    data.bookings.forEach((booking: any) => {
      expect(booking.product.type).toBe('SUBSCRIPTION');
    });

    // Verify program names
    expect(data.bookings[0].product.name).toContain('In-School Ignite');
    expect(data.bookings[1].product.name).toContain('Drop-Off Studio Ignite');
    expect(data.bookings[2].product.name).toContain('School Pickup Ignite');
  });

  it('should differentiate Ignite bookings from Camp bookings', async () => {
    const allBookings = [...mockIgniteBookings, mockCampBooking];
    (prisma.booking.count as any).mockResolvedValue(4);
    (prisma.booking.findMany as any).mockResolvedValue(allBookings);

    const { GET } = await import('@/app/api/admin/bookings/route');
    const request = new NextRequest('http://localhost:3000/api/admin/bookings');

    const response = await GET(request);
    const data = await response.json();

    const subscriptionBookings = data.bookings.filter((b: any) => b.product.type === 'SUBSCRIPTION');
    const campBookings = data.bookings.filter((b: any) => b.product.type === 'CAMP');

    expect(subscriptionBookings).toHaveLength(3);
    expect(campBookings).toHaveLength(1);
    expect(campBookings[0].product.name).toBe('Summer STEM Camp');
  });
});

describe('Admin Calendar View for Ignite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockEvent = (overrides: any) => ({
    id: 'event_1',
    title: 'Test Event',
    startDateTime: new Date('2024-10-16T14:30:00Z'),
    endDateTime: new Date('2024-10-16T15:30:00Z'),
    type: 'SUBSCRIPTION',
    status: 'SCHEDULED',
    maxCapacity: 10,
    currentCount: 1,
    ageMin: 5,
    ageMax: 12,
    description: null,
    instructorNotes: null,
    isRecurring: true,
    location: { name: 'Test Location' },
    bookings: [{
      id: 'booking_1',
      status: 'CONFIRMED',
      student: { id: 'student_1', name: 'Test Student', birthdate: new Date('2016-01-01'), allergies: null },
      product: { name: 'Test Product' }
    }],
    recurringTemplate: null,
    ...overrides
  });

  it('should return recurring Ignite sessions on correct days', async () => {
    const wednesdaySessions = [
      createMockEvent({ id: 'event_wed_1', title: 'In-School Ignite - Emma Watson', startDateTime: new Date('2024-10-09T14:30:00Z'), endDateTime: new Date('2024-10-09T15:30:00Z'), location: { name: 'Balgowlah Heights Public School' } }),
      createMockEvent({ id: 'event_wed_2', title: 'In-School Ignite - Emma Watson', startDateTime: new Date('2024-10-16T14:30:00Z'), endDateTime: new Date('2024-10-16T15:30:00Z'), location: { name: 'Balgowlah Heights Public School' } }),
      createMockEvent({ id: 'event_wed_3', title: 'In-School Ignite - Emma Watson', startDateTime: new Date('2024-10-23T14:30:00Z'), endDateTime: new Date('2024-10-23T15:30:00Z'), location: { name: 'Balgowlah Heights Public School' } })
    ];

    (prisma.event.findMany as any).mockResolvedValue(wednesdaySessions);

    const { GET } = await import('@/app/api/events/fullcalendar/route');
    const request = new NextRequest('http://localhost:3000/api/events/fullcalendar?start=2024-10-01T00:00:00Z&end=2024-10-31T23:59:59Z&view=admin');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);

    data.forEach((event: any) => {
      const date = new Date(event.start);
      expect(date.getUTCDay()).toBe(3); // Wednesday (UTC)
    });
  });

  it('should show Mon-Fri subscriptions on all 5 weekdays', async () => {
    const monFriEvents = [
      createMockEvent({ id: 'event_mon', title: 'Drop-Off Ignite - Oliver Smith', startDateTime: new Date('2024-10-14T05:30:00Z'), endDateTime: new Date('2024-10-14T07:30:00Z'), location: { name: 'Neutral Bay Studio' } }),
      createMockEvent({ id: 'event_tue', title: 'Drop-Off Ignite - Oliver Smith', startDateTime: new Date('2024-10-15T05:30:00Z'), endDateTime: new Date('2024-10-15T07:30:00Z'), location: { name: 'Neutral Bay Studio' } }),
      createMockEvent({ id: 'event_wed', title: 'Drop-Off Ignite - Oliver Smith', startDateTime: new Date('2024-10-16T05:30:00Z'), endDateTime: new Date('2024-10-16T07:30:00Z'), location: { name: 'Neutral Bay Studio' } }),
      createMockEvent({ id: 'event_thu', title: 'Drop-Off Ignite - Oliver Smith', startDateTime: new Date('2024-10-17T05:30:00Z'), endDateTime: new Date('2024-10-17T07:30:00Z'), location: { name: 'Neutral Bay Studio' } }),
      createMockEvent({ id: 'event_fri', title: 'Drop-Off Ignite - Oliver Smith', startDateTime: new Date('2024-10-18T05:30:00Z'), endDateTime: new Date('2024-10-18T07:30:00Z'), location: { name: 'Neutral Bay Studio' } })
    ];

    (prisma.event.findMany as any).mockResolvedValue(monFriEvents);

    const { GET } = await import('@/app/api/events/fullcalendar/route');
    const request = new NextRequest('http://localhost:3000/api/events/fullcalendar?start=2024-10-14T00:00:00Z&end=2024-10-20T23:59:59Z&view=admin');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(5);

    const daysOfWeek = data.map((event: any) => new Date(event.start).getUTCDay());
    expect(daysOfWeek).toContain(1); // Monday
    expect(daysOfWeek).toContain(2); // Tuesday
    expect(daysOfWeek).toContain(3); // Wednesday
    expect(daysOfWeek).toContain(4); // Thursday
    expect(daysOfWeek).toContain(5); // Friday
    expect(daysOfWeek).not.toContain(0); // No Sunday
    expect(daysOfWeek).not.toContain(6); // No Saturday
  });

  it('should show single-day subscription only on that day', async () => {
    const tuesdayOnlyEvents = [
      createMockEvent({ id: 'event_tue_1', title: 'School Pickup Ignite - Sophia Chen', startDateTime: new Date('2024-10-15T05:00:00Z'), endDateTime: new Date('2024-10-15T07:00:00Z'), location: { name: 'Neutral Bay Public School' } }),
      createMockEvent({ id: 'event_tue_2', title: 'School Pickup Ignite - Sophia Chen', startDateTime: new Date('2024-10-22T05:00:00Z'), endDateTime: new Date('2024-10-22T07:00:00Z'), location: { name: 'Neutral Bay Public School' } }),
      createMockEvent({ id: 'event_tue_3', title: 'School Pickup Ignite - Sophia Chen', startDateTime: new Date('2024-10-29T05:00:00Z'), endDateTime: new Date('2024-10-29T07:00:00Z'), location: { name: 'Neutral Bay Public School' } })
    ];

    (prisma.event.findMany as any).mockResolvedValue(tuesdayOnlyEvents);

    const { GET } = await import('@/app/api/events/fullcalendar/route');
    const request = new NextRequest('http://localhost:3000/api/events/fullcalendar?start=2024-10-01T00:00:00Z&end=2024-10-31T23:59:59Z&view=admin');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);

    data.forEach((event: any) => {
      const date = new Date(event.start);
      expect(date.getUTCDay()).toBe(2); // Tuesday (UTC)
    });
  });

  it('should return calendar events with correct time slots', async () => {
    const igniteEvents = [
      createMockEvent({ id: 'event_1', title: 'In-School Ignite - Emma Watson', startDateTime: new Date('2024-10-16T14:30:00Z'), endDateTime: new Date('2024-10-16T15:30:00Z'), location: { name: 'Balgowlah Heights Public School' } }),
      createMockEvent({ id: 'event_2', title: 'Drop-Off Ignite - Oliver Smith', startDateTime: new Date('2024-10-16T15:30:00Z'), endDateTime: new Date('2024-10-16T17:30:00Z'), location: { name: 'Neutral Bay Studio' } })
    ];

    (prisma.event.findMany as any).mockResolvedValue(igniteEvents);

    const { GET } = await import('@/app/api/events/fullcalendar/route');
    const request = new NextRequest('http://localhost:3000/api/events/fullcalendar?start=2024-10-16T00:00:00Z&end=2024-10-16T23:59:59Z&view=admin');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);

    data.forEach((event: any) => {
      expect(event).toHaveProperty('start');
      expect(event).toHaveProperty('end');
      expect(event).toHaveProperty('title');
    });

    const inSchoolEvent = data.find((e: any) => e.title.includes('In-School'));
    const inSchoolStart = new Date(inSchoolEvent.start);
    const inSchoolEnd = new Date(inSchoolEvent.end);
    const inSchoolDuration = (inSchoolEnd.getTime() - inSchoolStart.getTime()) / (1000 * 60);
    expect(inSchoolDuration).toBe(60); // 1 hour

    const dropOffEvent = data.find((e: any) => e.title.includes('Drop-Off'));
    const dropOffStart = new Date(dropOffEvent.start);
    const dropOffEnd = new Date(dropOffEvent.end);
    const dropOffDuration = (dropOffEnd.getTime() - dropOffStart.getTime()) / (1000 * 60);
    expect(dropOffDuration).toBe(120); // 2 hours
  });

  it('should filter calendar events by date range', async () => {
    (prisma.event.findMany as any).mockResolvedValue([]);

    const { GET } = await import('@/app/api/events/fullcalendar/route');
    const request = new NextRequest('http://localhost:3000/api/events/fullcalendar?start=2024-10-01T00:00:00Z&end=2024-10-31T23:59:59Z');

    await GET(request);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startDateTime: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date)
          })
        })
      })
    );
  });

  it('should include location info in calendar events', async () => {
    const eventsWithLocations = [
      createMockEvent({ id: 'event_1', title: 'In-School Ignite - Emma Watson', startDateTime: new Date('2024-10-16T14:30:00Z'), endDateTime: new Date('2024-10-16T15:30:00Z'), location: { name: 'Balgowlah Heights Public School' } })
    ];

    (prisma.event.findMany as any).mockResolvedValue(eventsWithLocations);

    const { GET } = await import('@/app/api/events/fullcalendar/route');
    const request = new NextRequest('http://localhost:3000/api/events/fullcalendar?start=2024-10-16T00:00:00Z&end=2024-10-16T23:59:59Z&view=admin');

    const response = await GET(request);
    const data = await response.json();

    expect(data[0].extendedProps?.location).toBe('Balgowlah Heights Public School');
  });
});

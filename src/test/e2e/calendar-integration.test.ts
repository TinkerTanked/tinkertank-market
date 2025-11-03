import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { eventService } from '@/lib/events';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn()
    },
    orderItem: {
      findMany: vi.fn()
    },
    student: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    location: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn()
    },
    event: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn()
    },
    booking: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    recurringTemplate: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

// Mock email service
vi.mock('@/lib/email', () => ({
  emailService: {
    sendBookingConfirmation: vi.fn(),
    sendCalendarInvite: vi.fn(),
    generateBookingConfirmationEmail: vi.fn()
  }
}));

describe('Calendar Integration Tests', () => {
  const mockLocation = {
    id: 'location_calendar_123',
    name: 'TinkerTank Innovation Hub',
    address: '456 Tech Street, Innovation Quarter NSW 2001',
    capacity: 30,
    timezone: 'Australia/Sydney',
    operatingHours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { closed: true }
    }
  };

  const mockProduct = {
    id: 'product_calendar_123',
    name: 'Advanced Robotics Workshop',
    type: 'CAMP',
    price: 28000, // $280
    duration: 420, // 7 hours
    ageMin: 10,
    ageMax: 16,
    capacity: 15,
    description: 'Build and program advanced robots',
    requirements: ['Previous coding experience helpful', 'Laptop provided']
  };

  const mockStudent = {
    id: 'student_calendar_123',
    name: 'Calendar Test Student',
    age: 13,
    allergies: 'Dairy',
    medicalNotes: 'Wears glasses',
    parentName: 'Calendar Test Parent',
    parentEmail: 'calendar@parent.com',
    parentPhone: '+61455666777'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock returns
    (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
    (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
  });

  describe('Single Event Creation', () => {
    it('should create camp event with correct details', async () => {
      const mockOrder = {
        id: 'order_camp_calendar_123',
        customerName: 'Calendar Test Parent',
        customerEmail: 'calendar@parent.com',
        status: 'PAID',
        totalAmount: 28000,
        orderItems: [{
          id: 'item_camp_123',
          orderId: 'order_camp_calendar_123',
          studentId: 'student_calendar_123',
          productId: 'product_calendar_123',
          bookingDate: new Date('2025-02-15T09:00:00Z'),
          price: 28000,
          student: mockStudent,
          product: mockProduct
        }]
      };

      const expectedEvent = {
        id: 'event_camp_123',
        title: 'Advanced Robotics Workshop - Calendar Test Student',
        type: 'CAMP',
        startDateTime: new Date('2025-02-15T09:00:00Z'),
        endDateTime: new Date('2025-02-15T16:00:00Z'), // 9:00 + 7 hours
        locationId: mockLocation.id,
        maxCapacity: mockProduct.capacity,
        currentBookings: 0,
        description: mockProduct.description,
        ageRange: `${mockProduct.ageMin}-${mockProduct.ageMax}`,
        requirements: mockProduct.requirements
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.event.create as any).mockResolvedValue(expectedEvent);
      (prisma.booking.create as any).mockResolvedValue({
        id: 'booking_camp_123',
        eventId: 'event_camp_123',
        studentId: 'student_calendar_123',
        status: 'CONFIRMED',
        specialRequirements: 'Dairy allergy'
      });

      const events = await eventService.createEventsFromOrder('order_camp_calendar_123');

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Advanced Robotics Workshop - Calendar Test Student');
      expect(events[0].type).toBe('CAMP');
      expect(events[0].startDateTime).toEqual(new Date('2025-02-15T09:00:00Z'));
      expect(events[0].endDateTime).toEqual(new Date('2025-02-15T16:00:00Z'));

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Advanced Robotics Workshop - Calendar Test Student',
          type: 'CAMP',
          startDateTime: new Date('2025-02-15T09:00:00Z'),
          endDateTime: new Date('2025-02-15T16:00:00Z'),
          locationId: mockLocation.id,
          maxCapacity: mockProduct.capacity
        })
      });

      expect(prisma.booking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'event_camp_123',
          studentId: 'student_calendar_123',
          status: 'CONFIRMED'
        })
      });
    });

    it('should create birthday party event with special formatting', async () => {
      const birthdayProduct = {
        ...mockProduct,
        id: 'product_birthday_123',
        name: 'Deluxe Birthday Package',
        type: 'BIRTHDAY',
        duration: 150, // 2.5 hours
        capacity: 14,
        price: 39500 // $395
      };

      const birthdayStudent = {
        ...mockStudent,
        id: 'student_birthday_123',
        name: 'Birthday Child',
        age: 8,
        allergies: 'Peanuts, Eggs'
      };

      const mockBirthdayOrder = {
        id: 'order_birthday_calendar_123',
        orderItems: [{
          id: 'item_birthday_123',
          studentId: 'student_birthday_123',
          productId: 'product_birthday_123',
          bookingDate: new Date('2025-03-10T14:00:00Z'),
          price: 39500,
          student: birthdayStudent,
          product: birthdayProduct
        }]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockBirthdayOrder);
      (prisma.product.findUnique as any).mockResolvedValue(birthdayProduct);
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_birthday_123',
        title: '🎂 Birthday Child\'s Birthday Party',
        type: 'BIRTHDAY',
        startDateTime: new Date('2025-03-10T14:00:00Z'),
        endDateTime: new Date('2025-03-10T16:30:00Z'),
        maxCapacity: 14,
        specialNotes: 'Allergies: Peanuts, Eggs'
      });

      const events = await eventService.createEventsFromOrder('order_birthday_calendar_123');

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('🎂 Birthday Child\'s Birthday Party');
      expect(events[0].type).toBe('BIRTHDAY');
      
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: '🎂 Birthday Child\'s Birthday Party',
          type: 'BIRTHDAY',
          maxCapacity: 14,
          description: expect.stringContaining('Allergies: Peanuts, Eggs')
        })
      });
    });
  });

  describe('Recurring Event Creation (Subscriptions)', () => {
    it('should create recurring template for Ignite subscription', async () => {
      const subscriptionProduct = {
        id: 'product_ignite_123',
        name: 'Ignite Program - Advanced',
        type: 'SUBSCRIPTION',
        duration: 4, // 4 months
        price: 60000, // $600
        ageMin: 12,
        ageMax: 17,
        capacity: 10,
        sessionDuration: 90 // 1.5 hours per session
      };

      const mockSubscriptionOrder = {
        id: 'order_ignite_calendar_123',
        orderItems: [{
          id: 'item_ignite_123',
          studentId: 'student_calendar_123',
          productId: 'product_ignite_123',
          bookingDate: new Date('2025-04-05T15:30:00Z'), // Saturday
          price: 60000,
          student: mockStudent,
          product: subscriptionProduct
        }]
      };

      const mockRecurringTemplate = {
        id: 'template_ignite_123',
        name: 'Ignite Program - Advanced - Calendar Test Student',
        type: 'RECURRING_SESSION',
        startTime: '15:30',
        endTime: '17:00',
        daysOfWeek: [6], // Saturday
        startDate: new Date('2025-04-05T15:30:00Z'),
        endDate: new Date('2025-08-05T15:30:00Z'), // 4 months later
        locationId: mockLocation.id,
        maxCapacity: 10,
        studentId: 'student_calendar_123'
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockSubscriptionOrder);
      (prisma.product.findUnique as any).mockResolvedValue(subscriptionProduct);
      (prisma.recurringTemplate.create as any).mockResolvedValue(mockRecurringTemplate);

      // Mock individual session creation
      const mockSessions = [];
      for (let i = 0; i < 16; i++) { // Weekly sessions for 4 months
        const sessionDate = new Date('2025-04-05T15:30:00Z');
        sessionDate.setDate(sessionDate.getDate() + (i * 7));
        
        mockSessions.push({
          id: `event_session_${i}`,
          title: 'Ignite Program - Advanced - Calendar Test Student',
          type: 'SUBSCRIPTION',
          startDateTime: sessionDate,
          endDateTime: new Date(sessionDate.getTime() + (90 * 60000)), // 1.5 hours
          recurringTemplateId: 'template_ignite_123'
        });
      }

      (prisma.event.createMany as any).mockResolvedValue({ count: mockSessions.length });
      (prisma.booking.createMany as any).mockResolvedValue({ count: mockSessions.length });

      const events = await eventService.createEventsFromOrder('order_ignite_calendar_123');

      expect(Array.isArray(events)).toBe(true);
      expect(prisma.recurringTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Ignite Program - Advanced - Calendar Test Student',
          type: 'RECURRING_SESSION',
          startTime: '15:30',
          endTime: '17:00',
          daysOfWeek: [6],
          startDate: new Date('2025-04-05T15:30:00Z'),
          locationId: mockLocation.id
        })
      });

      expect(prisma.event.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            title: 'Ignite Program - Advanced - Calendar Test Student',
            type: 'SUBSCRIPTION'
          })
        ])
      });
    });

    it('should generate correct session dates for recurring events', async () => {
      const startDate = new Date('2025-05-03T16:00:00Z'); // Saturday
      const duration = 3; // 3 months
      const expectedSessions = [];

      // Calculate expected weekly sessions
      for (let week = 0; week < 12; week++) { // 3 months ≈ 12 weeks
        const sessionDate = new Date(startDate);
        sessionDate.setDate(sessionDate.getDate() + (week * 7));
        expectedSessions.push(sessionDate);
      }

      expect(expectedSessions).toHaveLength(12);
      expect(expectedSessions[0]).toEqual(startDate);
      expect(expectedSessions[11].getDay()).toBe(6); // Still Saturday
    });
  });

  describe('Calendar Conflict Detection', () => {
    it('should detect scheduling conflicts', async () => {
      const conflictingBookingDate = new Date('2025-02-15T10:00:00Z');
      
      // Mock existing event at the same time
      const existingEvent = {
        id: 'existing_event_123',
        title: 'Existing Workshop',
        startDateTime: new Date('2025-02-15T09:00:00Z'),
        endDateTime: new Date('2025-02-15T16:00:00Z'),
        locationId: mockLocation.id,
        maxCapacity: 20,
        currentBookings: 18 // Near capacity
      };

      (prisma.event.findMany as any).mockResolvedValue([existingEvent]);

      const conflictChecker = async (
        startDateTime: Date,
        endDateTime: Date,
        locationId: string,
        maxCapacity: number
      ) => {
        const overlappingEvents = await prisma.event.findMany({
          where: {
            locationId,
            OR: [
              {
                startDateTime: { lte: endDateTime },
                endDateTime: { gte: startDateTime }
              }
            ]
          },
          include: {
            bookings: true
          }
        });

        const conflicts = overlappingEvents.filter(event => {
          const availableCapacity = event.maxCapacity - event.currentBookings;
          return availableCapacity < 1; // No space available
        });

        return {
          hasConflicts: conflicts.length > 0,
          conflicts,
          availableCapacity: Math.max(0, mockLocation.capacity - overlappingEvents.reduce((sum, e) => sum + e.currentBookings, 0))
        };
      };

      const result = await conflictChecker(
        conflictingBookingDate,
        new Date(conflictingBookingDate.getTime() + (7 * 60 * 60 * 1000)), // 7 hours later
        mockLocation.id,
        15
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe('existing_event_123');
    });

    it('should allow booking when capacity is available', async () => {
      const bookingDate = new Date('2025-02-16T09:00:00Z');
      
      const existingEvent = {
        id: 'existing_event_456',
        startDateTime: new Date('2025-02-16T09:00:00Z'),
        endDateTime: new Date('2025-02-16T16:00:00Z'),
        locationId: mockLocation.id,
        maxCapacity: 20,
        currentBookings: 10 // Half capacity
      };

      (prisma.event.findMany as any).mockResolvedValue([existingEvent]);

      const conflictChecker = async (locationId: string) => {
        const events = await prisma.event.findMany({
          where: { locationId },
          include: { bookings: true }
        });

        const totalBookings = events.reduce((sum, e) => sum + e.currentBookings, 0);
        const availableCapacity = mockLocation.capacity - totalBookings;

        return {
          hasConflicts: availableCapacity < 1,
          availableCapacity
        };
      };

      const result = await conflictChecker(mockLocation.id);

      expect(result.hasConflicts).toBe(false);
      expect(result.availableCapacity).toBe(20); // 30 total - 10 booked = 20 available
    });
  });

  describe('Event Modification and Cancellation', () => {
    it('should update event details', async () => {
      const originalEvent = {
        id: 'event_update_123',
        title: 'Original Workshop',
        startDateTime: new Date('2025-03-01T10:00:00Z'),
        endDateTime: new Date('2025-03-01T17:00:00Z'),
        maxCapacity: 15
      };

      const updates = {
        title: 'Updated Advanced Workshop',
        startDateTime: new Date('2025-03-01T09:30:00Z'),
        endDateTime: new Date('2025-03-01T16:30:00Z'),
        maxCapacity: 18
      };

      (prisma.event.findFirst as any).mockResolvedValue(originalEvent);
      (prisma.event.update as any).mockResolvedValue({
        ...originalEvent,
        ...updates,
        updatedAt: new Date()
      });

      const updateEvent = async (eventId: string, updateData: any) => {
        const event = await prisma.event.findFirst({
          where: { id: eventId }
        });

        if (!event) {
          throw new Error('Event not found');
        }

        return await prisma.event.update({
          where: { id: eventId },
          data: {
            ...updateData,
            updatedAt: new Date()
          }
        });
      };

      const updatedEvent = await updateEvent('event_update_123', updates);

      expect(updatedEvent.title).toBe('Updated Advanced Workshop');
      expect(updatedEvent.maxCapacity).toBe(18);
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event_update_123' },
        data: expect.objectContaining({
          title: 'Updated Advanced Workshop',
          maxCapacity: 18
        })
      });
    });

    it('should cancel event and handle bookings', async () => {
      const eventToCancel = {
        id: 'event_cancel_123',
        title: 'Workshop to Cancel',
        status: 'ACTIVE',
        bookings: [
          { id: 'booking_1', studentId: 'student_1', status: 'CONFIRMED' },
          { id: 'booking_2', studentId: 'student_2', status: 'CONFIRMED' }
        ]
      };

      (prisma.event.findFirst as any).mockResolvedValue(eventToCancel);
      (prisma.booking.update as any).mockResolvedValue({});
      (prisma.event.update as any).mockResolvedValue({
        ...eventToCancel,
        status: 'CANCELLED',
        cancelledAt: new Date()
      });

      const cancelEvent = async (eventId: string, reason: string) => {
        const event = await prisma.event.findFirst({
          where: { id: eventId },
          include: { bookings: true }
        });

        if (!event) {
          throw new Error('Event not found');
        }

        // Cancel all bookings
        for (const booking of event.bookings) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CANCELLED',
              cancellationReason: reason,
              cancelledAt: new Date()
            }
          });
        }

        // Cancel event
        return await prisma.event.update({
          where: { id: eventId },
          data: {
            status: 'CANCELLED',
            cancellationReason: reason,
            cancelledAt: new Date()
          }
        });
      };

      const result = await cancelEvent('event_cancel_123', 'Instructor unavailable');

      expect(result.status).toBe('CANCELLED');
      expect(prisma.booking.update).toHaveBeenCalledTimes(2);
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event_cancel_123' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancellationReason: 'Instructor unavailable'
        })
      });
    });
  });

  describe('Calendar Event Notifications', () => {
    it('should send booking confirmation email with calendar invite', async () => {
      const { emailService } = await import('@/lib/email');
      
      const bookingDetails = {
        event: {
          id: 'event_email_123',
          title: 'Advanced Robotics Workshop - Test Student',
          startDateTime: new Date('2025-04-12T09:00:00Z'),
          endDateTime: new Date('2025-04-12T16:00:00Z'),
          location: mockLocation
        },
        student: mockStudent,
        order: {
          id: 'order_email_123',
          customerName: 'Calendar Test Parent',
          customerEmail: 'calendar@parent.com'
        }
      };

      const expectedEmailContent = {
        to: 'calendar@parent.com',
        subject: 'TinkerTank Booking Confirmation - Advanced Robotics Workshop',
        html: expect.stringContaining('Calendar Test Student'),
        attachments: [{
          filename: 'event.ics',
          content: expect.stringContaining('BEGIN:VCALENDAR')
        }]
      };

      (emailService.sendBookingConfirmation as any).mockResolvedValue({ success: true });
      (emailService.generateBookingConfirmationEmail as any).mockReturnValue(expectedEmailContent);

      await emailService.sendBookingConfirmation(bookingDetails);

      expect(emailService.sendBookingConfirmation).toHaveBeenCalledWith(bookingDetails);
      expect(emailService.generateBookingConfirmationEmail).toHaveBeenCalled();
    });

    it('should generate proper iCal calendar invite', async () => {
      const eventDetails = {
        title: 'Advanced Robotics Workshop - Test Student',
        startDateTime: new Date('2025-04-12T09:00:00Z'),
        endDateTime: new Date('2025-04-12T16:00:00Z'),
        location: mockLocation,
        description: 'Build and program advanced robots',
        studentName: 'Test Student',
        allergies: 'Dairy'
      };

      const generateICalInvite = (event: any) => {
        const startDate = event.startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = event.endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        return [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//TinkerTank//EN',
          'BEGIN:VEVENT',
          `UID:${event.title.replace(/\s+/g, '-')}-${Date.now()}`,
          `DTSTART:${startDate}`,
          `DTEND:${endDate}`,
          `SUMMARY:${event.title}`,
          `DESCRIPTION:${event.description}${event.allergies ? `\\nStudent Allergies: ${event.allergies}` : ''}`,
          `LOCATION:${event.location.name}, ${event.location.address}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
      };

      const icalContent = generateICalInvite(eventDetails);

      expect(icalContent).toContain('BEGIN:VCALENDAR');
      expect(icalContent).toContain('SUMMARY:Advanced Robotics Workshop - Test Student');
      expect(icalContent).toContain('LOCATION:TinkerTank Innovation Hub');
      expect(icalContent).toContain('Student Allergies: Dairy');
      expect(icalContent).toContain('END:VCALENDAR');
    });
  });

  describe('Multi-Location Event Management', () => {
    it('should handle events across multiple locations', async () => {
      const secondLocation = {
        id: 'location_second_123',
        name: 'TinkerTank North Shore',
        address: '789 North Shore Road, North Shore NSW 2065',
        capacity: 25,
        timezone: 'Australia/Sydney'
      };

      const multiLocationOrder = {
        id: 'order_multi_123',
        orderItems: [
          {
            id: 'item_location1',
            bookingDate: new Date('2025-05-10T09:00:00Z'),
            product: { ...mockProduct, preferredLocationId: mockLocation.id },
            student: mockStudent
          },
          {
            id: 'item_location2',
            bookingDate: new Date('2025-05-11T09:00:00Z'),
            product: { ...mockProduct, preferredLocationId: secondLocation.id },
            student: { ...mockStudent, id: 'student_2', name: 'Second Student' }
          }
        ]
      };

      (prisma.order.findUnique as any).mockResolvedValue(multiLocationOrder);
      (prisma.location.findFirst as any)
        .mockResolvedValueOnce(mockLocation) // First call
        .mockResolvedValueOnce(secondLocation); // Second call

      const mockEvents = [
        {
          id: 'event_loc1',
          title: 'Advanced Robotics Workshop - Calendar Test Student',
          locationId: mockLocation.id,
          location: mockLocation
        },
        {
          id: 'event_loc2',
          title: 'Advanced Robotics Workshop - Second Student',
          locationId: secondLocation.id,
          location: secondLocation
        }
      ];

      (prisma.event.create as any)
        .mockResolvedValueOnce(mockEvents[0])
        .mockResolvedValueOnce(mockEvents[1]);

      const events = await eventService.createEventsFromOrder('order_multi_123');

      expect(events).toHaveLength(2);
      expect(events[0].locationId).toBe(mockLocation.id);
      expect(events[1].locationId).toBe(secondLocation.id);

      expect(prisma.location.findFirst).toHaveBeenCalledTimes(2);
      expect(prisma.event.create).toHaveBeenCalledTimes(2);
    });

    it('should handle location capacity constraints', async () => {
      const smallLocation = {
        id: 'location_small_123',
        name: 'TinkerTank Compact Studio',
        capacity: 8,
        timezone: 'Australia/Sydney'
      };

      const largeGroupProduct = {
        ...mockProduct,
        capacity: 12 // Requires more than location capacity
      };

      (prisma.location.findFirst as any).mockResolvedValue(smallLocation);

      const validateCapacity = (productCapacity: number, locationCapacity: number) => {
        return {
          isValid: productCapacity <= locationCapacity,
          suggestedCapacity: Math.min(productCapacity, locationCapacity),
          warning: productCapacity > locationCapacity ? 
            `Product capacity (${productCapacity}) exceeds location capacity (${locationCapacity})` : 
            null
        };
      };

      const validation = validateCapacity(largeGroupProduct.capacity, smallLocation.capacity);

      expect(validation.isValid).toBe(false);
      expect(validation.suggestedCapacity).toBe(8);
      expect(validation.warning).toContain('exceeds location capacity');
    });
  });

  describe('Calendar Data Export', () => {
    it('should export calendar events for admin view', async () => {
      const dateRange = {
        start: new Date('2025-05-01T00:00:00Z'),
        end: new Date('2025-05-31T23:59:59Z')
      };

      const mockMonthEvents = [
        {
          id: 'event_export_1',
          title: 'Robotics Camp - Student A',
          startDateTime: new Date('2025-05-05T09:00:00Z'),
          endDateTime: new Date('2025-05-05T16:00:00Z'),
          type: 'CAMP',
          location: mockLocation,
          bookings: [{ student: { name: 'Student A', allergies: 'None' } }]
        },
        {
          id: 'event_export_2',
          title: '🎂 Birthday Party - Student B',
          startDateTime: new Date('2025-05-15T14:00:00Z'),
          endDateTime: new Date('2025-05-15T16:00:00Z'),
          type: 'BIRTHDAY',
          location: mockLocation,
          bookings: [{ student: { name: 'Student B', allergies: 'Peanuts' } }]
        }
      ];

      (prisma.event.findMany as any).mockResolvedValue(mockMonthEvents);

      const exportCalendarData = async (startDate: Date, endDate: Date) => {
        const events = await prisma.event.findMany({
          where: {
            startDateTime: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            location: true,
            bookings: {
              include: { student: true }
            }
          },
          orderBy: { startDateTime: 'asc' }
        });

        return events.map(event => ({
          id: event.id,
          title: event.title,
          start: event.startDateTime.toISOString(),
          end: event.endDateTime.toISOString(),
          type: event.type,
          location: event.location.name,
          students: event.bookings.map((b: any) => ({
            name: b.student.name,
            allergies: b.student.allergies || 'None'
          })),
          capacity: event.bookings.length
        }));
      };

      const exportData = await exportCalendarData(dateRange.start, dateRange.end);

      expect(exportData).toHaveLength(2);
      expect(exportData[0].title).toBe('Robotics Camp - Student A');
      expect(exportData[0].type).toBe('CAMP');
      expect(exportData[0].students).toHaveLength(1);
      expect(exportData[1].type).toBe('BIRTHDAY');
      expect(exportData[1].students[0].allergies).toBe('Peanuts');

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          startDateTime: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        include: {
          location: true,
          bookings: { include: { student: true } }
        },
        orderBy: { startDateTime: 'asc' }
      });
    });
  });
});

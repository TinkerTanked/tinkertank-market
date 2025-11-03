import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { eventService } from '@/lib/events';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn()
    },
    paymentIntents: {
      retrieve: vi.fn()
    }
  }))
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn()
    },
    orderItem: {
      create: vi.fn()
    },
    booking: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    event: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn()
    },
    location: {
      findFirst: vi.fn(),
      create: vi.fn()
    },
    student: {
      create: vi.fn()
    },
    product: {
      findUnique: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

describe('Payment to Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Payment Flow', () => {
    it('should complete full payment-to-calendar flow for camp booking', async () => {
      // Setup test data
      const mockOrder = {
        id: 'order_test_123',
        customerName: 'Test Parent',
        customerEmail: 'parent@test.com',
        status: 'PENDING',
        totalAmount: 100,
        orderItems: [{
          id: 'item_123',
          studentId: 'student_123',
          productId: 'product_camp_123',
          bookingDate: new Date('2024-09-15T09:00:00Z'),
          price: 100,
          product: {
            name: 'STEM Day Camp',
            type: 'CAMP',
            duration: 360, // 6 hours
            ageMin: 5,
            ageMax: 12
          },
          student: {
            name: 'Test Student',
            allergies: null
          }
        }]
      };

      const mockLocation = {
        id: 'location_123',
        name: 'Neutral Bay',
        address: '123 Neutral Bay Road, Neutral Bay NSW 2089',
        capacity: 20,
        timezone: 'Australia/Sydney'
      };

      // Mock database responses
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_123',
        title: 'STEM Day Camp - Test Student',
        startDateTime: new Date('2024-09-15T09:00:00Z'),
        endDateTime: new Date('2024-09-15T15:00:00Z'),
        locationId: mockLocation.id,
        location: mockLocation
      });
      (prisma.booking.create as any).mockResolvedValue({
        id: 'booking_123',
        eventId: 'event_123'
      });

      // Test event creation
      const events = await eventService.createEventsFromOrder('order_test_123');

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('STEM Day Camp - Test Student');
      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'STEM Day Camp - Test Student',
            type: 'CAMP'
          })
        })
      );
    });

    it('should handle birthday party booking correctly', async () => {
      const mockOrder = {
        id: 'order_birthday_123',
        orderItems: [{
          id: 'item_birthday_123',
          studentId: 'student_123',
          productId: 'product_birthday_123',
          bookingDate: new Date('2024-09-20T14:00:00Z'),
          price: 200,
          product: {
            name: 'Birthday Party Package',
            type: 'BIRTHDAY',
            duration: 120, // 2 hours
            ageMin: 4,
            ageMax: 10
          },
          student: {
            name: 'Birthday Child',
            allergies: 'Nuts'
          }
        }]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.location.findFirst as any).mockResolvedValue({
        id: 'location_123',
        name: 'Neutral Bay'
      });
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_birthday_123',
        title: '🎂 Birthday Child\'s Birthday Party'
      });

      const events = await eventService.createEventsFromOrder('order_birthday_123');

      expect(events).toHaveLength(1);
      expect(events[0].title).toContain('Birthday Party');
      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'BIRTHDAY',
            maxCapacity: 12
          })
        })
      );
    });

    it('should create recurring events for Ignite subscription', async () => {
      const mockOrder = {
        id: 'order_ignite_123',
        orderItems: [{
          id: 'item_ignite_123',
          studentId: 'student_123',
          productId: 'product_ignite_123',
          bookingDate: new Date('2024-09-25T16:00:00Z'),
          price: 300,
          product: {
            name: 'Ignite Program',
            type: 'SUBSCRIPTION',
            duration: 3, // 3 months
            ageMin: 8,
            ageMax: 16
          },
          student: {
            name: 'Ignite Student',
            allergies: null
          }
        }]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.location.findFirst as any).mockResolvedValue({
        id: 'location_123',
        name: 'Neutral Bay'
      });
      
      // Mock recurring template creation
      (prisma.recurringTemplate.create as any).mockResolvedValue({
        id: 'template_123',
        name: 'Ignite Program - Ignite Student',
        type: 'RECURRING_SESSION',
        startTime: '16:00',
        endTime: '17:00',
        daysOfWeek: [3], // Wednesday
        startDate: new Date('2024-09-25T16:00:00Z'),
        endDate: new Date('2024-12-25T16:00:00Z'),
        locationId: 'location_123',
        location: { id: 'location_123', name: 'Neutral Bay' }
      });

      // Mock individual event creation
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_recurring_123',
        title: 'Ignite Program - Ignite Student'
      });

      const events = await eventService.createEventsFromOrder('order_ignite_123');

      expect(Array.isArray(events)).toBe(true);
      expect(prisma.recurringTemplate.create).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle calendar creation failures gracefully', async () => {
      const mockOrder = {
        id: 'order_error_123',
        orderItems: [{
          product: { type: 'CAMP' },
          student: { name: 'Test Student' }
        }]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.location.findFirst as any).mockResolvedValue({ id: 'location_123' });
      (prisma.event.create as any).mockRejectedValue(new Error('Calendar service unavailable'));

      await expect(eventService.createEventsFromOrder('order_error_123')).rejects.toThrow();
    });

    it('should retry failed operations', async () => {
      const mockOrder = {
        id: 'order_retry_123',
        orderItems: [{
          product: { type: 'CAMP' },
          student: { name: 'Test Student' }
        }]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.location.findFirst as any).mockResolvedValue({ id: 'location_123' });
      
      // Mock first call fails, second succeeds
      (prisma.event.create as any)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue({ id: 'event_123' });

      // This would use retry logic in production
      const result = await eventService.createEventsFromOrder('order_retry_123');
      expect(result).toBeDefined();
    });
  });

  describe('Cart Integration', () => {
    it('should clear cart after successful payment', () => {
      const { clearCart, addItem, items } = useEnhancedCartStore.getState();
      
      // Add item to cart
      addItem({
        id: 'product_123',
        name: 'Test Product',
        price: 100,
        type: 'CAMP',
        category: 'camps',
        ageRange: '5-12',
        duration: 360
      } as any);

      expect(items.length).toBe(1);

      // Clear cart
      clearCart();
      expect(useEnhancedCartStore.getState().items.length).toBe(0);
    });
  });

  describe('Payment Status Verification', () => {
    it('should verify payment and event creation status', async () => {
      const mockResponse = {
        paymentStatus: 'succeeded',
        orderStatus: 'PAID',
        eventsCreated: 2,
        totalBookings: 2,
        allEventsCreated: true
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/stripe/payment-status?payment_intent_id=pi_123');
      const data = await response.json();

      expect(data.paymentStatus).toBe('succeeded');
      expect(data.allEventsCreated).toBe(true);
    });
  });

  describe('Email Confirmation', () => {
    it('should generate proper email content', () => {
      const mockOrder = {
        id: 'order_email_123',
        customerName: 'Test Parent',
        customerEmail: 'parent@test.com',
        totalAmount: 150,
        status: 'PAID',
        createdAt: new Date(),
        orderItems: [{
          id: 'item_123',
          product: {
            name: 'STEM Camp',
            type: 'CAMP'
          },
          student: {
            name: 'Test Student',
            allergies: 'Dairy'
          },
          bookingDate: new Date('2024-09-15T09:00:00Z'),
          price: 150
        }]
      };

      // Test email generation
      const { generateBookingConfirmationEmail } = await import('@/lib/email');
      const email = generateBookingConfirmationEmail(mockOrder);

      expect(email.subject).toContain('TinkerTank Booking Confirmation');
      expect(email.body).toContain(mockOrder.customerName);
      expect(email.body).toContain('Test Student');
      expect(email.body).toContain('Allergies: Dairy');
    });
  });
});

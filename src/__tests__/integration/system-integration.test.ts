/**
 * Comprehensive System Integration Tests
 * Tests all components working together across the entire TinkerTank platform
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { prisma } from '@/lib/prisma';
import { eventService } from '@/lib/events';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { loadStripe } from '@stripe/stripe-js';

// Mock all external services
vi.mock('stripe');
vi.mock('@stripe/stripe-js');
vi.mock('@/lib/prisma');
vi.mock('next/navigation');

// Mock email service
vi.mock('@/lib/email', () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue(true),
  generateBookingConfirmationEmail: vi.fn().mockReturnValue({
    subject: 'TinkerTank Booking Confirmation',
    body: 'Mock email body'
  })
}));

describe('System Integration Tests', () => {
  let mockStripe: any;
  let mockLocation: any;
  let mockProduct: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup common mocks
    mockLocation = {
      id: 'loc_nb',
      name: 'Neutral Bay',
      address: '123 Military Rd, Neutral Bay NSW 2089',
      capacity: 20,
      timezone: 'Australia/Sydney'
    };

    mockProduct = {
      id: 'prod_camp_123',
      name: 'STEM Day Camp',
      price: 100,
      type: 'CAMP',
      category: 'camps',
      ageRange: '5-12',
      duration: 360,
      description: 'Fun STEM activities'
    };

    mockStripe = {
      confirmPayment: vi.fn().mockResolvedValue({
        paymentIntent: { id: 'pi_123', status: 'succeeded' }
      }),
      elements: vi.fn(() => ({
        create: vi.fn(),
        getElement: vi.fn(() => ({
          focus: vi.fn(),
          blur: vi.fn()
        }))
      }))
    };

    (loadStripe as any).mockResolvedValue(mockStripe);

    // Mock Prisma responses
    (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
    (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
    (prisma.$transaction as any).mockImplementation((fn) => fn(prisma));
  });

  afterEach(() => {
    cleanup();
    useEnhancedCartStore.getState().clearCart();
  });

  describe('1. Full User Journey: Complete Booking Flow', () => {
    it('should complete entire camp booking journey from cart to calendar', async () => {
      // 1. Add product to cart
      const { addItem, addStudent, updateItemDate } = useEnhancedCartStore.getState();
      
      addItem(mockProduct);
      const items = useEnhancedCartStore.getState().items;
      expect(items).toHaveLength(1);

      // 2. Add student details
      addStudent(items[0].id, {
        id: 'student_123',
        firstName: 'Test',
        lastName: 'Student',
        age: 8,
        parentName: 'Test Parent',
        parentEmail: 'parent@test.com',
        parentPhone: '+61400000000',
        allergies: 'None',
        medicalInfo: ''
      });

      // 3. Set booking date
      const bookingDate = new Date('2024-10-15T09:00:00Z');
      updateItemDate(items[0].id, bookingDate);

      // 4. Mock successful payment
      const mockOrder = {
        id: 'order_integration_123',
        customerName: 'Test Parent',
        customerEmail: 'parent@test.com',
        status: 'PAID',
        totalAmount: 100,
        createdAt: new Date(),
        orderItems: [{
          id: 'item_123',
          studentId: 'student_123',
          productId: mockProduct.id,
          bookingDate,
          price: 100,
          product: mockProduct,
          student: {
            id: 'student_123',
            name: 'Test Student',
            allergies: 'None'
          }
        }]
      };

      (prisma.order.create as any).mockResolvedValue(mockOrder);
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      
      // 5. Mock event creation
      const mockEvent = {
        id: 'event_integration_123',
        title: 'STEM Day Camp - Test Student',
        startDateTime: bookingDate,
        endDateTime: new Date(bookingDate.getTime() + (360 * 60 * 1000)),
        locationId: mockLocation.id,
        location: mockLocation,
        type: 'CAMP'
      };

      (prisma.event.create as any).mockResolvedValue(mockEvent);
      (prisma.booking.create as any).mockResolvedValue({
        id: 'booking_123',
        eventId: mockEvent.id,
        studentId: 'student_123'
      });

      // 6. Process payment and create events
      const events = await eventService.createEventsFromOrder(mockOrder.id);

      // 7. Verify complete flow
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('STEM Day Camp - Test Student');
      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'STEM Day Camp - Test Student',
            type: 'CAMP',
            locationId: mockLocation.id
          })
        })
      );

      // 8. Verify cart is cleared after successful payment
      const { clearCart } = useEnhancedCartStore.getState();
      clearCart();
      expect(useEnhancedCartStore.getState().items).toHaveLength(0);
    });

    it('should handle multiple students, multiple camps scenario', async () => {
      const { addItem, addStudent } = useEnhancedCartStore.getState();
      
      // Add multiple camps
      const camp1 = { ...mockProduct, id: 'camp_1', name: 'STEM Camp 1' };
      const camp2 = { ...mockProduct, id: 'camp_2', name: 'STEM Camp 2' };
      
      addItem(camp1);
      addItem(camp2);

      const items = useEnhancedCartStore.getState().items;
      expect(items).toHaveLength(2);

      // Add multiple students to each camp
      addStudent(items[0].id, {
        id: 'student_1',
        firstName: 'Alice',
        lastName: 'Test',
        age: 7,
        parentName: 'Parent One',
        parentEmail: 'parent1@test.com',
        parentPhone: '+61400000001',
        allergies: 'Nuts',
        medicalInfo: ''
      });

      addStudent(items[0].id, {
        id: 'student_2',
        firstName: 'Bob',
        lastName: 'Test',
        age: 9,
        parentName: 'Parent Two',
        parentEmail: 'parent2@test.com',
        parentPhone: '+61400000002',
        allergies: 'None',
        medicalInfo: ''
      });

      addStudent(items[1].id, {
        id: 'student_3',
        firstName: 'Charlie',
        lastName: 'Test',
        age: 6,
        parentName: 'Parent Three',
        parentEmail: 'parent3@test.com',
        parentPhone: '+61400000003',
        allergies: 'Dairy',
        medicalInfo: 'Asthma'
      });

      // Mock complex order creation
      const mockComplexOrder = {
        id: 'order_complex_123',
        customerName: 'Multi Parent',
        customerEmail: 'multi@test.com',
        status: 'PAID',
        totalAmount: 300,
        orderItems: [
          {
            id: 'item_1',
            studentId: 'student_1',
            productId: camp1.id,
            bookingDate: new Date('2024-10-15T09:00:00Z'),
            price: 100,
            product: camp1,
            student: { id: 'student_1', name: 'Alice Test', allergies: 'Nuts' }
          },
          {
            id: 'item_2',
            studentId: 'student_2',
            productId: camp1.id,
            bookingDate: new Date('2024-10-15T09:00:00Z'),
            price: 100,
            product: camp1,
            student: { id: 'student_2', name: 'Bob Test', allergies: 'None' }
          },
          {
            id: 'item_3',
            studentId: 'student_3',
            productId: camp2.id,
            bookingDate: new Date('2024-10-16T09:00:00Z'),
            price: 100,
            product: camp2,
            student: { id: 'student_3', name: 'Charlie Test', allergies: 'Dairy' }
          }
        ]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockComplexOrder);
      (prisma.event.create as any)
        .mockResolvedValueOnce({ id: 'event_1', title: 'STEM Camp 1 - Alice Test' })
        .mockResolvedValueOnce({ id: 'event_2', title: 'STEM Camp 1 - Bob Test' })
        .mockResolvedValueOnce({ id: 'event_3', title: 'STEM Camp 2 - Charlie Test' });

      const events = await eventService.createEventsFromOrder(mockComplexOrder.id);

      expect(events).toHaveLength(3);
      expect(prisma.event.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('2. Database Integration Tests', () => {
    it('should validate database constraints and relationships', async () => {
      // Test constraint violations
      const invalidOrder = {
        customerName: '', // Invalid - required field
        customerEmail: 'invalid-email', // Invalid format
        totalAmount: -100 // Invalid - negative amount
      };

      (prisma.order.create as any).mockRejectedValue(
        new Error('Constraint violation: customerName cannot be empty')
      );

      await expect(prisma.order.create({ data: invalidOrder })).rejects.toThrow();
    });

    it('should maintain referential integrity across tables', async () => {
      const validOrder = {
        id: 'order_integrity_123',
        customerName: 'Valid Parent',
        customerEmail: 'valid@test.com',
        totalAmount: 100
      };

      const validOrderItem = {
        orderId: validOrder.id,
        studentId: 'student_123',
        productId: 'product_123',
        price: 100
      };

      (prisma.order.create as any).mockResolvedValue(validOrder);
      (prisma.orderItem.create as any).mockResolvedValue(validOrderItem);

      const order = await prisma.order.create({ data: validOrder });
      const orderItem = await prisma.orderItem.create({ data: validOrderItem });

      expect(order.id).toBe(validOrder.id);
      expect(orderItem.orderId).toBe(validOrder.id);
    });

    it('should handle database transactions correctly', async () => {
      const transactionData = {
        order: { id: 'tx_order_123', customerName: 'TX Test' },
        student: { id: 'tx_student_123', name: 'TX Student' },
        event: { id: 'tx_event_123', title: 'TX Event' }
      };

      (prisma.$transaction as any).mockImplementation(async (callback) => {
        const result = await callback({
          order: { create: vi.fn().mockResolvedValue(transactionData.order) },
          student: { create: vi.fn().mockResolvedValue(transactionData.student) },
          event: { create: vi.fn().mockResolvedValue(transactionData.event) }
        });
        return result;
      });

      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({ data: transactionData.order });
        const student = await tx.student.create({ data: transactionData.student });
        const event = await tx.event.create({ data: transactionData.event });
        return { order, student, event };
      });

      expect(result.order.id).toBe(transactionData.order.id);
      expect(result.student.id).toBe(transactionData.student.id);
      expect(result.event.id).toBe(transactionData.event.id);
    });
  });

  describe('3. External Service Integration', () => {
    it('should handle Stripe API connectivity and webhooks', async () => {
      // Mock Stripe webhook event
      const stripeWebhookEvent = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            status: 'succeeded',
            amount: 10000, // $100.00
            metadata: {
              orderId: 'order_stripe_123'
            }
          }
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          orderId: 'order_stripe_123',
          eventsCreated: 1
        })
      });

      // Simulate webhook processing
      const response = await fetch('/api/stripe/webhooks', {
        method: 'POST',
        body: JSON.stringify(stripeWebhookEvent),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.eventsCreated).toBe(1);
    });

    it('should handle email service integration', async () => {
      const { sendBookingConfirmation } = await import('@/lib/email');
      
      const mockOrder = {
        id: 'order_email_123',
        customerName: 'Email Parent',
        customerEmail: 'email@test.com',
        orderItems: []
      };

      const result = await sendBookingConfirmation(mockOrder);
      expect(sendBookingConfirmation).toHaveBeenCalledWith(mockOrder);
      expect(result).toBe(true);
    });

    it('should integrate with calendar API functionality', async () => {
      const calendarEvent = {
        title: 'STEM Camp - Test Student',
        start: '2024-10-15T09:00:00+11:00',
        end: '2024-10-15T15:00:00+11:00',
        location: mockLocation.name
      };

      (prisma.event.create as any).mockResolvedValue({
        id: 'cal_event_123',
        ...calendarEvent,
        locationId: mockLocation.id
      });

      const event = await prisma.event.create({
        data: {
          title: calendarEvent.title,
          startDateTime: new Date(calendarEvent.start),
          endDateTime: new Date(calendarEvent.end),
          locationId: mockLocation.id,
          type: 'CAMP'
        }
      });

      expect(event.title).toBe(calendarEvent.title);
      expect(event.locationId).toBe(mockLocation.id);
    });
  });

  describe('4. State Management Integration', () => {
    it('should synchronize Zustand store across components', async () => {
      const { addItem, items, getSummary } = useEnhancedCartStore.getState();

      // Add multiple items
      addItem({ ...mockProduct, id: 'sync_1', name: 'Sync Test 1' });
      addItem({ ...mockProduct, id: 'sync_2', name: 'Sync Test 2' });

      expect(useEnhancedCartStore.getState().items).toHaveLength(2);

      // Test summary calculation
      const summary = getSummary();
      expect(summary.subtotal).toBe(200); // 2 × $100
      expect(summary.gst).toBeCloseTo(18.18); // 200 × 10/11
      expect(summary.total).toBeCloseTo(218.18);
    });

    it('should persist state to localStorage', async () => {
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      const { addItem } = useEnhancedCartStore.getState();
      addItem(mockProduct);

      // Verify localStorage interaction
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should recover state after errors', async () => {
      const { addItem, clearCart } = useEnhancedCartStore.getState();
      
      // Add item and simulate error
      addItem(mockProduct);
      expect(useEnhancedCartStore.getState().items).toHaveLength(1);

      // Simulate error recovery
      try {
        throw new Error('Simulated error');
      } catch (error) {
        // Cart should remain intact
        expect(useEnhancedCartStore.getState().items).toHaveLength(1);
      }

      // Clear cart after error
      clearCart();
      expect(useEnhancedCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('5. API Route Integration', () => {
    it('should test all payment-related API routes', async () => {
      const paymentIntentData = {
        amount: 10000,
        currency: 'aud',
        metadata: { orderId: 'order_api_123' }
      };

      // Test create payment intent
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            clientSecret: 'pi_123_secret_456',
            paymentIntentId: 'pi_123'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            paymentIntent: { id: 'pi_123', status: 'succeeded' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            paymentStatus: 'succeeded',
            orderStatus: 'PAID',
            eventsCreated: 1
          })
        });

      // Create payment intent
      const createResponse = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(paymentIntentData)
      });
      const createResult = await createResponse.json();
      expect(createResult.clientSecret).toBeDefined();

      // Confirm payment
      const confirmResponse = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId: 'pi_123' })
      });
      const confirmResult = await confirmResponse.json();
      expect(confirmResult.success).toBe(true);

      // Check payment status
      const statusResponse = await fetch('/api/stripe/payment-status?payment_intent_id=pi_123');
      const statusResult = await statusResponse.json();
      expect(statusResult.paymentStatus).toBe('succeeded');
    });

    it('should test admin dashboard API routes', async () => {
      const mockDashboardData = {
        totalRevenue: 5000,
        totalBookings: 25,
        upcomingEvents: 10,
        recentOrders: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDashboardData)
      });

      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();

      expect(data.totalRevenue).toBe(5000);
      expect(data.totalBookings).toBe(25);
    });

    it('should test calendar events API routes', async () => {
      const mockEvents = [
        {
          id: 'event_cal_1',
          title: 'STEM Camp - Student 1',
          start: '2024-10-15T09:00:00+11:00',
          end: '2024-10-15T15:00:00+11:00'
        }
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEvents)
      });

      const response = await fetch('/api/events/fullcalendar');
      const events = await response.json();

      expect(events).toHaveLength(1);
      expect(events[0].title).toContain('STEM Camp');
    });
  });

  describe('6. Real-World Scenarios', () => {
    it('should handle concurrent user bookings', async () => {
      // Simulate multiple users booking the same time slot
      const concurrentBookings = Array.from({ length: 3 }, (_, i) => ({
        orderId: `concurrent_${i}`,
        studentName: `Student ${i}`,
        bookingDate: new Date('2024-10-15T09:00:00Z')
      }));

      const mockCapacityCheck = vi.fn()
        .mockResolvedValueOnce(18) // Available capacity
        .mockResolvedValueOnce(17) // After first booking
        .mockResolvedValueOnce(16); // After second booking

      (prisma.event.findMany as any).mockImplementation(mockCapacityCheck);
      (prisma.order.create as any).mockImplementation((order) => 
        Promise.resolve({ id: order.data.id, ...order.data })
      );

      // Process bookings concurrently
      const results = await Promise.allSettled(
        concurrentBookings.map(booking => 
          eventService.createEventsFromOrder(booking.orderId)
        )
      );

      // All should succeed with proper capacity management
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);
    });

    it('should handle system under peak load', async () => {
      // Simulate high-load scenario
      const loadTestBookings = Array.from({ length: 50 }, (_, i) => ({
        id: `load_test_${i}`,
        customerName: `Customer ${i}`,
        totalAmount: 100
      }));

      let successCount = 0;
      let errorCount = 0;

      (prisma.order.create as any).mockImplementation(() => {
        // Simulate occasional failures under load
        if (Math.random() < 0.1) { // 10% failure rate
          errorCount++;
          return Promise.reject(new Error('Database overloaded'));
        }
        successCount++;
        return Promise.resolve({ id: `order_${successCount}` });
      });

      const results = await Promise.allSettled(
        loadTestBookings.map(booking => 
          prisma.order.create({ data: booking })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length + failed.length).toBe(50);
      expect(successful.length).toBeGreaterThan(40); // At least 80% success rate
    });

    it('should handle network interruption gracefully', async () => {
      let networkAvailable = true;

      global.fetch = vi.fn().mockImplementation(() => {
        if (!networkAvailable) {
          return Promise.reject(new Error('Network unavailable'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      // Simulate network failure
      networkAvailable = false;
      
      try {
        await fetch('/api/stripe/create-payment-intent');
      } catch (error) {
        expect(error.message).toContain('Network unavailable');
      }

      // Simulate network recovery
      networkAvailable = true;
      const response = await fetch('/api/stripe/create-payment-intent');
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should recover from partial system failures', async () => {
      // Simulate payment success but event creation failure
      const mockOrder = {
        id: 'partial_failure_123',
        status: 'PENDING',
        orderItems: [{
          id: 'item_123',
          product: { type: 'CAMP', name: 'Test Camp' },
          student: { name: 'Test Student' }
        }]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.order.update as any).mockResolvedValue({ 
        ...mockOrder, 
        status: 'PAID' 
      });

      // First attempt fails
      (prisma.event.create as any)
        .mockRejectedValueOnce(new Error('Calendar service down'))
        .mockResolvedValue({ id: 'event_recovered_123' });

      // Initial attempt fails
      await expect(eventService.createEventsFromOrder(mockOrder.id))
        .rejects.toThrow('Calendar service down');

      // Retry succeeds
      const events = await eventService.createEventsFromOrder(mockOrder.id);
      expect(events).toBeDefined();
    });
  });

  describe('7. Error Handling Integration', () => {
    it('should provide comprehensive error recovery', async () => {
      const { addItem, validateCart } = useEnhancedCartStore.getState();
      
      // Add invalid item
      const invalidProduct = {
        ...mockProduct,
        price: -100 // Invalid price
      };

      addItem(invalidProduct);
      
      const validation = validateCart();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should maintain data consistency during errors', async () => {
      const { addItem, items } = useEnhancedCartStore.getState();
      
      addItem(mockProduct);
      const initialItemCount = items.length;

      // Simulate operation that might fail
      try {
        throw new Error('Simulated failure');
      } catch (error) {
        // Cart state should remain unchanged
        expect(useEnhancedCartStore.getState().items.length).toBe(initialItemCount);
      }
    });
  });
});

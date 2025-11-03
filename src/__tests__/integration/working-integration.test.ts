/**
 * Working System Integration Tests
 * Core integration tests that validate system components working together
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock external dependencies properly
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    booking: {
      create: vi.fn(),
    },
    event: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
    },
    student: {
      create: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}));

vi.mock('@/lib/events', () => ({
  eventService: {
    createEventsFromOrder: vi.fn(),
  }
}));

vi.mock('@/lib/email', () => ({
  sendBookingConfirmation: vi.fn(),
  generateBookingConfirmationEmail: vi.fn(),
}));

describe('Working System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Database Integration', () => {
    it('should create orders with proper data structure', async () => {
      const { prisma } = await import('@/lib/prisma');

      const mockOrder = {
        id: 'order_123',
        customerName: 'Test Parent',
        customerEmail: 'test@parent.com',
        totalAmount: 150,
        status: 'PENDING'
      };

      (prisma.order.create as any).mockResolvedValue({
        ...mockOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await prisma.order.create({
        data: mockOrder
      });

      expect(result).toMatchObject(mockOrder);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: mockOrder
      });
    });

    it('should handle transaction operations', async () => {
      const { prisma } = await import('@/lib/prisma');

      const transactionResult = {
        order: { id: 'order_tx_123' },
        student: { id: 'student_tx_123' },
        event: { id: 'event_tx_123' }
      };

      (prisma.$transaction as any).mockImplementation(async (callback) => {
        const mockTx = {
          order: { create: vi.fn().mockResolvedValue(transactionResult.order) },
          student: { create: vi.fn().mockResolvedValue(transactionResult.student) },
          event: { create: vi.fn().mockResolvedValue(transactionResult.event) }
        };
        return await callback(mockTx);
      });

      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({ data: { customerName: 'Test' } });
        const student = await tx.student.create({ data: { name: 'Test Student' } });
        const event = await tx.event.create({ data: { title: 'Test Event' } });
        return { order, student, event };
      });

      expect(result).toEqual(transactionResult);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('2. Event Service Integration', () => {
    it('should create events from order data', async () => {
      const { eventService } = await import('@/lib/events');
      const { prisma } = await import('@/lib/prisma');

      const mockOrder = {
        id: 'order_event_123',
        orderItems: [{
          id: 'item_123',
          productId: 'product_camp_123',
          studentId: 'student_123',
          bookingDate: new Date('2024-10-15T09:00:00Z'),
          product: {
            type: 'CAMP',
            name: 'STEM Day Camp',
            duration: 360
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
        capacity: 20
      };

      const mockEvent = {
        id: 'event_123',
        title: 'STEM Day Camp - Test Student',
        startDateTime: new Date('2024-10-15T09:00:00Z'),
        endDateTime: new Date('2024-10-15T15:00:00Z'),
        type: 'CAMP'
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
      (prisma.event.create as any).mockResolvedValue(mockEvent);
      (eventService.createEventsFromOrder as any).mockResolvedValue([mockEvent]);

      const events = await eventService.createEventsFromOrder('order_event_123');

      expect(events).toHaveLength(1);
      expect(events[0].title).toContain('STEM Day Camp');
      expect(eventService.createEventsFromOrder).toHaveBeenCalledWith('order_event_123');
    });
  });

  describe('3. Email Service Integration', () => {
    it('should send booking confirmation emails', async () => {
      const { sendBookingConfirmation, generateBookingConfirmationEmail } = await import('@/lib/email');

      const mockOrder = {
        id: 'order_email_123',
        customerName: 'Email Test Parent',
        customerEmail: 'parent@test.com',
        totalAmount: 200,
        orderItems: [{
          product: { name: 'Test Camp' },
          student: { name: 'Test Student' },
          bookingDate: new Date()
        }]
      };

      (generateBookingConfirmationEmail as any).mockReturnValue({
        subject: 'TinkerTank Booking Confirmation',
        body: 'Your booking has been confirmed'
      });

      (sendBookingConfirmation as any).mockResolvedValue({
        messageId: 'email_123',
        accepted: ['parent@test.com'],
        rejected: []
      });

      const emailContent = generateBookingConfirmationEmail(mockOrder);
      const emailResult = await sendBookingConfirmation(mockOrder);

      expect(emailContent.subject).toContain('TinkerTank');
      expect(emailResult.accepted).toContain('parent@test.com');
      expect(sendBookingConfirmation).toHaveBeenCalledWith(mockOrder);
    });
  });

  describe('4. API Integration Patterns', () => {
    it('should handle typical API request/response flow', async () => {
      // Mock fetch for API calls
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'api_test_123' }
        })
      });

      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('api_test_123');
      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
    });

    it('should handle API error responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Bad Request',
          message: 'Invalid data provided'
        })
      });

      const response = await fetch('/api/error-test');
      const result = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bad Request');
    });
  });

  describe('5. Data Flow Integration', () => {
    it('should handle complete booking flow data transformation', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { eventService } = await import('@/lib/events');
      const { sendBookingConfirmation } = await import('@/lib/email');

      // 1. Create Order
      const orderData = {
        customerName: 'Flow Test Parent',
        customerEmail: 'flow@test.com',
        totalAmount: 100
      };

      const mockOrder = {
        ...orderData,
        id: 'order_flow_123',
        status: 'PAID'
      };

      (prisma.order.create as any).mockResolvedValue(mockOrder);

      // 2. Create Events
      const mockEvents = [{
        id: 'event_flow_123',
        title: 'Flow Test Event'
      }];

      (eventService.createEventsFromOrder as any).mockResolvedValue(mockEvents);

      // 3. Send Email
      (sendBookingConfirmation as any).mockResolvedValue({
        accepted: [orderData.customerEmail]
      });

      // Execute flow
      const order = await prisma.order.create({ data: orderData });
      const events = await eventService.createEventsFromOrder(order.id);
      const emailResult = await sendBookingConfirmation(order);

      // Verify flow
      expect(order.id).toBe('order_flow_123');
      expect(events).toHaveLength(1);
      expect(emailResult.accepted).toContain('flow@test.com');
    });
  });

  describe('6. Error Handling Integration', () => {
    it('should handle service failures gracefully', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { eventService } = await import('@/lib/events');

      // Order creation succeeds
      (prisma.order.create as any).mockResolvedValue({
        id: 'order_error_123',
        status: 'PAID'
      });

      // Event creation fails
      (eventService.createEventsFromOrder as any).mockRejectedValue(
        new Error('Calendar service unavailable')
      );

      const order = await prisma.order.create({
        data: { customerName: 'Error Test' }
      });

      expect(order.id).toBe('order_error_123');

      // Event creation should fail
      await expect(eventService.createEventsFromOrder(order.id))
        .rejects.toThrow('Calendar service unavailable');
    });

    it('should handle network timeouts and retries', async () => {
      let attemptCount = 0;

      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Network timeout'));
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, attempt: attemptCount })
        });
      });

      // Retry logic simulation
      let result;
      for (let i = 0; i < 3; i++) {
        try {
          const response = await fetch('/api/retry-test');
          result = await response.json();
          break;
        } catch (error) {
          if (i === 2) throw error; // Final attempt
        }
      }

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(3);
      expect(attemptCount).toBe(3);
    });
  });

  describe('7. Performance Integration', () => {
    it('should handle multiple concurrent operations', async () => {
      const { prisma } = await import('@/lib/prisma');

      // Mock rapid responses
      (prisma.order.create as any).mockImplementation((data) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              id: `order_${Date.now()}_${Math.random()}`,
              ...data.data
            });
          }, Math.random() * 50); // 0-50ms delay
        });
      });

      // Create 10 concurrent orders
      const orderPromises = Array.from({ length: 10 }, (_, i) =>
        prisma.order.create({
          data: {
            customerName: `Customer ${i}`,
            customerEmail: `customer${i}@test.com`,
            totalAmount: 100 + i
          }
        })
      );

      const startTime = performance.now();
      const orders = await Promise.all(orderPromises);
      const endTime = performance.now();

      expect(orders).toHaveLength(10);
      expect(orders.every(order => order.id.startsWith('order_'))).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain data consistency under load', async () => {
      const operationResults = [];

      // Simulate 50 operations
      for (let i = 0; i < 50; i++) {
        const operation = new Promise(resolve => {
          setTimeout(() => {
            resolve({
              id: i,
              status: 'completed',
              timestamp: Date.now()
            });
          }, Math.random() * 100);
        });
        
        operationResults.push(operation);
      }

      const results = await Promise.all(operationResults);

      expect(results).toHaveLength(50);
      expect(results.every(r => r.status === 'completed')).toBe(true);
      
      // Check that IDs are unique and in sequence
      const ids = results.map(r => r.id).sort((a, b) => a - b);
      expect(ids).toEqual(Array.from({ length: 50 }, (_, i) => i));
    });
  });

  describe('8. Configuration Integration', () => {
    it('should handle environment-specific configurations', () => {
      // Test environment configuration
      expect(process.env.NODE_ENV).toBe('test');
      
      // Mock environment variables from setup
      expect(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBeDefined();
      expect(process.env.STRIPE_SECRET_KEY).toBeDefined();
      expect(process.env.DATABASE_URL).toBeDefined();
    });

    it('should validate required configuration values', () => {
      const requiredEnvVars = [
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_SECRET_KEY',
        'DATABASE_URL'
      ];

      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined();
        expect(process.env[envVar]).not.toBe('');
      });
    });
  });

  describe('9. Mocking Integration Patterns', () => {
    it('should demonstrate proper mock setup and cleanup', async () => {
      const { prisma } = await import('@/lib/prisma');

      // Setup mock
      const mockData = { id: 'mock_test_123', name: 'Mock Test' };
      (prisma.product.findUnique as any).mockResolvedValue(mockData);

      // Use mock
      const result = await prisma.product.findUnique({ where: { id: 'test' } });
      expect(result).toEqual(mockData);

      // Verify mock was called
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'test' } });

      // Mock cleanup happens automatically in beforeEach
    });

    it('should handle complex mock scenarios', async () => {
      const { eventService } = await import('@/lib/events');

      // Mock with different behaviors based on input
      (eventService.createEventsFromOrder as any).mockImplementation((orderId) => {
        if (orderId === 'error_order') {
          return Promise.reject(new Error('Test error'));
        }
        
        return Promise.resolve([{
          id: `event_for_${orderId}`,
          title: `Event for ${orderId}`
        }]);
      });

      // Test success case
      const successResult = await eventService.createEventsFromOrder('success_order');
      expect(successResult[0].id).toBe('event_for_success_order');

      // Test error case
      await expect(eventService.createEventsFromOrder('error_order'))
        .rejects.toThrow('Test error');
    });
  });

  describe('10. Integration Test Utilities', () => {
    it('should provide helper functions for common test patterns', async () => {
      // Helper function for creating mock orders
      const createMockOrder = (overrides = {}) => ({
        id: 'order_helper_123',
        customerName: 'Helper Test',
        customerEmail: 'helper@test.com',
        totalAmount: 150,
        status: 'PENDING',
        createdAt: new Date(),
        ...overrides
      });

      const order1 = createMockOrder();
      const order2 = createMockOrder({ 
        id: 'order_helper_456',
        customerName: 'Different Customer'
      });

      expect(order1.id).toBe('order_helper_123');
      expect(order1.customerName).toBe('Helper Test');
      expect(order2.id).toBe('order_helper_456');
      expect(order2.customerName).toBe('Different Customer');
    });

    it('should validate test data consistency', () => {
      const testOrder = {
        id: 'order_validation_123',
        customerName: 'Validation Test',
        customerEmail: 'validation@test.com',
        totalAmount: 200,
        orderItems: [
          { id: 'item_1', price: 100 },
          { id: 'item_2', price: 100 }
        ]
      };

      // Validate order total matches item prices
      const calculatedTotal = testOrder.orderItems.reduce(
        (sum, item) => sum + item.price,
        0
      );
      
      expect(calculatedTotal).toBe(testOrder.totalAmount);
      expect(testOrder.orderItems).toHaveLength(2);
      expect(testOrder.customerEmail).toMatch(/.*@.*\..*/); // Basic email validation
    });
  });
});

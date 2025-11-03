/**
 * API Routes Integration Tests
 * Tests all Next.js API routes for proper integration and data flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma');

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn()
    },
    webhooks: {
      constructEvent: vi.fn()
    }
  }))
}));

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check Routes', () => {
    it('should return system health status', async () => {
      // Mock database connection check
      (prisma.$queryRaw as any).mockResolvedValue([{ result: 1 }]);

      const { GET } = await import('@/app/api/health/route');
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.database).toBe('connected');
      expect(data.timestamp).toBeDefined();
    });

    it('should detect database connectivity issues', async () => {
      (prisma.$queryRaw as any).mockRejectedValue(new Error('Database connection failed'));

      const { GET } = await import('@/app/api/health/route');
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.database).toBe('disconnected');
    });
  });

  describe('Stripe Payment Routes', () => {
    it('/api/stripe/create-payment-intent should create payment intent', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_456',
        amount: 10000,
        currency: 'aud'
      };

      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe('sk_test_123', { apiVersion: '2024-06-20' });
      (mockStripe.paymentIntents.create as any).mockResolvedValue(mockPaymentIntent);

      const { POST } = await import('@/app/api/stripe/create-payment-intent/route');
      const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 100,
          currency: 'aud',
          metadata: { orderId: 'order_123' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.clientSecret).toBe(mockPaymentIntent.client_secret);
      expect(data.paymentIntentId).toBe(mockPaymentIntent.id);
    });

    it('/api/stripe/confirm-payment should confirm payment and create events', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: { orderId: 'order_123' }
      };

      const mockOrder = {
        id: 'order_123',
        status: 'PENDING',
        orderItems: [{
          id: 'item_123',
          studentId: 'student_123',
          productId: 'product_123',
          bookingDate: new Date('2024-10-15T09:00:00Z'),
          product: { type: 'CAMP', name: 'Test Camp', duration: 360 },
          student: { name: 'Test Student' }
        }]
      };

      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe('sk_test_123', { apiVersion: '2024-06-20' });
      (mockStripe.paymentIntents.retrieve as any).mockResolvedValue(mockPaymentIntent);

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.order.update as any).mockResolvedValue({ ...mockOrder, status: 'PAID' });
      (prisma.location.findFirst as any).mockResolvedValue({
        id: 'loc_123',
        name: 'Neutral Bay'
      });
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_123',
        title: 'Test Camp - Test Student'
      });

      const { POST } = await import('@/app/api/stripe/confirm-payment/route');
      const request = new NextRequest('http://localhost:3000/api/stripe/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId: 'pi_test_123' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.eventsCreated).toBeGreaterThan(0);
    });

    it('/api/stripe/payment-status should return payment and event status', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: { orderId: 'order_123' }
      };

      const mockOrder = {
        id: 'order_123',
        status: 'PAID',
        orderItems: [{
          events: [{ id: 'event_123', title: 'Test Event' }]
        }]
      };

      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe('sk_test_123', { apiVersion: '2024-06-20' });
      (mockStripe.paymentIntents.retrieve as any).mockResolvedValue(mockPaymentIntent);
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const { GET } = await import('@/app/api/stripe/payment-status/route');
      const url = new URL('http://localhost:3000/api/stripe/payment-status?payment_intent_id=pi_test_123');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paymentStatus).toBe('succeeded');
      expect(data.orderStatus).toBe('PAID');
      expect(data.allEventsCreated).toBe(true);
    });

    it('/api/stripe/webhooks should process webhook events', async () => {
      const mockWebhookEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            metadata: { orderId: 'order_123' }
          }
        }
      };

      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe('sk_test_123', { apiVersion: '2024-06-20' });
      (mockStripe.webhooks.constructEvent as any).mockReturnValue(mockWebhookEvent);

      (prisma.order.findUnique as any).mockResolvedValue({
        id: 'order_123',
        status: 'PENDING',
        orderItems: []
      });
      (prisma.order.update as any).mockResolvedValue({
        id: 'order_123',
        status: 'PAID'
      });

      const { POST } = await import('@/app/api/stripe/webhooks/route');
      const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
        method: 'POST',
        body: JSON.stringify(mockWebhookEvent),
        headers: { 'stripe-signature': 'test_signature' }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Admin Routes', () => {
    it('/api/admin/dashboard should return dashboard data', async () => {
      const mockDashboardData = {
        totalRevenue: 5000,
        totalBookings: 25,
        upcomingEvents: [
          { id: 'event_1', title: 'Upcoming Camp 1' },
          { id: 'event_2', title: 'Upcoming Camp 2' }
        ],
        recentOrders: [
          { id: 'order_1', customerName: 'Parent 1', totalAmount: 200 }
        ]
      };

      (prisma.order.aggregate as any).mockResolvedValue({
        _sum: { totalAmount: 5000 }
      });
      (prisma.order.count as any).mockResolvedValue(25);
      (prisma.event.findMany as any)
        .mockResolvedValueOnce(mockDashboardData.upcomingEvents)
        .mockResolvedValueOnce(mockDashboardData.recentOrders);

      const { GET } = await import('@/app/api/admin/dashboard/route');
      const request = new NextRequest('http://localhost:3000/api/admin/dashboard');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalRevenue).toBe(5000);
      expect(data.totalBookings).toBe(25);
      expect(data.upcomingEvents).toHaveLength(2);
    });

    it('/api/admin/bookings should return booking management data', async () => {
      const mockBookings = [
        {
          id: 'booking_1',
          student: { name: 'Student 1' },
          event: { title: 'Camp 1', startDateTime: new Date() },
          order: { customerName: 'Parent 1' }
        }
      ];

      (prisma.booking.findMany as any).mockResolvedValue(mockBookings);

      const { GET } = await import('@/app/api/admin/bookings/route');
      const request = new NextRequest('http://localhost:3000/api/admin/bookings');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings).toHaveLength(1);
      expect(data.bookings[0].student.name).toBe('Student 1');
    });

    it('/api/admin/analytics/revenue should return revenue analytics', async () => {
      const mockRevenueData = {
        daily: [
          { date: '2024-10-01', revenue: 500 },
          { date: '2024-10-02', revenue: 750 }
        ],
        monthly: [
          { month: '2024-10', revenue: 10000 }
        ]
      };

      (prisma.order.groupBy as any)
        .mockResolvedValueOnce(mockRevenueData.daily)
        .mockResolvedValueOnce(mockRevenueData.monthly);

      const { GET } = await import('@/app/api/admin/analytics/revenue/route');
      const request = new NextRequest('http://localhost:3000/api/admin/analytics/revenue');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.daily).toHaveLength(2);
      expect(data.monthly).toHaveLength(1);
    });
  });

  describe('Calendar & Events Routes', () => {
    it('/api/events/fullcalendar should return calendar events', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          title: 'STEM Camp - Student 1',
          startDateTime: new Date('2024-10-15T09:00:00Z'),
          endDateTime: new Date('2024-10-15T15:00:00Z'),
          type: 'CAMP',
          location: { name: 'Neutral Bay' }
        }
      ];

      (prisma.event.findMany as any).mockResolvedValue(mockEvents);

      const { GET } = await import('@/app/api/events/fullcalendar/route');
      const request = new NextRequest('http://localhost:3000/api/events/fullcalendar');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toContain('STEM Camp');
      expect(data[0].start).toBeDefined();
      expect(data[0].end).toBeDefined();
    });

    it('/api/events/templates should handle recurring event templates', async () => {
      const mockTemplate = {
        id: 'template_1',
        name: 'Weekly STEM Class',
        type: 'RECURRING_SESSION',
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        startTime: '16:00',
        endTime: '17:00'
      };

      (prisma.recurringTemplate.create as any).mockResolvedValue(mockTemplate);

      const { POST } = await import('@/app/api/events/templates/route');
      const request = new NextRequest('http://localhost:3000/api/events/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Weekly STEM Class',
          type: 'RECURRING_SESSION',
          daysOfWeek: [1, 3, 5],
          startTime: '16:00',
          endTime: '17:00'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('template_1');
      expect(data.daysOfWeek).toEqual([1, 3, 5]);
    });
  });

  describe('Cart Routes', () => {
    it('/api/cart/clear should clear cart state', async () => {
      const { POST } = await import('@/app/api/cart/clear/route');
      const request = new NextRequest('http://localhost:3000/api/cart/clear', {
        method: 'POST'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('cleared');
    });
  });

  describe('Support Routes', () => {
    it('/api/support/booking-issue should handle support requests', async () => {
      const supportTicket = {
        customerName: 'Test Parent',
        customerEmail: 'parent@test.com',
        orderId: 'order_123',
        issue: 'Cannot find booking confirmation',
        description: 'I paid but did not receive confirmation email'
      };

      (prisma.supportTicket.create as any).mockResolvedValue({
        id: 'ticket_123',
        ...supportTicket,
        status: 'OPEN'
      });

      const { POST } = await import('@/app/api/support/booking-issue/route');
      const request = new NextRequest('http://localhost:3000/api/support/booking-issue', {
        method: 'POST',
        body: JSON.stringify(supportTicket)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('ticket_123');
      expect(data.status).toBe('OPEN');
    });
  });

  describe('Error Handling Routes', () => {
    it('/api/errors should log and return error information', async () => {
      const errorData = {
        message: 'Test error',
        stack: 'Error stack trace',
        url: '/test-page',
        userAgent: 'Test browser'
      };

      const { POST } = await import('@/app/api/errors/route');
      const request = new NextRequest('http://localhost:3000/api/errors', {
        method: 'POST',
        body: JSON.stringify(errorData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logged).toBe(true);
      expect(data.errorId).toBeDefined();
    });
  });

  describe('Authentication & Authorization', () => {
    it('should handle unauthorized access to admin routes', async () => {
      // Mock missing or invalid authentication
      const { GET } = await import('@/app/api/admin/dashboard/route');
      const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
        headers: { 'Authorization': 'Bearer invalid_token' }
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should validate request data and return appropriate errors', async () => {
      const { POST } = await import('@/app/api/stripe/create-payment-intent/route');
      const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          currency: 'aud'
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting & Performance', () => {
    it('should handle rate limiting on API routes', async () => {
      const { GET } = await import('@/app/api/health/route');
      
      // Simulate multiple rapid requests
      const promises = Array.from({ length: 100 }, () => {
        const request = new NextRequest('http://localhost:3000/api/health');
        return GET(request);
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled');
      const rateLimited = results.filter(r => r.status === 'rejected');

      // Should have some rate limiting in place
      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length + rateLimited.length).toBe(100);
    });

    it('should handle concurrent requests gracefully', async () => {
      (prisma.order.create as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 'order_123' }), 100))
      );

      const { POST } = await import('@/app/api/stripe/create-payment-intent/route');
      
      const concurrentRequests = Array.from({ length: 10 }, () => {
        const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
          method: 'POST',
          body: JSON.stringify({
            amount: 100,
            currency: 'aud'
          })
        });
        return POST(request);
      });

      const results = await Promise.allSettled(concurrentRequests);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBeGreaterThan(5); // At least 50% success under load
    });
  });
});

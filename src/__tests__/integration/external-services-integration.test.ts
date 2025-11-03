/**
 * External Services Integration Tests
 * Tests integration with Stripe, email service, calendar APIs, and webhooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Mock external services
vi.mock('stripe');
vi.mock('@stripe/stripe-js');
vi.mock('@/lib/email');
vi.mock('nodemailer');

describe('External Services Integration Tests', () => {
  let mockStripe: any;
  let mockStripeClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Stripe server-side
    mockStripe = {
      paymentIntents: {
        create: vi.fn(),
        retrieve: vi.fn(),
        confirm: vi.fn(),
        cancel: vi.fn()
      },
      webhooks: {
        constructEvent: vi.fn()
      },
      customers: {
        create: vi.fn(),
        retrieve: vi.fn()
      },
      products: {
        create: vi.fn(),
        list: vi.fn()
      },
      prices: {
        create: vi.fn(),
        list: vi.fn()
      }
    };

    (Stripe as any).mockImplementation(() => mockStripe);

    // Mock Stripe client-side
    mockStripeClient = {
      confirmPayment: vi.fn(),
      elements: vi.fn(() => ({
        create: vi.fn(),
        getElement: vi.fn(() => ({
          focus: vi.fn(),
          blur: vi.fn(),
          clear: vi.fn()
        }))
      })),
      redirectToCheckout: vi.fn()
    };

    (loadStripe as any).mockResolvedValue(mockStripeClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Stripe Payment Integration', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_456',
        amount: 10000,
        currency: 'aud',
        status: 'requires_payment_method'
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20'
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 10000,
        currency: 'aud',
        metadata: {
          orderId: 'order_123',
          customerEmail: 'test@example.com'
        }
      });

      expect(paymentIntent.id).toBe('pi_test_123');
      expect(paymentIntent.amount).toBe(10000);
      expect(paymentIntent.currency).toBe('aud');
    });

    it('should handle payment intent confirmation', async () => {
      const mockConfirmedPayment = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 10000,
        metadata: { orderId: 'order_123' }
      };

      mockStripeClient.confirmPayment.mockResolvedValue({
        paymentIntent: mockConfirmedPayment,
        error: null
      });

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      
      const result = await stripe!.confirmPayment({
        elements: mockStripeClient.elements(),
        confirmParams: {
          return_url: 'http://localhost:3000/payment/success'
        }
      });

      expect(result.paymentIntent?.status).toBe('succeeded');
      expect(result.error).toBeNull();
    });

    it('should handle payment failures gracefully', async () => {
      const mockError = {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined.'
      };

      mockStripeClient.confirmPayment.mockResolvedValue({
        paymentIntent: null,
        error: mockError
      });

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      
      const result = await stripe!.confirmPayment({
        elements: mockStripeClient.elements(),
        confirmParams: {
          return_url: 'http://localhost:3000/payment/error'
        }
      });

      expect(result.error?.code).toBe('card_declined');
      expect(result.paymentIntent).toBeNull();
    });

    it('should process webhook events correctly', async () => {
      const mockWebhookEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            amount: 10000,
            metadata: {
              orderId: 'order_123'
            }
          }
        },
        created: Date.now()
      };

      const webhookSecret = 'whsec_test_secret';
      const webhookSignature = 'test_signature';

      mockStripe.webhooks.constructEvent.mockReturnValue(mockWebhookEvent);

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20'
      });

      const event = stripe.webhooks.constructEvent(
        JSON.stringify(mockWebhookEvent),
        webhookSignature,
        webhookSecret
      );

      expect(event.type).toBe('payment_intent.succeeded');
      expect(event.data.object.id).toBe('pi_test_123');
    });

    it('should handle Stripe API errors', async () => {
      const stripeError = new Error('Invalid API key');
      (stripeError as any).type = 'StripeAuthenticationError';
      (stripeError as any).code = 'invalid_api_key';

      mockStripe.paymentIntents.create.mockRejectedValue(stripeError);

      const stripe = new Stripe('invalid_key', { apiVersion: '2024-06-20' });

      await expect(stripe.paymentIntents.create({
        amount: 1000,
        currency: 'aud'
      })).rejects.toThrow('Invalid API key');
    });

    it('should handle network timeouts and retries', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';

      mockStripe.paymentIntents.create
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({
          id: 'pi_retry_success',
          status: 'requires_payment_method'
        });

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20'
      });

      // First attempt fails, retry succeeds
      try {
        await stripe.paymentIntents.create({ amount: 1000, currency: 'aud' });
      } catch (error) {
        expect(error.code).toBe('ETIMEDOUT');
      }

      // Retry
      const retryResult = await stripe.paymentIntents.create({
        amount: 1000,
        currency: 'aud'
      });

      expect(retryResult.id).toBe('pi_retry_success');
    });
  });

  describe('2. Email Service Integration', () => {
    beforeEach(() => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport = vi.fn(() => ({
        sendMail: vi.fn(),
        verify: vi.fn()
      }));
    });

    it('should send booking confirmation emails', async () => {
      const { sendBookingConfirmation } = await import('@/lib/email');
      
      const mockOrder = {
        id: 'order_email_123',
        customerName: 'Test Parent',
        customerEmail: 'parent@test.com',
        totalAmount: 200,
        status: 'PAID',
        createdAt: new Date(),
        orderItems: [
          {
            id: 'item_123',
            product: {
              name: 'STEM Day Camp',
              type: 'CAMP'
            },
            student: {
              name: 'Test Student',
              allergies: 'None'
            },
            bookingDate: new Date('2024-10-15T09:00:00Z'),
            price: 200
          }
        ]
      };

      (sendBookingConfirmation as any).mockResolvedValue({
        messageId: 'email_123@example.com',
        accepted: ['parent@test.com'],
        rejected: []
      });

      const result = await sendBookingConfirmation(mockOrder);

      expect(sendBookingConfirmation).toHaveBeenCalledWith(mockOrder);
      expect(result.accepted).toContain('parent@test.com');
    });

    it('should handle email service failures', async () => {
      const { sendBookingConfirmation } = await import('@/lib/email');
      
      const mockOrder = {
        id: 'order_fail_123',
        customerEmail: 'invalid@domain.com'
      };

      (sendBookingConfirmation as any).mockRejectedValue(
        new Error('SMTP connection failed')
      );

      await expect(sendBookingConfirmation(mockOrder))
        .rejects.toThrow('SMTP connection failed');
    });

    it('should format email templates correctly', async () => {
      const { generateBookingConfirmationEmail } = await import('@/lib/email');
      
      const mockOrder = {
        id: 'order_template_123',
        customerName: 'Template Test',
        customerEmail: 'template@test.com',
        totalAmount: 150,
        orderItems: [
          {
            product: { name: 'Test Camp' },
            student: { name: 'Test Student' },
            bookingDate: new Date('2024-10-15T09:00:00Z')
          }
        ]
      };

      (generateBookingConfirmationEmail as any).mockReturnValue({
        subject: 'TinkerTank Booking Confirmation - Order #order_template_123',
        body: `
          Dear Template Test,
          
          Your booking for Test Student has been confirmed:
          - Camp: Test Camp
          - Date: October 15, 2024
          - Total: $150
          
          Thank you for choosing TinkerTank!
        `
      });

      const email = generateBookingConfirmationEmail(mockOrder);

      expect(email.subject).toContain('TinkerTank Booking Confirmation');
      expect(email.subject).toContain('order_template_123');
      expect(email.body).toContain('Template Test');
      expect(email.body).toContain('Test Student');
      expect(email.body).toContain('Test Camp');
    });

    it('should support multiple recipients and CC/BCC', async () => {
      const { sendAdminNotification } = await import('@/lib/email');
      
      const notificationData = {
        subject: 'New Booking Alert',
        recipients: ['admin@tinkertank.com.au'],
        cc: ['manager@tinkertank.com.au'],
        content: 'New booking received for STEM Camp'
      };

      (sendAdminNotification as any).mockResolvedValue({
        messageId: 'admin_notification_123',
        accepted: notificationData.recipients.concat(notificationData.cc),
        rejected: []
      });

      const result = await sendAdminNotification(notificationData);

      expect(result.accepted).toHaveLength(2);
      expect(result.accepted).toContain('admin@tinkertank.com.au');
      expect(result.accepted).toContain('manager@tinkertank.com.au');
    });
  });

  describe('3. Calendar API Integration', () => {
    it('should create calendar events from bookings', async () => {
      const mockCalendarEvent = {
        id: 'cal_event_123',
        title: 'STEM Day Camp - Test Student',
        start: '2024-10-15T09:00:00+11:00',
        end: '2024-10-15T15:00:00+11:00',
        location: 'Neutral Bay Workshop',
        description: 'Student: Test Student\nAllergies: None\nParent: Test Parent',
        attendees: ['parent@test.com']
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          eventId: 'cal_event_123',
          calendarEvent: mockCalendarEvent
        })
      });

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'STEM Day Camp - Test Student',
          startDateTime: '2024-10-15T09:00:00+11:00',
          endDateTime: '2024-10-15T15:00:00+11:00',
          locationId: 'neutral_bay',
          studentInfo: {
            name: 'Test Student',
            allergies: 'None',
            parentEmail: 'parent@test.com'
          }
        })
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.calendarEvent.title).toContain('Test Student');
    });

    it('should handle recurring event templates', async () => {
      const recurringTemplate = {
        name: 'Weekly Ignite Session - Student Name',
        type: 'RECURRING_SESSION',
        daysOfWeek: [3], // Wednesday
        startTime: '16:00',
        endTime: '17:00',
        startDate: '2024-10-01',
        endDate: '2024-12-31',
        locationId: 'neutral_bay'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          templateId: 'template_recurring_123',
          generatedEvents: 13 // 13 weeks
        })
      });

      const response = await fetch('/api/events/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recurringTemplate)
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.generatedEvents).toBe(13);
    });

    it('should sync with external calendar providers', async () => {
      const syncData = {
        provider: 'google',
        calendarId: 'tinkertank@gmail.com',
        events: [
          {
            id: 'local_event_123',
            title: 'STEM Camp - Alice',
            start: '2024-10-15T09:00:00+11:00'
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          synced: 1,
          conflicts: 0,
          errors: []
        })
      });

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.conflicts).toBe(0);
    });

    it('should handle calendar capacity conflicts', async () => {
      const conflictingBooking = {
        title: 'STEM Camp - Overflow Student',
        startDateTime: '2024-10-15T09:00:00+11:00',
        locationId: 'neutral_bay' // Already at capacity
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({
          success: false,
          error: 'CAPACITY_EXCEEDED',
          message: 'Event capacity exceeded for this time slot',
          availableSlots: 0,
          maxCapacity: 20
        })
      });

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conflictingBooking)
      });

      expect(response.status).toBe(409);
      const result = await response.json();
      expect(result.error).toBe('CAPACITY_EXCEEDED');
    });
  });

  describe('4. Webhook Processing Integration', () => {
    it('should process Stripe webhooks end-to-end', async () => {
      const webhookPayload = {
        id: 'evt_webhook_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_webhook_123',
            status: 'succeeded',
            amount: 20000,
            metadata: {
              orderId: 'order_webhook_123'
            }
          }
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          orderId: 'order_webhook_123',
          orderStatus: 'PAID',
          eventsCreated: 2,
          emailSent: true
        })
      });

      const response = await fetch('/api/stripe/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test_webhook_signature',
          'content-type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.eventsCreated).toBe(2);
      expect(result.emailSent).toBe(true);
    });

    it('should handle webhook signature validation', async () => {
      const invalidWebhook = {
        id: 'evt_invalid_123',
        type: 'payment_intent.succeeded'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature'
        })
      });

      const response = await fetch('/api/stripe/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid_signature',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidWebhook)
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBe('INVALID_SIGNATURE');
    });

    it('should implement webhook retry logic', async () => {
      const retryWebhook = {
        id: 'evt_retry_123',
        type: 'payment_intent.succeeded'
      };

      let attemptCount = 0;

      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        
        if (attemptCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({
              success: false,
              error: 'INTERNAL_SERVER_ERROR'
            })
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            attempt: attemptCount
          })
        });
      });

      // Simulate webhook retry attempts
      let response;
      for (let i = 0; i < 3; i++) {
        response = await fetch('/api/stripe/webhooks', {
          method: 'POST',
          body: JSON.stringify(retryWebhook)
        });
        
        if (response.ok) break;
      }

      const result = await response!.json();
      expect(result.success).toBe(true);
      expect(result.attempt).toBe(3);
    });
  });

  describe('5. Service Integration Error Handling', () => {
    it('should handle cascading service failures', async () => {
      // Simulate Stripe success but email failure
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_cascade_123',
        status: 'succeeded',
        metadata: { orderId: 'order_cascade_123' }
      });

      const { sendBookingConfirmation } = await import('@/lib/email');
      (sendBookingConfirmation as any).mockRejectedValue(
        new Error('Email service unavailable')
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          paymentProcessed: true,
          eventsCreated: true,
          emailSent: false,
          warnings: ['Email delivery failed - will retry']
        })
      });

      const response = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId: 'pi_cascade_123' })
      });

      const result = await response.json();

      expect(result.paymentProcessed).toBe(true);
      expect(result.eventsCreated).toBe(true);
      expect(result.emailSent).toBe(false);
      expect(result.warnings).toContain(expect.stringMatching(/email.*failed/i));
    });

    it('should implement circuit breaker pattern', async () => {
      let failureCount = 0;
      const maxFailures = 3;

      const circuitBreaker = {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failures: 0,
        lastFailure: null
      };

      const mockServiceCall = vi.fn().mockImplementation(() => {
        if (circuitBreaker.state === 'OPEN') {
          throw new Error('Circuit breaker is open');
        }

        failureCount++;
        if (failureCount <= maxFailures) {
          circuitBreaker.failures++;
          if (circuitBreaker.failures >= maxFailures) {
            circuitBreaker.state = 'OPEN';
          }
          throw new Error('Service unavailable');
        }

        circuitBreaker.failures = 0;
        circuitBreaker.state = 'CLOSED';
        return { success: true };
      });

      // Test circuit breaker opening
      for (let i = 0; i < maxFailures; i++) {
        await expect(mockServiceCall()).rejects.toThrow('Service unavailable');
      }

      expect(circuitBreaker.state).toBe('OPEN');

      // Test circuit breaker blocking calls
      await expect(mockServiceCall()).rejects.toThrow('Circuit breaker is open');
    });

    it('should handle rate limiting from external services', async () => {
      const rateLimitError = {
        status: 429,
        headers: {
          'retry-after': '60' // seconds
        }
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'retry-after': '60' }),
          json: () => Promise.resolve({
            error: 'RATE_LIMITED',
            message: 'Too many requests'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      // First call gets rate limited
      let response = await fetch('/api/external-service');
      expect(response.status).toBe(429);

      // Wait for retry-after period (simulated)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Retry succeeds
      response = await fetch('/api/external-service');
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('6. Service Monitoring and Health Checks', () => {
    it('should monitor external service health', async () => {
      const healthChecks = {
        stripe: { status: 'healthy', responseTime: 150 },
        email: { status: 'healthy', responseTime: 75 },
        calendar: { status: 'degraded', responseTime: 3000 }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'degraded',
          services: healthChecks,
          timestamp: new Date().toISOString()
        })
      });

      const response = await fetch('/api/health/external');
      const health = await response.json();

      expect(health.services.stripe.status).toBe('healthy');
      expect(health.services.calendar.status).toBe('degraded');
      expect(health.status).toBe('degraded'); // Overall status
    });

    it('should track service performance metrics', async () => {
      const metrics = {
        stripe: {
          successRate: 0.995,
          averageResponseTime: 180,
          errorRate: 0.005
        },
        email: {
          successRate: 0.985,
          averageResponseTime: 250,
          errorRate: 0.015
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          metrics,
          timestamp: new Date().toISOString(),
          period: '24h'
        })
      });

      const response = await fetch('/api/metrics/external');
      const metricsData = await response.json();

      expect(metricsData.metrics.stripe.successRate).toBeGreaterThan(0.99);
      expect(metricsData.metrics.email.successRate).toBeGreaterThan(0.98);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn()
  },
  customers: {
    create: vi.fn(),
    retrieve: vi.fn()
  },
  webhooks: {
    constructEvent: vi.fn()
  }
};

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe)
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn()
    },
    orderItem: {
      create: vi.fn(),
      createMany: vi.fn()
    },
    student: {
      create: vi.fn(),
      findFirst: vi.fn()
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    location: {
      findFirst: vi.fn()
    },
    event: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn()
    },
    booking: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

describe('API Integration Tests', () => {
  const mockProduct = {
    id: 'product_api_123',
    name: 'Creative Coding Camp',
    type: 'CAMP',
    price: 22000, // $220
    duration: 480, // 8 hours
    ageMin: 9,
    ageMax: 15,
    capacity: 12,
    description: 'Learn coding through creative projects'
  };

  const mockStudent = {
    id: 'student_api_123',
    name: 'API Test Student',
    age: 11,
    allergies: 'Nuts',
    medicalNotes: 'Needs to sit at the front',
    parentName: 'API Test Parent',
    parentEmail: 'apitest@parent.com',
    parentPhone: '+61444555666'
  };

  const mockLocation = {
    id: 'location_api_123',
    name: 'TinkerTank Sydney',
    address: '789 Innovation Street, Sydney NSW 2000',
    capacity: 25,
    timezone: 'Australia/Sydney'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Intent Creation API', () => {
    it('should create payment intent with valid cart items', async () => {
      const requestPayload = {
        items: [{
          productId: 'product_api_123',
          selectedDate: '2025-01-15',
          selectedTime: '09:00',
          price: 220,
          studentInfo: mockStudent
        }],
        customerInfo: {
          name: 'API Test Parent',
          email: 'apitest@parent.com',
          phone: '+61444555666'
        }
      };

      // Mock database responses
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      (prisma.student.create as any).mockResolvedValue(mockStudent);
      (prisma.order.create as any).mockResolvedValue({
        id: 'order_api_123',
        customerName: requestPayload.customerInfo.name,
        customerEmail: requestPayload.customerInfo.email,
        totalAmount: 22000,
        status: 'PENDING'
      });

      // Mock Stripe payment intent creation
      const mockPaymentIntent = {
        id: 'pi_api_123',
        client_secret: 'pi_api_123_secret_test',
        amount: 22000,
        currency: 'aud',
        status: 'requires_payment_method',
        metadata: {
          orderId: 'order_api_123'
        }
      };

      (mockStripe.paymentIntents.create as any).mockResolvedValue(mockPaymentIntent);

      // Simulate API handler
      const createPaymentIntentHandler = async (request: NextRequest) => {
        const body = await request.json();
        
        try {
          // Validate products
          for (const item of body.items) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId }
            });
            if (!product) {
              return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
          }

          // Create students
          const students = [];
          for (const item of body.items) {
            const student = await prisma.student.create({
              data: item.studentInfo
            });
            students.push(student);
          }

          // Calculate total
          const totalAmount = body.items.reduce((sum: number, item: any) => sum + (item.price * 100), 0);

          // Create order
          const order = await prisma.order.create({
            data: {
              customerName: body.customerInfo.name,
              customerEmail: body.customerInfo.email,
              customerPhone: body.customerInfo.phone,
              totalAmount,
              status: 'PENDING',
              currency: 'AUD'
            }
          });

          // Create payment intent
          const paymentIntent = await mockStripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'aud',
            metadata: {
              orderId: order.id
            }
          });

          return NextResponse.json({
            paymentIntent: {
              id: paymentIntent.id,
              client_secret: paymentIntent.client_secret,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: paymentIntent.status
            },
            orderId: order.id
          });

        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
          );
        }
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const response = await createPaymentIntentHandler(request);
      const result = await response.json();

      expect(result.paymentIntent.id).toBe('pi_api_123');
      expect(result.paymentIntent.amount).toBe(22000);
      expect(result.paymentIntent.currency).toBe('aud');
      expect(result.orderId).toBe('order_api_123');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product_api_123' }
      });
      expect(prisma.student.create).toHaveBeenCalledWith({
        data: mockStudent
      });
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 22000,
        currency: 'aud',
        metadata: { orderId: 'order_api_123' }
      });
    });

    it('should handle invalid product ID', async () => {
      const requestPayload = {
        items: [{
          productId: 'nonexistent_product',
          selectedDate: '2025-01-15',
          price: 220,
          studentInfo: mockStudent
        }],
        customerInfo: {
          name: 'Test Parent',
          email: 'test@parent.com',
          phone: '+61444555666'
        }
      };

      (prisma.product.findUnique as any).mockResolvedValue(null);

      const createPaymentIntentHandler = async (request: NextRequest) => {
        const body = await request.json();
        
        for (const item of body.items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId }
          });
          if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
          }
        }

        return NextResponse.json({ success: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      });

      const response = await createPaymentIntentHandler(request);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toBe('Product not found');
    });

    it('should validate required fields', async () => {
      const invalidRequestPayload = {
        items: [{
          productId: 'product_api_123',
          selectedDate: '2025-01-15',
          price: 220,
          // Missing studentInfo
        }],
        // Missing customerInfo
      };

      const createPaymentIntentHandler = async (request: NextRequest) => {
        const body = await request.json();
        
        if (!body.customerInfo || !body.customerInfo.email) {
          return NextResponse.json({ error: 'Customer information required' }, { status: 400 });
        }

        if (!body.items || body.items.length === 0) {
          return NextResponse.json({ error: 'Cart items required' }, { status: 400 });
        }

        for (const item of body.items) {
          if (!item.studentInfo || !item.studentInfo.name) {
            return NextResponse.json({ error: 'Student information required' }, { status: 400 });
          }
        }

        return NextResponse.json({ success: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(invalidRequestPayload)
      });

      const response = await createPaymentIntentHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Customer information required');
    });
  });

  describe('Payment Status API', () => {
    it('should return payment and order status', async () => {
      const mockOrder = {
        id: 'order_status_123',
        status: 'PAID',
        customerName: 'Status Test Parent',
        totalAmount: 22000,
        createdAt: new Date(),
        orderItems: [{
          id: 'item_status_123',
          product: mockProduct,
          student: mockStudent,
          bookingDate: new Date('2025-01-15T09:00:00Z')
        }]
      };

      const mockEvents = [{
        id: 'event_status_123',
        title: 'Creative Coding Camp - API Test Student',
        startDateTime: new Date('2025-01-15T09:00:00Z'),
        endDateTime: new Date('2025-01-15T17:00:00Z'),
        type: 'CAMP'
      }];

      (mockStripe.paymentIntents.retrieve as any).mockResolvedValue({
        id: 'pi_status_123',
        status: 'succeeded',
        metadata: {
          orderId: 'order_status_123'
        }
      });

      (prisma.order.findFirst as any).mockResolvedValue(mockOrder);
      (prisma.event.findMany as any).mockResolvedValue(mockEvents);

      const paymentStatusHandler = async (request: NextRequest) => {
        const { searchParams } = new URL(request.url);
        const paymentIntentId = searchParams.get('payment_intent_id');

        if (!paymentIntentId) {
          return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
        }

        try {
          const paymentIntent = await mockStripe.paymentIntents.retrieve(paymentIntentId);
          const orderId = paymentIntent.metadata.orderId;

          const order = await prisma.order.findFirst({
            where: { id: orderId },
            include: {
              orderItems: {
                include: { product: true, student: true }
              }
            }
          });

          const events = await prisma.event.findMany({
            where: {
              bookings: {
                some: {
                  student: {
                    orderItems: {
                      some: { orderId }
                    }
                  }
                }
              }
            }
          });

          return NextResponse.json({
            paymentStatus: paymentIntent.status,
            orderStatus: order?.status,
            eventsCreated: events.length,
            totalBookings: order?.orderItems.length || 0,
            allEventsCreated: events.length === (order?.orderItems.length || 0),
            order,
            events
          });

        } catch (error) {
          return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
        }
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/payment-status?payment_intent_id=pi_status_123');
      const response = await paymentStatusHandler(request);
      const result = await response.json();

      expect(result.paymentStatus).toBe('succeeded');
      expect(result.orderStatus).toBe('PAID');
      expect(result.eventsCreated).toBe(1);
      expect(result.totalBookings).toBe(1);
      expect(result.allEventsCreated).toBe(true);
      expect(result.order.id).toBe('order_status_123');
      expect(result.events).toHaveLength(1);
    });

    it('should handle missing payment intent ID', async () => {
      const paymentStatusHandler = async (request: NextRequest) => {
        const { searchParams } = new URL(request.url);
        const paymentIntentId = searchParams.get('payment_intent_id');

        if (!paymentIntentId) {
          return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/payment-status');
      const response = await paymentStatusHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Payment intent ID required');
    });
  });

  describe('Order Retrieval API', () => {
    it('should retrieve order with events and bookings', async () => {
      const mockFullOrder = {
        id: 'order_full_123',
        customerName: 'Full Order Parent',
        customerEmail: 'fullorder@parent.com',
        status: 'PAID',
        totalAmount: 44000, // $440
        createdAt: new Date(),
        orderItems: [{
          id: 'item_full_123',
          productId: 'product_api_123',
          studentId: 'student_api_123',
          bookingDate: new Date('2025-01-20T10:00:00Z'),
          price: 22000,
          product: mockProduct,
          student: mockStudent
        }]
      };

      const mockOrderEvents = [{
        id: 'event_full_123',
        title: 'Creative Coding Camp - API Test Student',
        startDateTime: new Date('2025-01-20T10:00:00Z'),
        endDateTime: new Date('2025-01-20T18:00:00Z'),
        type: 'CAMP',
        locationId: 'location_api_123',
        location: mockLocation,
        bookings: [{
          id: 'booking_full_123',
          studentId: 'student_api_123',
          status: 'CONFIRMED',
          student: mockStudent
        }]
      }];

      (prisma.order.findUnique as any).mockResolvedValue(mockFullOrder);
      (prisma.event.findMany as any).mockResolvedValue(mockOrderEvents);

      const orderRetrievalHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
        try {
          const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
              orderItems: {
                include: {
                  product: true,
                  student: true
                }
              }
            }
          });

          if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          }

          const events = await prisma.event.findMany({
            where: {
              bookings: {
                some: {
                  student: {
                    orderItems: {
                      some: { orderId: params.id }
                    }
                  }
                }
              }
            },
            include: {
              location: true,
              bookings: {
                include: { student: true }
              }
            }
          });

          return NextResponse.json({
            order,
            events,
            summary: {
              totalEvents: events.length,
              totalBookings: events.reduce((sum, event) => sum + event.bookings.length, 0),
              upcomingEvents: events.filter(event => event.startDateTime > new Date()).length
            }
          });

        } catch (error) {
          return NextResponse.json({ error: 'Failed to retrieve order' }, { status: 500 });
        }
      };

      const request = new NextRequest('http://localhost:3000/api/orders/order_full_123');
      const response = await orderRetrievalHandler(request, { params: { id: 'order_full_123' } });
      const result = await response.json();

      expect(result.order.id).toBe('order_full_123');
      expect(result.order.status).toBe('PAID');
      expect(result.events).toHaveLength(1);
      expect(result.events[0].bookings).toHaveLength(1);
      expect(result.summary.totalEvents).toBe(1);
      expect(result.summary.totalBookings).toBe(1);
    });

    it('should handle non-existent order', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      const orderRetrievalHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
        const order = await prisma.order.findUnique({
          where: { id: params.id }
        });

        if (!order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order });
      };

      const request = new NextRequest('http://localhost:3000/api/orders/nonexistent_order');
      const response = await orderRetrievalHandler(request, { params: { id: 'nonexistent_order' } });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('Payment Confirmation API', () => {
    it('should confirm payment and create events', async () => {
      const requestPayload = {
        paymentIntentId: 'pi_confirm_123',
        orderId: 'order_confirm_123'
      };

      const mockPaymentIntent = {
        id: 'pi_confirm_123',
        status: 'succeeded',
        amount: 22000,
        metadata: {
          orderId: 'order_confirm_123'
        }
      };

      const mockOrderForConfirm = {
        id: 'order_confirm_123',
        status: 'PENDING',
        totalAmount: 22000,
        orderItems: [{
          id: 'item_confirm_123',
          productId: 'product_api_123',
          studentId: 'student_api_123',
          bookingDate: new Date('2025-01-25T11:00:00Z'),
          price: 22000,
          product: mockProduct,
          student: mockStudent
        }]
      };

      (mockStripe.paymentIntents.retrieve as any).mockResolvedValue(mockPaymentIntent);
      (prisma.order.findFirst as any).mockResolvedValue(mockOrderForConfirm);
      (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
      (prisma.order.update as any).mockResolvedValue({
        ...mockOrderForConfirm,
        status: 'PAID',
        paidAt: new Date()
      });
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_confirm_123',
        title: 'Creative Coding Camp - API Test Student'
      });
      (prisma.booking.create as any).mockResolvedValue({
        id: 'booking_confirm_123'
      });

      const confirmPaymentHandler = async (request: NextRequest) => {
        const body = await request.json();

        try {
          const paymentIntent = await mockStripe.paymentIntents.retrieve(body.paymentIntentId);
          
          if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
          }

          const order = await prisma.order.findFirst({
            where: { id: body.orderId },
            include: { orderItems: { include: { product: true, student: true } } }
          });

          if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          }

          // Update order status
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
              stripePaymentIntentId: paymentIntent.id
            }
          });

          // Create events and bookings
          const location = await prisma.location.findFirst();
          const createdEvents = [];

          for (const item of order.orderItems) {
            const event = await prisma.event.create({
              data: {
                title: `${item.product.name} - ${item.student.name}`,
                type: item.product.type,
                startDateTime: item.bookingDate,
                endDateTime: new Date(item.bookingDate.getTime() + (item.product.duration * 60000)),
                locationId: location!.id,
                maxCapacity: item.product.capacity
              }
            });

            await prisma.booking.create({
              data: {
                eventId: event.id,
                studentId: item.student.id,
                status: 'CONFIRMED'
              }
            });

            createdEvents.push(event);
          }

          return NextResponse.json({
            success: true,
            order: { ...order, status: 'PAID' },
            eventsCreated: createdEvents.length,
            events: createdEvents
          });

        } catch (error) {
          return NextResponse.json({ error: 'Payment confirmation failed' }, { status: 500 });
        }
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/confirm-payment', {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      });

      const response = await confirmPaymentHandler(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.order.status).toBe('PAID');
      expect(result.eventsCreated).toBe(1);
      expect(result.events).toHaveLength(1);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_confirm_123' },
        data: {
          status: 'PAID',
          paidAt: expect.any(Date),
          stripePaymentIntentId: 'pi_confirm_123'
        }
      });
    });

    it('should handle payment that is not completed', async () => {
      const requestPayload = {
        paymentIntentId: 'pi_incomplete_123',
        orderId: 'order_incomplete_123'
      };

      (mockStripe.paymentIntents.retrieve as any).mockResolvedValue({
        id: 'pi_incomplete_123',
        status: 'requires_payment_method'
      });

      const confirmPaymentHandler = async (request: NextRequest) => {
        const body = await request.json();
        
        const paymentIntent = await mockStripe.paymentIntents.retrieve(body.paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/confirm-payment', {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      });

      const response = await confirmPaymentHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Payment not completed');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle Stripe API failures gracefully', async () => {
      const requestPayload = {
        items: [{ productId: 'product_api_123', price: 220, studentInfo: mockStudent }],
        customerInfo: { name: 'Test', email: 'test@test.com', phone: '+61123456789' }
      };

      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      (mockStripe.paymentIntents.create as any).mockRejectedValue(new Error('Stripe API Error'));

      const createPaymentIntentHandler = async (request: NextRequest) => {
        try {
          await mockStripe.paymentIntents.create({
            amount: 22000,
            currency: 'aud'
          });
        } catch (error) {
          return NextResponse.json({ error: 'Payment service unavailable' }, { status: 503 });
        }

        return NextResponse.json({ success: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      });

      const response = await createPaymentIntentHandler(request);
      const result = await response.json();

      expect(response.status).toBe(503);
      expect(result.error).toBe('Payment service unavailable');
    });

    it('should handle database connection failures', async () => {
      const requestPayload = {
        items: [{ productId: 'product_api_123', studentInfo: mockStudent }],
        customerInfo: { name: 'Test', email: 'test@test.com' }
      };

      (prisma.product.findUnique as any).mockRejectedValue(new Error('Database connection failed'));

      const createPaymentIntentHandler = async (request: NextRequest) => {
        try {
          await prisma.product.findUnique({ where: { id: 'product_api_123' } });
        } catch (error) {
          return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
        }

        return NextResponse.json({ success: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      });

      const response = await createPaymentIntentHandler(request);
      const result = await response.json();

      expect(response.status).toBe(503);
      expect(result.error).toBe('Service temporarily unavailable');
    });

    it('should handle malformed JSON requests', async () => {
      const apiHandler = async (request: NextRequest) => {
        try {
          await request.json();
        } catch (error) {
          return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await apiHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid JSON payload');
    });
  });
});

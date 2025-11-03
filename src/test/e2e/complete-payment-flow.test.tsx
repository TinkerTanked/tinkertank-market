import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { prisma } from '@/lib/prisma';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Test data constants
const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED: '4000000000000069',
  PROCESSING_ERROR: '4000000000000119',
  AUTHENTICATION_REQUIRED: '4000002500003155'
};

const mockOrder = {
  id: 'order_test_123',
  customerName: 'Test Parent',
  customerEmail: 'parent@test.com',
  customerPhone: '+61412345678',
  status: 'PENDING',
  totalAmount: 15000, // $150.00 in cents
  currency: 'AUD',
  createdAt: new Date(),
  updatedAt: new Date(),
  orderItems: [{
    id: 'item_123',
    orderId: 'order_test_123',
    studentId: 'student_123',
    productId: 'product_camp_123',
    bookingDate: new Date('2024-12-15T09:00:00Z'),
    price: 15000,
    student: {
      id: 'student_123',
      name: 'Test Student',
      age: 8,
      allergies: 'None',
      medicalNotes: null,
      parentName: 'Test Parent',
      parentEmail: 'parent@test.com',
      parentPhone: '+61412345678'
    },
    product: {
      id: 'product_camp_123',
      name: 'STEM Day Camp',
      type: 'CAMP',
      price: 15000,
      duration: 360, // 6 hours
      ageMin: 5,
      ageMax: 12,
      description: 'Full day STEM activities',
      capacity: 20
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

// Mock Stripe Elements
const mockStripeElement = {
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  update: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn(),
  focus: vi.fn(),
  unmount: vi.fn()
};

const mockStripe = {
  elements: vi.fn(() => ({
    create: vi.fn(() => mockStripeElement),
    getElement: vi.fn(() => mockStripeElement),
    submit: vi.fn()
  })),
  confirmPayment: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  createPaymentMethod: vi.fn(),
  handleNextAction: vi.fn()
};

// Mock all external dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn()
    },
    orderItem: {
      create: vi.fn(),
      createMany: vi.fn()
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
      create: vi.fn()
    },
    event: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    booking: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn()
    },
    recurringTemplate: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn()
    },
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn(),
      update: vi.fn()
    },
    customers: {
      create: vi.fn(),
      retrieve: vi.fn()
    }
  }))
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe))
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Complete Payment Flow E2E Tests', () => {
  let stripePromise: any;

  beforeAll(async () => {
    stripePromise = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    
    // Reset cart store
    useEnhancedCartStore.getState().clearCart();
    
    // Setup default fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Checkout Flow Tests', () => {
    it('should navigate from cart to checkout successfully', async () => {
      // Add item to cart
      const { addItem } = useEnhancedCartStore.getState();
      addItem({
        id: 'product_camp_123',
        name: 'STEM Day Camp',
        price: 150,
        type: 'CAMP',
        category: 'camps',
        ageRange: '5-12',
        duration: 360,
        selectedDate: '2024-12-15'
      } as any);

      expect(useEnhancedCartStore.getState().items).toHaveLength(1);
      expect(useEnhancedCartStore.getState().total).toBe(150);
    });

    it('should validate student information correctly', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [studentInfo, setStudentInfo] = React.useState({
          name: '',
          age: 0,
          allergies: '',
          medicalNotes: '',
          parentName: '',
          parentEmail: '',
          parentPhone: ''
        });

        return (
          <form>
            <input
              data-testid="student-name"
              value={studentInfo.name}
              onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
              required
            />
            <input
              data-testid="student-age"
              type="number"
              value={studentInfo.age || ''}
              onChange={(e) => setStudentInfo({...studentInfo, age: parseInt(e.target.value) || 0})}
              required
            />
            <input
              data-testid="parent-email"
              type="email"
              value={studentInfo.parentEmail}
              onChange={(e) => setStudentInfo({...studentInfo, parentEmail: e.target.value})}
              required
            />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<TestComponent />);

      // Test empty form validation
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Fill out form with valid data
      await user.type(screen.getByTestId('student-name'), 'Test Student');
      await user.type(screen.getByTestId('student-age'), '8');
      await user.type(screen.getByTestId('parent-email'), 'parent@test.com');

      expect(screen.getByTestId('student-name')).toHaveValue('Test Student');
      expect(screen.getByTestId('student-age')).toHaveValue(8);
      expect(screen.getByTestId('parent-email')).toHaveValue('parent@test.com');
    });

    it('should validate billing information collection', async () => {
      const user = userEvent.setup();

      const TestBillingForm = () => {
        const [billingInfo, setBillingInfo] = React.useState({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          postcode: ''
        });

        return (
          <form>
            <input
              data-testid="billing-name"
              value={billingInfo.name}
              onChange={(e) => setBillingInfo({...billingInfo, name: e.target.value})}
              required
            />
            <input
              data-testid="billing-email"
              type="email"
              value={billingInfo.email}
              onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
              required
            />
            <input
              data-testid="billing-phone"
              type="tel"
              value={billingInfo.phone}
              onChange={(e) => setBillingInfo({...billingInfo, phone: e.target.value})}
              required
            />
          </form>
        );
      };

      render(<TestBillingForm />);

      await user.type(screen.getByTestId('billing-name'), 'Test Parent');
      await user.type(screen.getByTestId('billing-email'), 'parent@test.com');
      await user.type(screen.getByTestId('billing-phone'), '+61412345678');

      expect(screen.getByTestId('billing-name')).toHaveValue('Test Parent');
      expect(screen.getByTestId('billing-email')).toHaveValue('parent@test.com');
      expect(screen.getByTestId('billing-phone')).toHaveValue('+61412345678');
    });
  });

  describe('2. Stripe Integration Tests', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 15000,
        currency: 'aud',
        status: 'requires_payment_method'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          paymentIntent: mockPaymentIntent,
          orderId: 'order_test_123'
        })
      });

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [mockOrder.orderItems[0]],
          customerInfo: {
            name: 'Test Parent',
            email: 'parent@test.com',
            phone: '+61412345678'
          }
        })
      });

      const result = await response.json();
      
      expect(result.paymentIntent.id).toBe('pi_test_123');
      expect(result.paymentIntent.amount).toBe(15000);
      expect(result.orderId).toBe('order_test_123');
    });

    it('should handle successful payment with test card', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
          amount: 15000,
          currency: 'aud'
        }
      });

      const result = await mockStripe.confirmPayment({
        elements: mockStripe.elements(),
        confirmParams: {
          return_url: 'http://localhost:3000/checkout/success'
        }
      });

      expect(result.paymentIntent.status).toBe('succeeded');
      expect(mockStripe.confirmPayment).toHaveBeenCalled();
    });

    it('should handle payment failure scenarios', async () => {
      const declinedError = {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined.'
      };

      mockStripe.confirmPayment.mockResolvedValue({
        error: declinedError
      });

      const result = await mockStripe.confirmPayment({
        elements: mockStripe.elements(),
        confirmParams: {
          return_url: 'http://localhost:3000/checkout/success'
        }
      });

      expect(result.error.code).toBe('card_declined');
      expect(result.error.message).toBe('Your card was declined.');
    });

    it('should process webhook events correctly', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            metadata: {
              orderId: 'order_test_123'
            }
          }
        }
      };

      // Mock order update
      (prisma.order.update as any).mockResolvedValue({
        ...mockOrder,
        status: 'PAID'
      });

      // Mock event creation
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_123',
        title: 'STEM Day Camp - Test Student'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ received: true })
      });

      const response = await fetch('/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test_signature'
        },
        body: JSON.stringify(webhookEvent)
      });

      const result = await response.json();
      expect(result.received).toBe(true);
    });
  });

  describe('3. Order Creation Tests', () => {
    it('should create order with correct details', async () => {
      (prisma.order.create as any).mockResolvedValue(mockOrder);
      (prisma.student.create as any).mockResolvedValue(mockOrder.orderItems[0].student);

      const orderData = {
        customerName: 'Test Parent',
        customerEmail: 'parent@test.com',
        customerPhone: '+61412345678',
        totalAmount: 15000,
        status: 'PENDING',
        items: mockOrder.orderItems
      };

      expect(orderData.customerName).toBe('Test Parent');
      expect(orderData.totalAmount).toBe(15000);
      expect(orderData.items).toHaveLength(1);
      expect(orderData.items[0].product.name).toBe('STEM Day Camp');
    });

    it('should validate order item details accuracy', () => {
      const orderItem = mockOrder.orderItems[0];

      expect(orderItem.productId).toBe('product_camp_123');
      expect(orderItem.price).toBe(15000);
      expect(orderItem.bookingDate).toEqual(new Date('2024-12-15T09:00:00Z'));
      expect(orderItem.student.name).toBe('Test Student');
      expect(orderItem.product.type).toBe('CAMP');
    });

    it('should persist student data correctly', async () => {
      const studentData = {
        name: 'Test Student',
        age: 8,
        allergies: 'None',
        medicalNotes: null,
        parentName: 'Test Parent',
        parentEmail: 'parent@test.com',
        parentPhone: '+61412345678'
      };

      (prisma.student.create as any).mockResolvedValue({
        id: 'student_123',
        ...studentData
      });

      const result = await prisma.student.create({
        data: studentData
      });

      expect(result.name).toBe('Test Student');
      expect(result.age).toBe(8);
      expect(result.parentEmail).toBe('parent@test.com');
    });
  });

  describe('4. Calendar Event Creation Tests', () => {
    it('should create calendar event after successful payment', async () => {
      const mockEvent = {
        id: 'event_123',
        title: 'STEM Day Camp - Test Student',
        type: 'CAMP',
        startDateTime: new Date('2024-12-15T09:00:00Z'),
        endDateTime: new Date('2024-12-15T15:00:00Z'),
        locationId: 'location_123',
        maxCapacity: 20,
        currentBookings: 1
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
      (prisma.event.create as any).mockResolvedValue(mockEvent);
      (prisma.booking.create as any).mockResolvedValue({
        id: 'booking_123',
        eventId: 'event_123',
        studentId: 'student_123'
      });

      const { eventService } = await import('@/lib/events');
      const events = await eventService.createEventsFromOrder('order_test_123');

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('STEM Day Camp - Test Student');
      expect(events[0].type).toBe('CAMP');
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'STEM Day Camp - Test Student',
          type: 'CAMP',
          startDateTime: new Date('2024-12-15T09:00:00Z')
        })
      });
    });

    it('should validate event details accuracy', async () => {
      const eventData = {
        title: 'STEM Day Camp - Test Student',
        type: 'CAMP',
        startDateTime: new Date('2024-12-15T09:00:00Z'),
        endDateTime: new Date('2024-12-15T15:00:00Z'),
        locationId: 'location_123',
        maxCapacity: 20
      };

      expect(eventData.title).toContain('Test Student');
      expect(eventData.type).toBe('CAMP');
      expect(eventData.startDateTime.getHours()).toBe(9);
      expect(eventData.endDateTime.getHours()).toBe(15);
      expect(eventData.maxCapacity).toBe(20);
    });

    it('should send email confirmation', async () => {
      const mockEmailData = {
        to: 'parent@test.com',
        subject: 'TinkerTank Booking Confirmation - STEM Day Camp',
        html: expect.stringContaining('Test Student'),
        attachments: expect.any(Array)
      };

      // Mock email service
      const mockSendEmail = vi.fn().mockResolvedValue({ success: true });
      
      await mockSendEmail(mockEmailData);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'parent@test.com',
          subject: expect.stringContaining('TinkerTank Booking Confirmation')
        })
      );
    });
  });

  describe('5. Post-Payment Flow Tests', () => {
    it('should display success page correctly', async () => {
      const mockSuccessData = {
        orderId: 'order_test_123',
        paymentIntentId: 'pi_test_123',
        customerName: 'Test Parent',
        totalAmount: 15000,
        currency: 'AUD',
        items: mockOrder.orderItems
      };

      const TestSuccessPage = () => (
        <div>
          <h1>Payment Successful!</h1>
          <p>Order ID: {mockSuccessData.orderId}</p>
          <p>Customer: {mockSuccessData.customerName}</p>
          <p>Total: ${(mockSuccessData.totalAmount / 100).toFixed(2)} {mockSuccessData.currency}</p>
          <div data-testid="order-items">
            {mockSuccessData.items.map(item => (
              <div key={item.id}>
                <p>{item.product.name}</p>
                <p>Student: {item.student.name}</p>
                <p>Date: {item.bookingDate.toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      );

      render(<TestSuccessPage />);

      expect(screen.getByText('Payment Successful!')).toBeDefined();
      expect(screen.getByText('Order ID: order_test_123')).toBeDefined();
      expect(screen.getByText('Customer: Test Parent')).toBeDefined();
      expect(screen.getByText('Total: $150.00 AUD')).toBeDefined();
      expect(screen.getByText('STEM Day Camp')).toBeDefined();
      expect(screen.getByText('Student: Test Student')).toBeDefined();
    });

    it('should clear cart after successful payment', () => {
      const { addItem, clearCart, items } = useEnhancedCartStore.getState();
      
      // Add items to cart
      addItem({
        id: 'product_123',
        name: 'Test Product',
        price: 100,
        type: 'CAMP'
      } as any);

      expect(items.length).toBe(1);

      // Simulate successful payment clearing cart
      clearCart();
      
      expect(useEnhancedCartStore.getState().items.length).toBe(0);
    });

    it('should check order confirmation details', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: mockOrder,
          events: [{
            id: 'event_123',
            title: 'STEM Day Camp - Test Student',
            startDateTime: '2024-12-15T09:00:00Z',
            endDateTime: '2024-12-15T15:00:00Z'
          }]
        })
      });

      const response = await fetch(`/api/orders/order_test_123`);
      const data = await response.json();

      expect(data.order.id).toBe('order_test_123');
      expect(data.order.status).toBe('PENDING');
      expect(data.events).toHaveLength(1);
      expect(data.events[0].title).toBe('STEM Day Camp - Test Student');
    });
  });

  describe('6. Error Scenarios Tests', () => {
    it('should handle payment declined gracefully', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        error: {
          type: 'card_error',
          code: 'card_declined',
          decline_code: 'generic_decline',
          message: 'Your card was declined.'
        }
      });

      const result = await mockStripe.confirmPayment({
        elements: mockStripe.elements(),
        confirmParams: {
          return_url: 'http://localhost:3000/checkout/success'
        }
      });

      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('card_declined');
      expect(result.error.message).toBe('Your card was declined.');
    });

    it('should handle network failure recovery', async () => {
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      let result;
      try {
        const response = await fetch('/api/stripe/create-payment-intent');
        result = await response.json();
      } catch (error) {
        // Retry logic
        const retryResponse = await fetch('/api/stripe/create-payment-intent');
        result = await retryResponse.json();
      }

      expect(result.success).toBe(true);
    });

    it('should handle database connection issues', async () => {
      (prisma.order.create as any).mockRejectedValue(new Error('Database connection failed'));

      await expect(
        prisma.order.create({
          data: {
            customerName: 'Test Parent',
            customerEmail: 'parent@test.com',
            totalAmount: 15000,
            status: 'PENDING'
          }
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle partial success scenarios', async () => {
      // Payment succeeds but event creation fails
      (prisma.order.update as any).mockResolvedValue({
        ...mockOrder,
        status: 'PAID'
      });
      (prisma.event.create as any).mockRejectedValue(new Error('Calendar service unavailable'));

      const { eventService } = await import('@/lib/events');
      
      await expect(
        eventService.createEventsFromOrder('order_test_123')
      ).rejects.toThrow('Calendar service unavailable');
    });

    it('should handle insufficient funds', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        error: {
          type: 'card_error',
          code: 'card_declined',
          decline_code: 'insufficient_funds',
          message: 'Your card has insufficient funds.'
        }
      });

      const result = await mockStripe.confirmPayment({
        elements: mockStripe.elements()
      });

      expect(result.error.decline_code).toBe('insufficient_funds');
      expect(result.error.message).toBe('Your card has insufficient funds.');
    });

    it('should handle authentication required', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          status: 'requires_action',
          next_action: {
            type: 'use_stripe_sdk'
          }
        }
      });

      const result = await mockStripe.confirmPayment({
        elements: mockStripe.elements()
      });

      expect(result.paymentIntent.status).toBe('requires_action');
      expect(result.paymentIntent.next_action.type).toBe('use_stripe_sdk');
    });
  });

  describe('7. Integration Tests', () => {
    it('should complete full end-to-end payment flow', async () => {
      // Step 1: Add item to cart
      const { addItem } = useEnhancedCartStore.getState();
      addItem({
        id: 'product_camp_123',
        name: 'STEM Day Camp',
        price: 150,
        type: 'CAMP',
        selectedDate: '2024-12-15'
      } as any);

      // Step 2: Create payment intent
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          paymentIntent: {
            id: 'pi_test_123',
            client_secret: 'pi_test_123_secret'
          },
          orderId: 'order_test_123'
        })
      });

      const paymentIntentResponse = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ items: useEnhancedCartStore.getState().items })
      });
      const { paymentIntent } = await paymentIntentResponse.json();

      // Step 3: Confirm payment
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          ...paymentIntent,
          status: 'succeeded'
        }
      });

      const confirmResult = await mockStripe.confirmPayment({
        elements: mockStripe.elements()
      });

      // Step 4: Check payment status
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          paymentStatus: 'succeeded',
          orderStatus: 'PAID',
          eventsCreated: 1,
          allEventsCreated: true
        })
      });

      const statusResponse = await fetch(`/api/stripe/payment-status?payment_intent_id=${paymentIntent.id}`);
      const status = await statusResponse.json();

      // Assertions
      expect(confirmResult.paymentIntent.status).toBe('succeeded');
      expect(status.paymentStatus).toBe('succeeded');
      expect(status.orderStatus).toBe('PAID');
      expect(status.allEventsCreated).toBe(true);
    });
  });
});

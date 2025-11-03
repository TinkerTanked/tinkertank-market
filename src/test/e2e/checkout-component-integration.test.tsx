import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Mock Stripe hooks
const mockStripe = {
  confirmPayment: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  elements: vi.fn(),
  createPaymentMethod: vi.fn()
};

const mockElements = {
  create: vi.fn(),
  getElement: vi.fn(),
  submit: vi.fn()
};

const mockCardElement = {
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  update: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn(),
  focus: vi.fn()
};

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  CardElement: () => <div data-testid="card-element">Mock Card Element</div>,
  PaymentElement: () => <div data-testid="payment-element">Mock Payment Element</div>
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe))
}));

// Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    prefetch: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/checkout'
}));

// Mock API calls
global.fetch = vi.fn();

describe('Checkout Component Integration Tests', () => {
  const mockCartItem = {
    id: 'product_checkout_123',
    name: 'Interactive Robotics Camp',
    price: 180,
    type: 'CAMP',
    category: 'camps',
    ageRange: '8-14',
    duration: 420, // 7 hours
    selectedDate: '2024-12-22',
    selectedTime: '09:00'
  };

  const mockStudentInfo = {
    name: 'Alex Johnson',
    age: 10,
    allergies: 'Shellfish',
    medicalNotes: 'Inhaler for asthma',
    parentName: 'Sarah Johnson',
    parentEmail: 'sarah.johnson@email.com',
    parentPhone: '+61423456789'
  };

  beforeAll(() => {
    // Setup test environment
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset cart
    useEnhancedCartStore.getState().clearCart();
    
    // Setup default fetch responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });

    // Setup Stripe mocks
    mockElements.getElement.mockReturnValue(mockCardElement);
    mockElements.create.mockReturnValue(mockCardElement);
  });

  describe('Multi-Step Checkout Flow', () => {
    const MultiStepCheckout = () => {
      const [currentStep, setCurrentStep] = React.useState(0);
      const [studentData, setStudentData] = React.useState(mockStudentInfo);
      const { items, total } = useEnhancedCartStore();

      const steps = ['Review Cart', 'Student Info', 'Payment'];

      const handleNext = () => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      };

      const handleBack = () => {
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
        }
      };

      return (
        <div>
          <div data-testid="step-indicator">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </div>
          
          {currentStep === 0 && (
            <div data-testid="cart-review">
              <h2>Review Your Cart</h2>
              {items.map(item => (
                <div key={item.id} data-testid={`cart-item-${item.id}`}>
                  <h3>{item.name}</h3>
                  <p>Date: {item.selectedDate}</p>
                  <p>Time: {item.selectedTime}</p>
                  <p>Price: ${item.price}</p>
                </div>
              ))}
              <div data-testid="cart-total">Total: ${total}</div>
              <button onClick={handleNext} data-testid="next-button">
                Continue to Student Info
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div data-testid="student-info-step">
              <h2>Student Information</h2>
              <form>
                <input
                  data-testid="student-name"
                  value={studentData.name}
                  onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                  placeholder="Student Name"
                  required
                />
                <input
                  data-testid="student-age"
                  type="number"
                  value={studentData.age}
                  onChange={(e) => setStudentData({...studentData, age: parseInt(e.target.value)})}
                  placeholder="Age"
                  required
                />
                <input
                  data-testid="student-allergies"
                  value={studentData.allergies}
                  onChange={(e) => setStudentData({...studentData, allergies: e.target.value})}
                  placeholder="Allergies (if any)"
                />
                <textarea
                  data-testid="medical-notes"
                  value={studentData.medicalNotes}
                  onChange={(e) => setStudentData({...studentData, medicalNotes: e.target.value})}
                  placeholder="Medical Notes"
                />
                <input
                  data-testid="parent-name"
                  value={studentData.parentName}
                  onChange={(e) => setStudentData({...studentData, parentName: e.target.value})}
                  placeholder="Parent/Guardian Name"
                  required
                />
                <input
                  data-testid="parent-email"
                  type="email"
                  value={studentData.parentEmail}
                  onChange={(e) => setStudentData({...studentData, parentEmail: e.target.value})}
                  placeholder="Parent Email"
                  required
                />
                <input
                  data-testid="parent-phone"
                  type="tel"
                  value={studentData.parentPhone}
                  onChange={(e) => setStudentData({...studentData, parentPhone: e.target.value})}
                  placeholder="Parent Phone"
                  required
                />
              </form>
              <button onClick={handleBack} data-testid="back-button">
                Back to Cart
              </button>
              <button 
                onClick={handleNext} 
                data-testid="continue-to-payment"
                disabled={!studentData.name || !studentData.parentEmail}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div data-testid="payment-step">
              <h2>Payment Information</h2>
              <div data-testid="order-summary">
                <h3>Order Summary</h3>
                <p>Student: {studentData.name}</p>
                <p>Total: ${total}</p>
              </div>
              <div data-testid="payment-form">
                <div data-testid="payment-element">Payment Element</div>
                <button data-testid="pay-button">Pay ${total}</button>
              </div>
              <button onClick={handleBack} data-testid="back-to-student-info">
                Back to Student Info
              </button>
            </div>
          )}
        </div>
      );
    };

    it('should navigate through checkout steps correctly', async () => {
      const user = userEvent.setup();
      
      // Add item to cart first
      const { addItem } = useEnhancedCartStore.getState();
      addItem(mockCartItem as any);

      render(<MultiStepCheckout />);

      // Step 1: Review Cart
      expect(screen.getByText('Step 1 of 3: Review Cart')).toBeDefined();
      expect(screen.getByTestId('cart-review')).toBeDefined();
      expect(screen.getByText('Interactive Robotics Camp')).toBeDefined();
      expect(screen.getByText('Total: $180')).toBeDefined();

      await user.click(screen.getByTestId('next-button'));

      // Step 2: Student Info
      expect(screen.getByText('Step 2 of 3: Student Info')).toBeDefined();
      expect(screen.getByTestId('student-info-step')).toBeDefined();

      // Fill student information
      await user.type(screen.getByTestId('student-name'), 'Alex Johnson');
      await user.type(screen.getByTestId('student-age'), '10');
      await user.type(screen.getByTestId('student-allergies'), 'Shellfish');
      await user.type(screen.getByTestId('parent-email'), 'sarah.johnson@email.com');

      expect(screen.getByTestId('continue-to-payment')).not.toBeDisabled();
      await user.click(screen.getByTestId('continue-to-payment'));

      // Step 3: Payment
      expect(screen.getByText('Step 3 of 3: Payment')).toBeDefined();
      expect(screen.getByTestId('payment-step')).toBeDefined();
      expect(screen.getByText('Student: Alex Johnson')).toBeDefined();
    });

    it('should validate required fields in student info step', async () => {
      const user = userEvent.setup();
      
      const { addItem } = useEnhancedCartStore.getState();
      addItem(mockCartItem as any);

      render(<MultiStepCheckout />);

      // Navigate to student info
      await user.click(screen.getByTestId('next-button'));

      // Try to continue without required fields
      const continueButton = screen.getByTestId('continue-to-payment');
      expect(continueButton).toBeDisabled();

      // Fill only name
      await user.type(screen.getByTestId('student-name'), 'Alex Johnson');
      expect(continueButton).toBeDisabled();

      // Fill email too
      await user.type(screen.getByTestId('parent-email'), 'sarah.johnson@email.com');
      expect(continueButton).not.toBeDisabled();
    });

    it('should allow navigation back through steps', async () => {
      const user = userEvent.setup();
      
      const { addItem } = useEnhancedCartStore.getState();
      addItem(mockCartItem as any);

      render(<MultiStepCheckout />);

      // Navigate to payment step
      await user.click(screen.getByTestId('next-button'));
      await user.type(screen.getByTestId('student-name'), 'Alex Johnson');
      await user.type(screen.getByTestId('parent-email'), 'test@email.com');
      await user.click(screen.getByTestId('continue-to-payment'));

      expect(screen.getByText('Step 3 of 3: Payment')).toBeDefined();

      // Go back to student info
      await user.click(screen.getByTestId('back-to-student-info'));
      expect(screen.getByText('Step 2 of 3: Student Info')).toBeDefined();

      // Go back to cart
      await user.click(screen.getByTestId('back-button'));
      expect(screen.getByText('Step 1 of 3: Review Cart')).toBeDefined();
    });
  });

  describe('Payment Form Integration', () => {
    const MockPaymentForm = () => {
      const [clientSecret, setClientSecret] = React.useState('');
      const [isProcessing, setIsProcessing] = React.useState(false);
      const [paymentStatus, setPaymentStatus] = React.useState('');

      const handleCreatePaymentIntent = async () => {
        setIsProcessing(true);
        
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            paymentIntent: {
              id: 'pi_test_123',
              client_secret: 'pi_test_123_secret',
              status: 'requires_payment_method'
            },
            orderId: 'order_test_123'
          })
        });

        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [mockCartItem],
            studentInfo: mockStudentInfo
          })
        });

        const data = await response.json();
        setClientSecret(data.paymentIntent.client_secret);
        setIsProcessing(false);
      };

      const handlePayment = async () => {
        setIsProcessing(true);

        mockStripe.confirmPayment.mockResolvedValue({
          paymentIntent: {
            id: 'pi_test_123',
            status: 'succeeded'
          }
        });

        const result = await mockStripe.confirmPayment({
          elements: mockElements,
          confirmParams: {
            return_url: 'http://localhost:3000/checkout/success'
          }
        });

        if (result.paymentIntent?.status === 'succeeded') {
          setPaymentStatus('succeeded');
        }

        setIsProcessing(false);
      };

      return (
        <div>
          <div data-testid="payment-form">
            <div data-testid="payment-element">Mock Payment Element</div>
            {!clientSecret && (
              <button 
                onClick={handleCreatePaymentIntent}
                data-testid="create-payment-intent"
                disabled={isProcessing}
              >
                Create Payment Intent
              </button>
            )}
            {clientSecret && (
              <button 
                onClick={handlePayment}
                data-testid="confirm-payment"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Pay $180'}
              </button>
            )}
            {paymentStatus && (
              <div data-testid="payment-status">
                Payment {paymentStatus}
              </div>
            )}
          </div>
        </div>
      );
    };

    it('should create payment intent and process payment', async () => {
      const user = userEvent.setup();

      render(<MockPaymentForm />);

      // Create payment intent
      await user.click(screen.getByTestId('create-payment-intent'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-payment')).toBeDefined();
      });

      // Process payment
      await user.click(screen.getByTestId('confirm-payment'));

      await waitFor(() => {
        expect(screen.getByText('Payment succeeded')).toBeDefined();
      });

      expect(mockStripe.confirmPayment).toHaveBeenCalledWith({
        elements: mockElements,
        confirmParams: {
          return_url: 'http://localhost:3000/checkout/success'
        }
      });
    });

    it('should handle payment processing state correctly', async () => {
      const user = userEvent.setup();

      render(<MockPaymentForm />);

      // Initial state
      expect(screen.getByTestId('create-payment-intent')).not.toBeDisabled();

      // During payment intent creation
      const createButton = screen.getByTestId('create-payment-intent');
      await user.click(createButton);

      // Button should be disabled during processing
      expect(createButton).toBeDisabled();
    });
  });

  describe('Payment Status Monitoring', () => {
    const PaymentStatusChecker = ({ paymentIntentId }: { paymentIntentId: string }) => {
      const [status, setStatus] = React.useState('checking');
      const [orderData, setOrderData] = React.useState(null);
      const [attempts, setAttempts] = React.useState(0);

      React.useEffect(() => {
        const checkPaymentStatus = async () => {
          setAttempts(prev => prev + 1);

          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              paymentStatus: 'succeeded',
              orderStatus: 'PAID',
              eventsCreated: 1,
              allEventsCreated: true,
              order: {
                id: 'order_test_123',
                customerName: 'Sarah Johnson',
                totalAmount: 18000,
                orderItems: [{
                  product: { name: 'Interactive Robotics Camp' },
                  student: { name: 'Alex Johnson' },
                  bookingDate: '2024-12-22T09:00:00Z'
                }]
              }
            })
          });

          const response = await fetch(`/api/stripe/payment-status?payment_intent_id=${paymentIntentId}`);
          const data = await response.json();

          if (data.paymentStatus === 'succeeded' && data.allEventsCreated) {
            setStatus('completed');
            setOrderData(data.order);
          } else if (attempts < 5) {
            setTimeout(checkPaymentStatus, 2000);
          } else {
            setStatus('timeout');
          }
        };

        checkPaymentStatus();
      }, [paymentIntentId, attempts]);

      return (
        <div>
          <div data-testid="payment-status">{status}</div>
          <div data-testid="attempts-count">Attempts: {attempts}</div>
          {orderData && (
            <div data-testid="order-confirmation">
              <h3>Payment Successful!</h3>
              <p>Order ID: {orderData.id}</p>
              <p>Customer: {orderData.customerName}</p>
            </div>
          )}
        </div>
      );
    };

    it('should poll payment status until completion', async () => {
      render(<PaymentStatusChecker paymentIntentId="pi_test_123" />);

      // Initial status
      expect(screen.getByText('checking')).toBeDefined();

      // Wait for status to update
      await waitFor(() => {
        expect(screen.getByText('completed')).toBeDefined();
      }, { timeout: 3000 });

      // Verify order confirmation appears
      expect(screen.getByTestId('order-confirmation')).toBeDefined();
      expect(screen.getByText('Order ID: order_test_123')).toBeDefined();
      expect(screen.getByText('Customer: Sarah Johnson')).toBeDefined();
    });

    it('should handle payment status polling attempts', async () => {
      render(<PaymentStatusChecker paymentIntentId="pi_test_123" />);

      await waitFor(() => {
        expect(screen.getByText('Attempts: 1')).toBeDefined();
      });
    });
  });

  describe('Error Handling in Components', () => {
    const ErrorHandlingPaymentForm = () => {
      const [error, setError] = React.useState('');
      const [isProcessing, setIsProcessing] = React.useState(false);

      const handlePaymentWithError = async (errorType: string) => {
        setIsProcessing(true);
        setError('');

        if (errorType === 'card_declined') {
          mockStripe.confirmPayment.mockResolvedValue({
            error: {
              type: 'card_error',
              code: 'card_declined',
              message: 'Your card was declined.'
            }
          });
        } else if (errorType === 'network_error') {
          mockStripe.confirmPayment.mockRejectedValue(
            new Error('Network request failed')
          );
        }

        try {
          const result = await mockStripe.confirmPayment({
            elements: mockElements
          });

          if (result.error) {
            setError(result.error.message);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Payment failed');
        }

        setIsProcessing(false);
      };

      return (
        <div>
          <button 
            onClick={() => handlePaymentWithError('card_declined')}
            data-testid="decline-payment"
          >
            Test Card Declined
          </button>
          <button 
            onClick={() => handlePaymentWithError('network_error')}
            data-testid="network-error"
          >
            Test Network Error
          </button>
          {error && (
            <div data-testid="error-message" className="error">
              {error}
            </div>
          )}
          {isProcessing && (
            <div data-testid="processing-indicator">
              Processing payment...
            </div>
          )}
        </div>
      );
    };

    it('should display card declined error message', async () => {
      const user = userEvent.setup();

      render(<ErrorHandlingPaymentForm />);

      await user.click(screen.getByTestId('decline-payment'));

      await waitFor(() => {
        expect(screen.getByText('Your card was declined.')).toBeDefined();
      });
    });

    it('should display network error message', async () => {
      const user = userEvent.setup();

      render(<ErrorHandlingPaymentForm />);

      await user.click(screen.getByTestId('network-error'));

      await waitFor(() => {
        expect(screen.getByText('Network request failed')).toBeDefined();
      });
    });

    it('should show processing indicator during payment', async () => {
      const user = userEvent.setup();

      render(<ErrorHandlingPaymentForm />);

      const declineButton = screen.getByTestId('decline-payment');
      await user.click(declineButton);

      // Processing indicator should appear briefly
      expect(screen.getByText('Processing payment...')).toBeDefined();
    });
  });

  describe('Cart Integration', () => {
    const CartIntegratedCheckout = () => {
      const { items, removeItem, updateQuantity, total, clearCart } = useEnhancedCartStore();
      const [orderCreated, setOrderCreated] = React.useState(false);

      const handleRemoveItem = (itemId: string) => {
        removeItem(itemId);
      };

      const handleCheckout = async () => {
        // Mock successful payment
        setOrderCreated(true);
        clearCart();
      };

      return (
        <div>
          <div data-testid="cart-items">
            {items.length === 0 && (
              <div data-testid="empty-cart">Your cart is empty</div>
            )}
            {items.map(item => (
              <div key={item.id} data-testid={`item-${item.id}`}>
                <h3>{item.name}</h3>
                <p>Price: ${item.price}</p>
                <button 
                  onClick={() => handleRemoveItem(item.id)}
                  data-testid={`remove-${item.id}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div data-testid="cart-total">Total: ${total}</div>
          {items.length > 0 && (
            <button 
              onClick={handleCheckout}
              data-testid="checkout-button"
            >
              Checkout
            </button>
          )}
          {orderCreated && (
            <div data-testid="success-message">
              Order created successfully! Cart cleared.
            </div>
          )}
        </div>
      );
    };

    it('should manage cart items during checkout process', async () => {
      const user = userEvent.setup();
      
      // Add items to cart
      const { addItem } = useEnhancedCartStore.getState();
      addItem(mockCartItem as any);
      addItem({
        ...mockCartItem,
        id: 'product_checkout_456',
        name: 'Art & Craft Workshop',
        price: 120
      } as any);

      render(<CartIntegratedCheckout />);

      // Verify items are displayed
      expect(screen.getByText('Interactive Robotics Camp')).toBeDefined();
      expect(screen.getByText('Art & Craft Workshop')).toBeDefined();
      expect(screen.getByText('Total: $300')).toBeDefined();

      // Remove one item
      await user.click(screen.getByTestId('remove-product_checkout_456'));
      expect(screen.queryByText('Art & Craft Workshop')).toBeNull();
      expect(screen.getByText('Total: $180')).toBeDefined();

      // Complete checkout
      await user.click(screen.getByTestId('checkout-button'));

      // Verify cart is cleared and success message shown
      expect(screen.getByText('Your cart is empty')).toBeDefined();
      expect(screen.getByText('Order created successfully! Cart cleared.')).toBeDefined();
    });

    it('should handle empty cart state', () => {
      render(<CartIntegratedCheckout />);

      expect(screen.getByText('Your cart is empty')).toBeDefined();
      expect(screen.queryByTestId('checkout-button')).toBeNull();
    });
  });
});

'use client';

import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const CustomerInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

type CustomerInfo = z.infer<typeof CustomerInfoSchema>;

interface CheckoutFormProps {
  onBack?: () => void
  onClientSecretReady?: (clientSecret: string) => void
}

export default function CheckoutForm({ onBack, onClientSecretReady }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { items, getSummary, clearCartAfterSuccess } = useEnhancedCartStore();
  const router = useRouter();

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    orderId: string;
    paymentIntentId: string;
  } | null>(null);

  const summary = getSummary();

  useEffect(() => {
    if (!paymentIntent && stripe) {
      createPaymentIntent();
    }
  }, [stripe]);

  const validateCustomerInfo = () => {
    try {
      CustomerInfoSchema.parse(customerInfo);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      }
      return false;
    }
  };

  const createPaymentIntent = async () => {
    if (!validateCustomerInfo()) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            productId: item.product.id,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            students: item.students,
            selectedDate: item.selectedDate?.toISOString(),
            selectedTimeSlot: item.selectedTimeSlot,
            notes: item.notes,
          })),
          customerInfo: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: 'Address will be collected',
              city: 'Sydney',
              state: 'NSW',
              postal_code: '2000',
              country: 'AU',
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setPaymentIntent(data);
      if (onClientSecretReady && data.clientSecret) {
        onClientSecretReady(data.clientSecret);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!paymentIntent) {
      setError('Payment information is being prepared. Please wait a moment and try again.');
      return;
    }

    if (!validateCustomerInfo()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError, paymentIntent: confirmedPaymentIntent } = 
        await stripe.confirmPayment({
          elements,
          clientSecret: paymentIntent.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/success?payment_intent=${paymentIntent.paymentIntentId}&order_id=${paymentIntent.orderId}`,
          },
          redirect: 'if_required',
        });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (confirmedPaymentIntent?.status === 'succeeded') {
        // Confirm payment on server
        await fetch('/api/stripe/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.paymentIntentId,
            orderId: paymentIntent.orderId,
          }),
        });

        // Redirect to processing page (cart will be cleared there)
        router.push(`/checkout/processing?payment_intent=${paymentIntent.paymentIntentId}&order_id=${paymentIntent.orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Payment Element */}
      {paymentIntent && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total:</span>
          <span>${summary.total.toFixed(2)} AUD</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-4 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className={`${onBack ? 'flex-1' : 'w-full'} py-3 px-4 rounded-md font-medium transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isLoading 
            ? (paymentIntent ? 'Processing Payment...' : 'Creating Order...') 
            : paymentIntent 
              ? `Pay $${summary.total.toFixed(2)} AUD`
              : 'Continue to Payment'
          }
        </button>
      </div>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </form>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface PaymentStatusCheckerProps {
  paymentIntentId: string;
  orderId: string;
  onStatusUpdate?: (status: string) => void;
}

interface PaymentStatus {
  paymentStatus: string;
  orderStatus: string;
  eventsCreated: number;
  totalBookings: number;
  allEventsCreated: boolean;
}

export function PaymentStatusChecker({ 
  paymentIntentId, 
  orderId, 
  onStatusUpdate 
}: PaymentStatusCheckerProps) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  const maxRetries = 10;
  const retryInterval = 2000; // 2 seconds

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/stripe/payment-status?payment_intent_id=${paymentIntentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check payment status');
        }

        const data = await response.json();
        setStatus(data);
        
        if (onStatusUpdate) {
          onStatusUpdate(data.paymentStatus);
        }

        // If payment succeeded and all events are created, we're done
        if (data.paymentStatus === 'succeeded' && data.allEventsCreated) {
          setLoading(false);
          if (intervalId) clearInterval(intervalId);
          
          // Redirect to success page after a short delay
          setTimeout(() => {
            router.push(`/checkout/success?payment_intent=${paymentIntentId}&order_id=${orderId}`);
          }, 1000);
          return;
        }

        // If payment failed, stop retrying
        if (data.paymentStatus === 'payment_failed' || data.paymentStatus === 'canceled') {
          setLoading(false);
          setError('Payment was not successful');
          if (intervalId) clearInterval(intervalId);
          return;
        }

        // Continue polling if still processing
        setRetryCount(prev => prev + 1);
        
        if (retryCount >= maxRetries) {
          setLoading(false);
          setError('Timeout waiting for payment confirmation');
          if (intervalId) clearInterval(intervalId);
        }

      } catch (err) {
        console.error('Error checking payment status:', err);
        setRetryCount(prev => prev + 1);
        
        if (retryCount >= maxRetries) {
          setLoading(false);
          setError('Unable to verify payment status');
          if (intervalId) clearInterval(intervalId);
        }
      }
    };

    // Initial check
    checkStatus();

    // Set up polling
    intervalId = setInterval(checkStatus, retryInterval);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentIntentId, orderId, retryCount, onStatusUpdate, router]);

  if (error) {
    return (
      <div className="text-center p-8">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Verification Failed</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/checkout')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirming Your Payment</h2>
        <p className="text-gray-600 mb-4">
          We're processing your payment and setting up your bookings...
        </p>
        
        {status && (
          <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Payment Status:</span>
              <span className={`font-medium ${
                status.paymentStatus === 'succeeded' ? 'text-green-600' : 
                status.paymentStatus === 'processing' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {status.paymentStatus}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Calendar Events:</span>
              <span className="font-medium text-blue-600">
                {status.eventsCreated}/{status.totalBookings}
              </span>
            </div>
            
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (status.eventsCreated / status.totalBookings) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-4">
          This usually takes just a few seconds...
        </p>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Confirmed!</h2>
      <p className="text-gray-600">Redirecting to confirmation page...</p>
    </div>
  );
}

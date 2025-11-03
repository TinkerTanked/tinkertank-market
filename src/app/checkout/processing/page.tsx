'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PaymentStatusChecker } from '@/components/checkout/PaymentStatusChecker';

function ProcessingContent() {
  const searchParams = useSearchParams();
  
  const paymentIntentId = searchParams.get('payment_intent');
  const orderId = searchParams.get('order_id');

  if (!paymentIntentId || !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Missing Payment Information</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find the payment details. Please try again or contact support.
          </p>
          <button
            onClick={() => window.location.href = '/catalog'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Return to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-lg mx-auto">
        <PaymentStatusChecker 
          paymentIntentId={paymentIntentId}
          orderId={orderId}
        />
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}

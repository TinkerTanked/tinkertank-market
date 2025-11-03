'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface BookingIssueFormProps {
  orderId?: string;
  customerEmail?: string;
  onSubmitted?: () => void;
}

export function BookingIssueForm({ orderId = '', customerEmail = '', onSubmitted }: BookingIssueFormProps) {
  const [formData, setFormData] = useState({
    orderId,
    customerEmail,
    issueType: '',
    description: '',
    contactMethod: 'email'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const issueTypes = [
    { value: 'calendar_not_created', label: 'Calendar events not created' },
    { value: 'wrong_date', label: 'Wrong booking date' },
    { value: 'cancellation_request', label: 'Cancellation request' },
    { value: 'other', label: 'Other issue' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/support/booking-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit issue');
      }

      setTicketId(data.ticketId);
      setSubmitted(true);
      
      if (onSubmitted) {
        onSubmitted();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Support Ticket Created
        </h3>
        <p className="text-green-800 mb-4">
          Your issue has been submitted successfully.
        </p>
        {ticketId && (
          <p className="text-sm text-green-700 bg-green-100 rounded px-3 py-2 inline-block">
            Ticket ID: {ticketId}
          </p>
        )}
        <p className="text-sm text-green-600 mt-4">
          We'll respond to your email within 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
          Report Booking Issue
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Having trouble with your booking? Let us know and we'll help resolve it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order ID *
          </label>
          <input
            type="text"
            value={formData.orderId}
            onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your order ID"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Found in your confirmation email or receipt
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issue Type *
          </label>
          <select
            value={formData.issueType}
            onChange={(e) => setFormData(prev => ({ ...prev, issueType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select an issue type</option>
            {issueTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Please describe your issue in detail..."
            required
            minLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Contact Method
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="email"
                checked={formData.contactMethod === 'email'}
                onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value as 'email' | 'phone' }))}
                className="mr-2"
              />
              Email
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="phone"
                checked={formData.contactMethod === 'phone'}
                onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value as 'email' | 'phone' }))}
                className="mr-2"
              />
              Phone
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Issue Report'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          For urgent issues, call us directly at (02) 9999-9999
        </p>
      </form>
    </div>
  );
}

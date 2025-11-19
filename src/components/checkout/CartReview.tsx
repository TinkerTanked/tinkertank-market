'use client';

import React from 'react';
import { CalendarDaysIcon, ClockIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { format } from 'date-fns';
import Image from 'next/image';

export default function CartReview() {
  const { items, getSummary, removeItem, updateQuantity } = useEnhancedCartStore();
  const summary = getSummary();

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Date TBD';
    return format(date, 'EEE, MMM dd, yyyy');
  };

  const formatTimeSlot = (timeSlot: { startTime: string; endTime: string } | undefined) => {
    if (!timeSlot) return 'Time TBD';
    return `${timeSlot.startTime} - ${timeSlot.endTime}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Order Review</h2>
          <p className="text-blue-100">{summary.itemCount} items, {summary.studentCount} students</p>
        </div>

        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="p-6">
              <div className="flex items-start space-x-4">
                {/* Product Image Placeholder */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 text-xs font-medium">
                    {item.product.category || 'Product'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.product.description}
                      </p>
                      
                      {/* Date and Time */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                        {item.selectedDate && (
                          <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span>{formatDate(item.selectedDate)}</span>
                          </div>
                        )}
                        {item.selectedTimeSlot && (
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              {typeof item.selectedTimeSlot === 'string' 
                                ? item.selectedTimeSlot 
                                : item.selectedTimeSlot?.start && item.selectedTimeSlot?.end
                                  ? formatTimeSlot({ startTime: item.selectedTimeSlot.start, endTime: item.selectedTimeSlot.end })
                                  : 'Time TBD'
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-lg font-semibold text-gray-900">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${item.pricePerItem.toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700">Quantity:</span>
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-gray-900 font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Remove
                    </button>
                  </div>

                  {/* Students */}
                  {item.students.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        Students ({item.students.length})
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {item.students.map((student, index) => (
                          <div key={student.id || index} className="text-sm">
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-gray-600">
                              Age {student.age} • {student.parentName}
                            </div>
                            {student.allergies && student.allergies.length > 0 && (
                              <div className="text-red-600 text-xs">
                                Allergies: {student.allergies.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Student Button */}
                  {item.students.length < item.quantity && (
                    <div className="mt-3">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        + Add student details ({item.quantity - item.students.length} remaining)
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Note:</span> {item.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Total</span>
              <span>${summary.total.toFixed(2)} AUD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

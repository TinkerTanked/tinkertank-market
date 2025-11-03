'use client'

import { useState, useEffect } from 'react'
import { useCalendar, useCalendarDateRange, useCalendarFilters } from '@/hooks/useCalendar'
import BookingCalendar from '@/components/calendar/BookingCalendar'
import { CalendarEvent } from '@/types/booking'
import { Product, ProductType } from '@/types/product'

export default function CalendarPage() {
  const [selectedProductType, setSelectedProductType] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])

  const { getDateRange } = useCalendarDateRange()
  const { start, end } = getDateRange()
  
  const { events, loading, error } = useCalendar(start, end, {
    view: 'customer',
    productType: selectedProductType,
  })

  // Mock products for demo
  useEffect(() => {
    setAvailableProducts([
      {
        id: '1',
        name: 'Holiday Camps',
        type: ProductType.CAMP,
        description: 'Full day holiday programs',
        pricing: {
          basePrice: 85.00,
          discountedPrice: 75.00
        },
        capacity: 20,
        duration: 8, // 8 hours
        minAge: 5,
        maxAge: 12,
        features: ['STEM activities', 'Lunch included'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product,
      {
        id: '2',
        name: 'Birthday Parties',
        type: ProductType.BIRTHDAY,
        description: 'Private birthday party experiences',
        pricing: {
          basePrice: 350.00,
          discountedPrice: 320.00
        },
        capacity: 12,
        duration: 2, // 2 hours
        minAge: 4,
        maxAge: 14,
        features: ['Private session', 'Party decorations'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product,
      {
        id: '3',
        name: 'Ignite Sessions',
        type: ProductType.SUBSCRIPTION,
        description: 'Weekly engineering workshops',
        pricing: {
          basePrice: 45.00,
          discountedPrice: 40.00
        },
        capacity: 8,
        duration: 1.5, // 1.5 hours
        minAge: 8,
        maxAge: 16,
        features: ['Weekly workshops', 'Engineering projects'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product
    ])
  }, [])

  const handleDateSelect = (date: Date, timeSlot?: string) => {
    setSelectedDate(date)
    setShowTimeSlots(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event)
    // Handle event click - could open booking form or details
  }

  const productTypeOptions = [
    { value: '', label: 'All Programs' },
    { value: 'CAMP', label: 'Holiday Camps' },
    { value: 'BIRTHDAY', label: 'Birthday Parties' },
    { value: 'IGNITE', label: 'Ignite Sessions' },
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error Loading Calendar</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Book Your Program</h1>
            <p className="mt-2 text-gray-600">
              Select a date and time for your TinkerTank experience
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Program Filter */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Program Type</h3>
              <div className="space-y-3">
                {productTypeOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="productType"
                      value={option.value}
                      checked={selectedProductType === option.value}
                      onChange={(e) => setSelectedProductType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Program Info */}
            {selectedProductType && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Program Details</h3>
                {availableProducts
                  .filter(p => !selectedProductType || p.type === selectedProductType)
                  .map((product) => (
                    <div key={product.id} className="mb-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{product.description}</div>
                      <div className="text-sm font-medium text-green-600 mt-1">
                        ${product.pricing.basePrice}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Ages {product.minAge}-{product.maxAge} • Max {product.capacity} students
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How to Book</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>1. Select a program type</p>
                <p>2. Choose an available date</p>
                <p>3. Pick your preferred time</p>
                <p>4. Complete your booking</p>
              </div>
            </div>
          </div>

          {/* Main Calendar */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading calendar...</p>
              </div>
            ) : (
              <BookingCalendar
                products={availableProducts}
                availableEvents={events as CalendarEvent[]}
                selectedProductType={selectedProductType}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                className="mb-6"
              />
            )}

            {/* Time Slot Modal/Panel */}
            {showTimeSlots && selectedDate && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Times - {selectedDate.toLocaleDateString()}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM'].map((time) => (
                    <button
                      key={time}
                      className="p-3 text-center border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="text-sm font-medium">{time}</div>
                      <div className="text-xs text-gray-600">Available</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowTimeSlots(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

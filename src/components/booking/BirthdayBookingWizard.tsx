'use client'

import { useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import LocationStep from './LocationStep'
import BirthdayDateStep from './BirthdayDateStep'
import BirthdayTimeStep from './BirthdayTimeStep'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import type { Product, TimeSlot } from '@/types/products'

function parseTimeSlot(timeString: string): TimeSlot {
  const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (match) {
    let startHour = parseInt(match[1])
    const startMinute = match[2]
    const startPeriod = match[3].toUpperCase()
    let endHour = parseInt(match[4])
    const endMinute = match[5]
    const endPeriod = match[6].toUpperCase()
    
    if (startPeriod === 'PM' && startHour !== 12) startHour += 12
    if (startPeriod === 'AM' && startHour === 12) startHour = 0
    if (endPeriod === 'PM' && endHour !== 12) endHour += 12
    if (endPeriod === 'AM' && endHour === 12) endHour = 0
    
    return {
      start: `${startHour.toString().padStart(2, '0')}:${startMinute}`,
      end: `${endHour.toString().padStart(2, '0')}:${endMinute}`
    }
  }
  return { start: '10:00', end: '12:00' }
}

interface BookingData {
  location: {
    id: string
    name: string
    address: string
  } | null
  date: Date | null
  timeSlot: string | null
}

interface BirthdayBookingWizardProps {
  product: Product
  onClose: () => void
  isOpen: boolean
}

const STEPS = [
  { id: 1, name: 'Location', component: 'location' },
  { id: 2, name: 'Date', component: 'date' },
  { id: 3, name: 'Time', component: 'time' },
  { id: 4, name: 'Confirm', component: 'confirmation' }
]

export default function BirthdayBookingWizard({ product, onClose, isOpen }: BirthdayBookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState<BookingData>({
    location: null,
    date: null,
    timeSlot: null
  })
  const { addItem } = useEnhancedCartStore()

  if (!isOpen) return null

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.location !== null
      case 2:
        return bookingData.date !== null
      case 3:
        return bookingData.timeSlot !== null
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length && canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleAddToCart = () => {
    if (bookingData.location && bookingData.date && bookingData.timeSlot) {
      const cartItem = {
        id: product.id,
        name: product.name,
        shortDescription: product.shortDescription || `${product.name} birthday party`,
        price: product.price,
        category: 'birthdays' as const,
        type: 'BIRTHDAY' as const,
        ageRange: product.ageRange || '5-16 years',
        features: product.features || [],
        images: product.images || ['/images/birthdays.jpeg'],
        date: bookingData.date,
        location: bookingData.location.name,
        duration: product.duration || '2 hours',
        time: bookingData.timeSlot,
        description: `${product.name} at ${bookingData.location.name}`,
        image: product.images?.[0] || '/images/birthdays.jpeg',
        isActive: true,
        availableCapacity: product.maxCapacity || 12,
        maxCapacity: product.maxCapacity || 12,
        pricing: { basePrice: product.price }
      } as any

      const timeSlotObj = parseTimeSlot(bookingData.timeSlot)
      addItem(cartItem, { 
        selectedDate: bookingData.date,
        selectedTimeSlot: timeSlotObj
      })
      onClose()
    }
  }

  const updateBookingData = (key: keyof BookingData, value: any) => {
    setBookingData(prev => ({ ...prev, [key]: value }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <LocationStep 
            selectedLocation={bookingData.location}
            onLocationSelect={(location) => updateBookingData('location', location)}
          />
        )
      case 2:
        return (
          <BirthdayDateStep 
            selectedDate={bookingData.date}
            onDateSelect={(date) => updateBookingData('date', date)}
            location={bookingData.location}
          />
        )
      case 3:
        return (
          <BirthdayTimeStep 
            selectedTimeSlot={bookingData.timeSlot}
            onTimeSlotSelect={(timeSlot) => updateBookingData('timeSlot', timeSlot)}
            selectedDate={bookingData.date}
          />
        )
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Confirm Your Party Booking</h3>
              <p className="text-gray-600">Review your party details before adding to cart</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{product.name}</h4>
                  <p className="text-gray-600">{product.ageRange}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-200">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{bookingData.location?.name}</p>
                  <p className="text-sm text-gray-600">{bookingData.location?.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {bookingData.date && format(bookingData.date, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">{bookingData.timeSlot}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{product.duration || '2 hours'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Guests</p>
                    <p className="font-medium text-gray-900">{product.maxCapacity || 12} kids</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Price</p>
                    <p className="text-2xl font-bold text-purple-600">{formatPrice(product.price)}</p>
                  </div>
                </div>
              </div>
            </div>

            {product.features && product.features.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h5 className="font-semibold text-gray-900 mb-3">What&apos;s Included</h5>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        />
        
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Book Your Birthday Party</h2>
              <button 
                onClick={onClose}
                className="text-white hover:text-purple-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id 
                        ? 'bg-white text-purple-600' 
                        : 'bg-purple-400 text-white'
                    }`}>
                      {currentStep > step.id ? '✓' : step.id}
                    </div>
                    <span className={`ml-2 text-sm ${
                      currentStep >= step.id ? 'text-white' : 'text-purple-200'
                    }`}>
                      {step.name}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-white' : 'bg-purple-400'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
            {renderStep()}
          </div>

          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep} of {STEPS.length}
            </div>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                  canProceed()
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
              >
                Add to Cart
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

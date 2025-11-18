'use client'

import { useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import LocationStep from './LocationStep'
import DateStep from './DateStep'
import CampTypeStep from './CampTypeStep'
import ConfirmationStep from './ConfirmationStep'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

interface BookingData {
  location: {
    id: string
    name: string
    address: string
  } | null
  date: Date | null
  dates: Date[]
  campType: {
    id: string
    type: 'day' | 'allday'
    name: string
    price: number
    duration: string
    time: string
  } | null
}

interface CampBookingWizardProps {
  onClose: () => void
  isOpen: boolean
}

const STEPS = [
  { id: 1, name: 'Location', component: 'location' },
  { id: 2, name: 'Date', component: 'date' },
  { id: 3, name: 'Camp Type', component: 'camp-type' },
  { id: 4, name: 'Confirm', component: 'confirmation' }
]

export default function CampBookingWizard({ onClose, isOpen }: CampBookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState<BookingData>({
    location: null,
    date: null,
    dates: [],
    campType: null
  })
  const { addItem } = useEnhancedCartStore()

  if (!isOpen) return null

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.location !== null
      case 2:
        return bookingData.dates.length > 0
      case 3:
        return bookingData.campType !== null
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

  const handleAddToCart = () => {
    if (bookingData.location && bookingData.dates.length > 0 && bookingData.campType) {
      const firstDate = bookingData.dates[0]
      const cartItem = {
        id: `camp-${bookingData.campType.type}-${firstDate.toISOString().split('T')[0]}`,
        name: `${bookingData.campType.name} - ${bookingData.location.name}`,
        shortDescription: `${bookingData.campType.name} camp`,
        price: bookingData.campType.price,
        category: 'camps' as const,
        type: 'CAMP' as const,
        ageRange: '5-12',
        features: ['Educational activities', 'Supervised learning'],
        images: ['/images/camps2.jpeg'],
        date: firstDate,
        location: bookingData.location.name,
        duration: bookingData.campType.duration,
        time: bookingData.campType.time,
        description: `${bookingData.campType.name} at ${bookingData.location.name}`,
        image: '/images/camps2.jpeg',
        isActive: true,
        availableCapacity: 20
      } as any

      addItem(cartItem, { 
        selectedDate: firstDate,
        selectedDates: bookingData.dates 
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
          <DateStep 
            selectedDate={bookingData.date}
            selectedDates={bookingData.dates}
            onDateSelect={(date) => updateBookingData('date', date)}
            onDatesSelect={(dates) => updateBookingData('dates', dates)}
            location={bookingData.location}
            enableMultiSelect={true}
          />
        )
      case 3:
        return (
          <CampTypeStep 
            selectedCampType={bookingData.campType}
            onCampTypeSelect={(campType) => updateBookingData('campType', campType)}
            date={bookingData.date}
            location={bookingData.location}
          />
        )
      case 4:
        return (
          <ConfirmationStep 
            bookingData={bookingData}
            onAddToCart={handleAddToCart}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Book Your STEM Camp</h2>
              <button 
                onClick={onClose}
                className="text-white hover:text-primary-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress Indicator */}
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id 
                        ? 'bg-white text-primary-600' 
                        : 'bg-primary-400 text-white'
                    }`}>
                      {currentStep > step.id ? '✓' : step.id}
                    </div>
                    <span className={`ml-2 text-sm ${
                      currentStep >= step.id ? 'text-white' : 'text-primary-200'
                    }`}>
                      {step.name}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-white' : 'bg-primary-400'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
            {renderStep()}
          </div>

          {/* Footer */}
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
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
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

'use client'

import { useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import IgniteWeekCalendarStep, { IgniteSession } from './IgniteWeekCalendarStep'
import IgniteStudentStep, { StudentInfo } from './IgniteStudentStep'
import IgniteConfirmStep, { IgniteSession as ConfirmIgniteSession } from './IgniteConfirmStep'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

interface IgniteBookingData {
  session: IgniteSession | null
  studentInfo: StudentInfo
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
}

function convertSessionForConfirm(session: IgniteSession): ConfirmIgniteSession {
  return {
    id: session.id,
    name: session.name,
    programType: session.programType,
    location: session.location,
    address: session.address,
    weekDays: session.dayOfWeek.map(day => DAY_NAME_TO_NUMBER[day.toLowerCase()] || 1),
    startTime: session.startTime,
    endTime: session.endTime,
    pricePerWeek: session.priceWeekly
  }
}

interface IgniteBookingWizardProps {
  onClose: () => void
  isOpen: boolean
}

const STEPS = [
  { id: 1, name: 'Select Session', component: 'session' },
  { id: 2, name: 'Student Info', component: 'student' },
  { id: 3, name: 'Confirm', component: 'confirm' }
]

const INITIAL_STUDENT_INFO: StudentInfo = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  school: '',
  medicalInfo: '',
  emergencyContactName: '',
  emergencyContactPhone: ''
}

export default function IgniteBookingWizard({ onClose, isOpen }: IgniteBookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState<IgniteBookingData>({
    session: null,
    studentInfo: INITIAL_STUDENT_INFO
  })
  const { addItem } = useEnhancedCartStore()

  if (!isOpen) return null

  const isValidPhone = (phone: string): boolean => {
    return /^[\d\s+()-]{8,}$/.test(phone)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.session !== null
      case 2:
        return !!(
          bookingData.studentInfo.firstName.trim() &&
          bookingData.studentInfo.lastName.trim() &&
          bookingData.studentInfo.dateOfBirth &&
          bookingData.studentInfo.emergencyContactName.trim() &&
          bookingData.studentInfo.emergencyContactPhone.trim() &&
          isValidPhone(bookingData.studentInfo.emergencyContactPhone)
        )
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

  const handleSubscribe = () => {
    if (bookingData.session) {
      const session = bookingData.session
      const cartItem = {
        id: session.id,
        name: session.name,
        shortDescription: `Ignite ${session.programType} subscription`,
        price: session.priceWeekly,
        category: 'ignite' as const,
        type: 'IGNITE' as const,
        ageRange: '6-12 years',
        features: ['Weekly STEAM sessions', 'Expert instructors', 'Hands-on projects', 'Flexible subscription'],
        images: ['/images/ignite.jpeg'],
        location: session.location,
        duration: `${session.startTime} - ${session.endTime}`,
        time: session.startTime,
        description: `${session.name} at ${session.location}`,
        image: '/images/ignite.jpeg',
        isActive: true,
        availableCapacity: 20,
        maxCapacity: 20,
        pricing: { basePrice: session.priceWeekly },
        isSubscription: true,
        stripePriceId: session.stripePriceId,
        studentInfo: bookingData.studentInfo,
        sessionDetails: session
      } as any

      addItem(cartItem, {
        notes: `Student: ${bookingData.studentInfo.firstName} ${bookingData.studentInfo.lastName}`
      })
      onClose()
    }
  }

  const updateBookingData = <K extends keyof IgniteBookingData>(key: K, value: IgniteBookingData[K]) => {
    setBookingData(prev => ({ ...prev, [key]: value }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <IgniteWeekCalendarStep
            selectedSession={bookingData.session}
            onSessionSelect={(session) => updateBookingData('session', session)}
          />
        )
      case 2:
        return (
          <IgniteStudentStep
            studentInfo={bookingData.studentInfo}
            onStudentInfoChange={(info) => updateBookingData('studentInfo', info)}
          />
        )
      case 3:
        return (
          <IgniteConfirmStep
            session={convertSessionForConfirm(bookingData.session!)}
            studentInfo={bookingData.studentInfo}
            onSubscribe={handleSubscribe}
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
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Subscribe to Ignite</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-green-100 transition-colors"
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
                        ? 'bg-white text-green-600'
                        : 'bg-green-400 text-white'
                    }`}>
                      {currentStep > step.id ? '✓' : step.id}
                    </div>
                    <span className={`ml-2 text-sm ${
                      currentStep >= step.id ? 'text-white' : 'text-green-200'
                    }`}>
                      {step.name}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-white' : 'bg-green-400'
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
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-colors shadow-sm"
              >
                Subscribe
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

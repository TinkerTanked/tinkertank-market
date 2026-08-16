'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import LocationStep from './LocationStep'
import DateStep from './DateStep'
import CampTypeStep from './CampTypeStep'
import ConfirmationStep from './ConfirmationStepNew'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

interface BookingData {
  location: {
    id: string
    name: string
    address: string
    capacity: number
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

const NEXT_STEP_LABELS: Record<number, string> = {
  1: 'Choose dates',
  2: 'Choose camp type',
  3: 'Review booking'
}

export default function CampBookingWizard({ onClose, isOpen }: CampBookingWizardProps) {
  const router = useRouter()
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

  const handleContinueToCheckout = () => {
    if (bookingData.location && bookingData.dates.length > 0 && bookingData.campType) {
      const firstDate = new Date(bookingData.dates[0])
      const cartItem = {
        id: bookingData.campType.id,
        name: bookingData.campType.name,
        shortDescription: `${bookingData.campType.name} camp`,
        price: bookingData.campType.price,
        category: 'camps' as const,
        type: 'CAMP' as const,
        ageRange: '6-16 years',
        features: ['Hands-on STEAM experiments', 'Take-home project', 'Small Groups', 'Expert instructor guidance'],
        images: ['/images/camps2.jpeg'],
        date: firstDate,
        location: bookingData.location.name,
        duration: bookingData.campType.duration,
        time: bookingData.campType.time,
        description: `${bookingData.campType.name} at ${bookingData.location.name}`,
        image: '/images/camps2.jpeg',
        isActive: true,
        availableCapacity: bookingData.location.capacity,
        maxCapacity: bookingData.location.capacity,
        pricing: { basePrice: bookingData.campType.price }
      } as any

      addItem(cartItem, { 
        selectedDate: firstDate,
        selectedDates: bookingData.dates.map(d => new Date(d))
      })
      onClose()
      router.push('/checkout')
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
            selectedDateCount={bookingData.dates.length}
            selectedDates={bookingData.dates}
          />
        )
      case 4:
        return (
          <ConfirmationStep 
            location={bookingData.location!}
            dates={bookingData.dates}
            campType={bookingData.campType!}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 overflow-hidden sm:p-4 lg:p-8">
        <div className="flex min-h-full items-center justify-center">
          <Dialog.Panel className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-3xl">
            <header className="flex flex-none items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Camp booking</p>
                <Dialog.Title className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                  Find the right camp
                </Dialog.Title>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close camp booking"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </header>

            <div className="flex min-h-0 flex-1">
              <aside className="hidden w-64 flex-none border-r border-slate-200 bg-slate-50 p-6 lg:block">
                <p className="text-sm font-semibold text-slate-950">Your booking</p>
                <ol className="mt-6 space-y-1">
                  {STEPS.map(step => {
                    const isComplete = currentStep > step.id
                    const isCurrent = currentStep === step.id
                    return (
                      <li key={step.id} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${isCurrent ? 'bg-white shadow-sm ring-1 ring-slate-200' : ''}`}>
                        <span className={`grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-bold ${
                          isComplete
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                              ? 'bg-primary-700 text-white'
                              : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isComplete ? <CheckIcon className="h-4 w-4" /> : step.id}
                        </span>
                        <span className={`text-sm font-semibold ${isCurrent ? 'text-slate-950' : 'text-slate-600'}`}>{step.name}</span>
                      </li>
                    )
                  })}
                </ol>
                <div className="mt-8 rounded-2xl bg-primary-950 p-4 text-white">
                  <ShieldCheckIcon className="h-6 w-6 text-primary-300" />
                  <p className="mt-3 text-sm font-semibold">Book with confidence</p>
                  <p className="mt-1 text-xs leading-5 text-primary-100">Review every detail before adding your camp to the cart.</p>
                </div>
              </aside>

              <main className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-none items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 lg:hidden">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-primary-700 text-sm font-bold text-white">{currentStep}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{STEPS[currentStep - 1].name}</p>
                    <p className="text-xs text-slate-500">Step {currentStep} of {STEPS.length}</p>
                  </div>
                  <div className="flex gap-1.5" aria-hidden="true">
                    {STEPS.map(step => (
                      <span key={step.id} className={`h-1.5 rounded-full ${step.id <= currentStep ? 'w-6 bg-primary-700' : 'w-3 bg-slate-300'}`} />
                    ))}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8">
                  {renderStep()}
                </div>

                <footer className="flex flex-none items-center gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-8">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      Back
                    </button>
                  )}

                  {currentStep < STEPS.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="ml-auto inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl bg-primary-700 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:max-w-xs"
                    >
                      <span className="truncate">{NEXT_STEP_LABELS[currentStep]}</span>
                      <ArrowRightIcon className="ml-2 h-4 w-4 flex-none" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleContinueToCheckout}
                      className="ml-auto inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:max-w-xs"
                    >
                      Continue to checkout
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </button>
                  )}
                </footer>
              </main>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}

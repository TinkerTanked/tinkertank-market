'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { 
  ShoppingCartIcon,
  UserIcon,
  CreditCardIcon,
  CheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import StudentInfoForm from '@/components/checkout/StudentInfoForm'
import OrderSummary from '@/components/checkout/OrderSummary'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

enum CheckoutStep {
  REVIEW = 'review',
  STUDENTS = 'students',
  PAYMENT = 'payment'
}

export default function CheckoutPage() {
  const { items, getSummary, getValidation } = useEnhancedCartStore()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.REVIEW)
  const summary = getSummary()
  const validation = getValidation()

  useEffect(() => {
    if (items.length === 0) {
      router.push('/camps')
    }
  }, [items.length, router])

  if (items.length === 0) {
    return (
      <div className='py-20'>
        <div className='container-custom text-center'>
          <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <ShoppingCartIcon className='w-12 h-12 text-gray-400' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Your cart is empty</h1>
          <p className='text-gray-600 mb-8'>Add some amazing STEAM experiences to get started!</p>
          <Link href='/camps' className='btn-primary'>
            Browse Programs
          </Link>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const steps = [
    { id: CheckoutStep.REVIEW, name: 'Review', icon: ShoppingCartIcon },
    { id: CheckoutStep.STUDENTS, name: 'Students', icon: UserIcon },
    { id: CheckoutStep.PAYMENT, name: 'Payment', icon: CreditCardIcon }
  ]

  const canProceedToStudents = currentStep === CheckoutStep.REVIEW
  const canProceedToPayment = currentStep === CheckoutStep.STUDENTS && validation.isValid
  const isCurrentStep = (step: CheckoutStep) => currentStep === step
  const isCompletedStep = (step: CheckoutStep) => {
    if (step === CheckoutStep.REVIEW) return currentStep !== CheckoutStep.REVIEW
    if (step === CheckoutStep.STUDENTS) return currentStep === CheckoutStep.PAYMENT
    return false
  }

  return (
    <div className='py-12 bg-gray-50 min-h-screen'>
      <div className='container-custom max-w-6xl'>
        {/* Progress Indicator */}
        <div className='mb-12'>
          <div className='flex items-center justify-center space-x-4 md:space-x-8'>
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.id} className='flex items-center'>
                  <div className={`flex items-center space-x-3 ${
                    isCurrentStep(step.id) 
                      ? 'text-primary-600' 
                      : isCompletedStep(step.id)
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isCurrentStep(step.id)
                        ? 'border-primary-600 bg-primary-50'
                        : isCompletedStep(step.id)
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isCompletedStep(step.id) ? (
                        <CheckIcon className='w-5 h-5' />
                      ) : (
                        <Icon className='w-5 h-5' />
                      )}
                    </div>
                    <span className='hidden md:block font-medium'>{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompletedStep(steps[index + 1].id) ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-12'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Step Content */}
            {currentStep === CheckoutStep.REVIEW && (
              <div className='bg-white rounded-xl shadow-lg p-8'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl font-display font-bold text-gray-900'>
                    Review Your Order
                  </h2>
                  <Link href='/cart' className='text-primary-600 hover:text-primary-700 flex items-center'>
                    <ArrowLeftIcon className='w-4 h-4 mr-1' />
                    Edit Cart
                  </Link>
                </div>

                <div className='space-y-6'>
                  {items.map((item) => (
                    <div key={item.id} className='flex items-start space-x-4 p-4 border border-gray-200 rounded-lg'>
                      <div className='w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                        <span className='text-2xl'>
                          {item.product.category === 'camps' && '🔬'}
                          {item.product.category === 'birthdays' && '🎉'}
                          {item.product.category === 'subscriptions' && '🚀'}
                        </span>
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-display font-semibold text-lg text-gray-900'>
                          {item.product.name}
                        </h3>
                        <p className='text-gray-600'>{item.product.shortDescription}</p>
                        {item.selectedDate && (
                          <div className='flex items-center space-x-4 mt-2 text-sm text-gray-500'>
                            <span>📅 {item.selectedDate instanceof Date ? item.selectedDate.toLocaleDateString() : new Date(item.selectedDate).toLocaleDateString()}</span>
                            {item.selectedTimeSlot && <span>🕒 {typeof item.selectedTimeSlot === 'string' ? item.selectedTimeSlot : `${item.selectedTimeSlot.start} - ${item.selectedTimeSlot.end}`}</span>}
                          </div>
                        )}
                        <div className='flex items-center justify-between mt-3'>
                          <span className='text-gray-700'>Quantity: {item.quantity}</span>
                          <span className='font-bold text-lg'>{formatPrice(item.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-8 flex justify-end'>
                  <button
                    onClick={() => setCurrentStep(CheckoutStep.STUDENTS)}
                    disabled={!canProceedToStudents}
                    className='btn-primary text-lg px-8 py-4'
                  >
                    Continue to Student Info
                  </button>
                </div>
              </div>
            )}

            {currentStep === CheckoutStep.STUDENTS && (
              <div className='bg-white rounded-xl shadow-lg p-8'>
                <h2 className='text-2xl font-display font-bold text-gray-900 mb-6'>
                  Student Information
                </h2>
                <StudentInfoForm
                  onComplete={() => setCurrentStep(CheckoutStep.PAYMENT)}
                  onBack={() => setCurrentStep(CheckoutStep.REVIEW)}
                />
              </div>
            )}

            {currentStep === CheckoutStep.PAYMENT && (
              <div className='bg-white rounded-xl shadow-lg p-8'>
                <h2 className='text-2xl font-display font-bold text-gray-900 mb-6'>
                  Payment Details
                </h2>
                <Elements stripe={stripePromise}>
                  <CheckoutForm onBack={() => setCurrentStep(CheckoutStep.STUDENTS)} />
                </Elements>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-lg p-6 sticky top-24'>
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

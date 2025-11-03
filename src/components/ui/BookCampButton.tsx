'use client'

import { useState } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import CampBookingWizard from '../booking/CampBookingWizard'

interface BookCampButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'hero'
}

export default function BookCampButton({ 
  className = '',
  size = 'md',
  variant = 'primary'
}: BookCampButtonProps) {
  const [showWizard, setShowWizard] = useState(false)

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50',
    hero: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-xl hover:shadow-2xl transform hover:scale-105'
  }

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        className={`
          inline-flex items-center justify-center font-bold rounded-xl 
          transition-all duration-200 
          ${sizeClasses[size]} 
          ${variantClasses[variant]} 
          ${className}
        `}
      >
        <SparklesIcon className="w-5 h-5 mr-2" />
        Book Camp
      </button>

      <CampBookingWizard 
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
      />
    </>
  )
}

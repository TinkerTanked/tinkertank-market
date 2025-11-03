'use client'

import { useState, useEffect, memo } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface NotificationToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

export const NotificationToast = memo(function NotificationToast({
  toast,
  onDismiss,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  const iconMap = {
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  }

  const colorMap = {
    success: 'text-green-500 bg-green-50 border-green-200',
    error: 'text-red-500 bg-red-50 border-red-200',
    warning: 'text-yellow-500 bg-yellow-50 border-yellow-200',
    info: 'text-blue-500 bg-blue-50 border-blue-200',
  }

  const Icon = iconMap[toast.type]

  return (
    <div
      className={`
        pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${colorMap[toast.type]}
      `}
    >
      <div className='p-4'>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>
            <Icon className='h-6 w-6' aria-hidden='true' />
          </div>
          <div className='ml-3 w-0 flex-1 pt-0.5'>
            <p className='text-sm font-medium text-gray-900'>{toast.title}</p>
            {toast.message && (
              <p className='mt-1 text-sm text-gray-500'>{toast.message}</p>
            )}
          </div>
          <div className='ml-4 flex-shrink-0 flex'>
            <button
              className='bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              onClick={() => onDismiss(toast.id)}
            >
              <span className='sr-only'>Close</span>
              <XMarkIcon className='h-5 w-5' aria-hidden='true' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

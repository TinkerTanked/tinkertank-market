'use client'

import React, { useState, forwardRef } from 'react'
import { format } from 'date-fns'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import DateSelectorModal from './DateSelectorModal'

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  label?: string
  error?: string
  minDate?: Date
  maxDate?: Date
  dateFormat?: string
  modalTitle?: string
  modalDescription?: string
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({
    value,
    onChange,
    placeholder = 'Select date...',
    label,
    error,
    className = '',
    minDate,
    maxDate,
    dateFormat = 'MMM d, yyyy',
    modalTitle,
    modalDescription,
    disabled,
    ...props
  }, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleDateSelect = (date: Date) => {
      onChange(date)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(undefined)
    }

    const displayValue = value ? format(value, dateFormat) : ''

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            {...props}
            ref={ref}
            type="text"
            value={displayValue}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            onClick={() => !disabled && setIsModalOpen(true)}
            className={clsx(
              'w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
              {
                'cursor-pointer': !disabled,
                'cursor-not-allowed bg-gray-50': disabled,
                'border-red-300 focus:ring-red-500 focus:border-red-500': error,
              },
              className
            )}
          />
          
          {/* Calendar icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CalendarDaysIcon className={clsx(
              'h-5 w-5',
              error ? 'text-red-400' : 'text-gray-400'
            )} />
          </div>

          {/* Clear button (when value exists and not disabled) */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-8 flex items-center pr-1 text-gray-400 hover:text-gray-600 pointer-events-auto"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}

        <DateSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={value}
          onDateSelect={handleDateSelect}
          title={modalTitle}
          description={modalDescription}
          minDate={minDate}
          maxDate={maxDate}
        />
      </div>
    )
  }
)

DateInput.displayName = 'DateInput'

export default DateInput

'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import DateSelector from './DateSelector'

interface DateSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  title?: string
  description?: string
  minDate?: Date
  maxDate?: Date
}

export default function DateSelectorModal({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
  title = 'Select a Date',
  description = 'Choose your preferred date for booking',
  minDate,
  maxDate
}: DateSelectorModalProps) {
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(selectedDate)

  useEffect(() => {
    setTempSelectedDate(selectedDate)
  }, [selectedDate, isOpen])

  const handleConfirm = () => {
    if (tempSelectedDate) {
      onDateSelect(tempSelectedDate)
      onClose()
    }
  }

  const handleCancel = () => {
    setTempSelectedDate(selectedDate)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCancel} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={handleCancel}
                className="rounded-md p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {description && (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            )}
          </div>

          {/* Date Selector */}
          <div className="px-6 pb-4">
            <DateSelector
              selectedDate={tempSelectedDate}
              onDateSelect={setTempSelectedDate}
              minDate={minDate}
              maxDate={maxDate}
              className="border-0 shadow-none p-0"
            />
          </div>

          {/* Selected date display */}
          {tempSelectedDate && (
            <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
              <div className="text-center">
                <p className="text-sm text-blue-700">Selected Date</p>
                <p className="text-lg font-semibold text-blue-900">
                  {format(tempSelectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              onClick={handleCancel}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!tempSelectedDate}
              className={clsx(
                'w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors',
                tempSelectedDate
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              )}
            >
              Confirm Date
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

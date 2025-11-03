'use client'

import React, { useState } from 'react'
import { format, addDays, addMonths } from 'date-fns'
import DateSelector from '../ui/DateSelector'
import DateInput from '../ui/DateInput'
import DateSelectorModal from '../ui/DateSelectorModal'

export default function DateSelectorDemo() {
  const [selectedDate1, setSelectedDate1] = useState<Date>()
  const [selectedDate2, setSelectedDate2] = useState<Date>()
  const [selectedDate3, setSelectedDate3] = useState<Date>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSelectedDate, setModalSelectedDate] = useState<Date>()

  const today = new Date()
  const maxDate = addMonths(today, 6) // 6 months from now

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Date Selector Components</h1>
        <p className="text-gray-600">Beautiful, accessible date selection for camp bookings</p>
      </div>

      {/* Inline Date Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Inline Date Selector</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <DateSelector
              selectedDate={selectedDate1}
              onDateSelect={setSelectedDate1}
              minDate={today}
              maxDate={maxDate}
            />
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Features:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Weekends automatically blocked
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Past dates disabled
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Month/year dropdowns
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Keyboard accessible
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Mobile responsive
              </li>
            </ul>
            {selectedDate1 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Selected:</p>
                <p className="text-blue-800">{format(selectedDate1, 'EEEE, MMMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Input Field */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Date Input Field</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <DateInput
              label="Camp Start Date"
              value={selectedDate2}
              onChange={setSelectedDate2}
              placeholder="Choose your camp date"
              minDate={today}
              maxDate={maxDate}
              modalTitle="Select Camp Date"
              modalDescription="Pick a weekday for your camp experience"
            />
            
            <DateInput
              label="Birthday Party Date"
              value={selectedDate3}
              onChange={setSelectedDate3}
              placeholder="Select party date"
              minDate={addDays(today, 7)} // At least 1 week notice
              maxDate={maxDate}
              modalTitle="Birthday Party Booking"
              modalDescription="Choose your celebration date (weekdays only)"
            />
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Input Features:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Click to open modal calendar
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Clear button when date selected
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Custom formatting options
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Form validation support
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Disabled state handling
              </li>
            </ul>
            
            {(selectedDate2 || selectedDate3) && (
              <div className="space-y-2">
                {selectedDate2 && (
                  <div className="p-3 bg-green-50 rounded-md border border-green-200">
                    <p className="text-sm font-medium text-green-900">Camp Date:</p>
                    <p className="text-green-800">{format(selectedDate2, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                )}
                {selectedDate3 && (
                  <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                    <p className="text-sm font-medium text-purple-900">Party Date:</p>
                    <p className="text-purple-800">{format(selectedDate3, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Standalone Modal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Standalone Modal</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Open Date Selector Modal
            </button>
            
            {modalSelectedDate && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Modal Selection:</p>
                <p className="text-lg text-blue-800 font-semibold">
                  {format(modalSelectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Modal Features:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Backdrop click to close
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Confirm/cancel actions
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Selected date preview
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Customizable titles
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Escape key support
              </li>
            </ul>
          </div>
        </div>
      </div>

      <DateSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={modalSelectedDate}
        onDateSelect={setModalSelectedDate}
        title="Choose Your Date"
        description="Select any available weekday for your booking"
        minDate={today}
        maxDate={maxDate}
      />

      {/* Technical Details */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Implementation</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Dependencies Used:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• date-fns for date manipulation</li>
              <li>• @heroicons/react for icons</li>
              <li>• clsx for conditional styling</li>
              <li>• Tailwind CSS for design</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Features:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• TypeScript for type safety</li>
              <li>• Accessibility (ARIA labels)</li>
              <li>• Keyboard navigation</li>
              <li>• Mobile responsive design</li>
              <li>• Performance optimized</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

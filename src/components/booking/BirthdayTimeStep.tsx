'use client'

import { ClockIcon, CheckIcon } from '@heroicons/react/24/outline'

interface BirthdayTimeStepProps {
  selectedTimeSlot: string | null
  onTimeSlotSelect: (timeSlot: string) => void
  selectedDate: Date | null
}

const TIME_SLOTS = [
  {
    id: 'morning',
    time: '10:00 AM - 12:00 PM',
    label: 'Morning Session',
    description: 'Perfect for younger children'
  },
  {
    id: 'afternoon-early',
    time: '1:00 PM - 3:00 PM',
    label: 'Early Afternoon',
    description: 'Most popular time slot'
  },
  {
    id: 'afternoon-late',
    time: '3:30 PM - 5:30 PM',
    label: 'Late Afternoon',
    description: 'Great for weekend parties'
  }
]

export default function BirthdayTimeStep({ 
  selectedTimeSlot, 
  onTimeSlotSelect,
  selectedDate
}: BirthdayTimeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Choose Your Party Time</h3>
        <p className="text-gray-600">
          Select a 2-hour time slot for your party
        </p>
      </div>

      {selectedTimeSlot && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-purple-900">Selected Time</h4>
              <p className="text-purple-700">{selectedTimeSlot}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {TIME_SLOTS.map((slot) => (
          <div
            key={slot.id}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedTimeSlot === slot.time
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
            }`}
            onClick={() => onTimeSlotSelect(slot.time)}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedTimeSlot === slot.time
                  ? 'bg-purple-100'
                  : 'bg-gray-100'
              }`}>
                <ClockIcon className={`w-6 h-6 ${
                  selectedTimeSlot === slot.time
                    ? 'text-purple-600'
                    : 'text-gray-600'
                }`} />
              </div>

              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {slot.label}
                </h4>
                <p className="text-purple-600 font-medium mb-1">
                  {slot.time}
                </p>
                <p className="text-gray-500 text-sm">
                  {slot.description}
                </p>
              </div>

              {selectedTimeSlot === slot.time && (
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-purple-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-purple-600 text-lg">⏰</span>
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-1">Party Timing</h4>
            <ul className="text-purple-800 text-sm space-y-1">
              <li>• Each party is 2 hours long</li>
              <li>• Setup begins 15 minutes before start time</li>
              <li>• Parents can arrive 10 minutes early</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

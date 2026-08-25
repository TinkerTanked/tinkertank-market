'use client'

import { useEffect, useState } from 'react'
import { ClockIcon, CheckIcon } from '@heroicons/react/24/outline'
import { toLocalDateString } from '@/lib/dates'

interface BirthdayTimeStepProps {
  selectedTimeSlot: string | null
  onTimeSlotSelect: (timeSlot: string | null) => void
  selectedDate: Date | null
}

const TIME_SLOTS = [
  {
    id: 'morning',
    start: '10:00',
    time: '10:00 AM - 12:00 PM',
    label: 'Morning Session',
    description: 'Perfect for younger children'
  },
  {
    id: 'afternoon-early',
    start: '13:00',
    time: '1:00 PM - 3:00 PM',
    label: 'Early Afternoon',
    description: 'Most popular time slot'
  },
  {
    id: 'afternoon-late',
    start: '15:30',
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
  const [unavailableStartTimes, setUnavailableStartTimes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedDate) return

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    setUnavailableStartTimes([])

    fetch(`/api/birthday-availability?date=${toLocalDateString(selectedDate)}`, {
      cache: 'no-store',
      signal: controller.signal
    })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to check birthday availability.')
        return response.json() as Promise<{ unavailableStartTimes: string[] }>
      })
      .then(data => setUnavailableStartTimes(data.unavailableStartTimes))
      .catch(fetchError => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return
        setUnavailableStartTimes([])
        setError('We could not check live availability. Please go back and try again.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [selectedDate])

  useEffect(() => {
    const selectedSlot = TIME_SLOTS.find(slot => slot.time === selectedTimeSlot)
    if (selectedSlot && unavailableStartTimes.includes(selectedSlot.start)) {
      onTimeSlotSelect(null)
    }
  }, [onTimeSlotSelect, selectedTimeSlot, unavailableStartTimes])

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
        {TIME_SLOTS.map((slot) => {
          const isUnavailable = unavailableStartTimes.includes(slot.start)
          const isDisabled = isLoading || !!error || isUnavailable

          return (
          <button
            type="button"
            key={slot.id}
            disabled={isDisabled}
            className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
              isUnavailable
                ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-70'
                : selectedTimeSlot === slot.time
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : isDisabled
                    ? 'cursor-wait border-gray-200 bg-white opacity-60'
                    : 'cursor-pointer border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
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
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-gray-900">{slot.label}</h4>
                  {isUnavailable && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">Booked</span>
                  )}
                </div>
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
          </button>
          )
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

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

'use client'

import { useState } from 'react'
import DateStep from '@/components/booking/DateStep'

export default function CalendarDebugPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  const mockLocation = {
    id: 'neutral-bay',
    name: 'Neutral Bay',
    address: '123 Test Street, Neutral Bay NSW 2089'
  }

  const handleDateSelect = (date: Date) => {
    console.log('🔍 DEBUG: Date selected in debug page:', date)
    setSelectedDate(date)
  }

  console.log('🔍 DEBUG: CalendarDebugPage rendering with:', {
    selectedDate,
    mockLocation
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-red-600">
            🚨 CALENDAR DEBUG MODE 🚨
          </h1>
          <p className="text-center text-gray-600 mb-4">
            Testing calendar component in isolation
          </p>
          
          {/* Debug Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-yellow-700">
              <p><strong>Selected Date:</strong> {selectedDate ? selectedDate.toString() : 'None'}</p>
              <p><strong>Location:</strong> {mockLocation.name}</p>
              <p><strong>Component Props:</strong> All props are passed correctly</p>
            </div>
          </div>

          {/* Test styling without Tailwind */}
          <div style={{
            padding: '20px',
            border: '2px solid red',
            backgroundColor: '#f0f0f0',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: 'red', fontSize: '18px', fontWeight: 'bold' }}>
              FALLBACK STYLING TEST (No Tailwind)
            </h3>
            <p style={{ color: 'black' }}>
              If you can see this clearly, Tailwind might be the issue.
            </p>
          </div>

          {/* Calendar Component */}
          <div className="border-4 border-blue-500 p-4 bg-blue-50">
            <h3 className="text-xl font-bold mb-4 text-blue-800">
              Calendar Component Below:
            </h3>
            <DateStep 
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              location={mockLocation}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

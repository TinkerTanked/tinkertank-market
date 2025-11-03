'use client'

import { useState } from 'react'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isBefore, startOfDay, isSameDay } from 'date-fns'

export default function DebugCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const currentMonth = new Date()
  const today = startOfDay(new Date())

  // Generate days for current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  console.log('Debug Calendar - Generated days:', days.length)

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date)
    if (!isWeekend(date) && !isBefore(date, today)) {
      setSelectedDate(date)
      console.log('Selected date updated:', date)
    } else {
      console.log('Date not selectable - weekend or past date')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Calendar Debug Test</h1>
      
      {selectedDate && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold">Selected Date:</h2>
          <p>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
      )}

      <div className="border-4 border-red-500 p-4 bg-white rounded-lg">
        <h2 className="text-xl font-bold mb-4">{format(currentMonth, 'MMMM yyyy')}</h2>
        
        {/* Simple Grid Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center font-semibold p-2 bg-gray-100">
              {day}
            </div>
          ))}
          
          {days.map(date => {
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isWeekendDay = isWeekend(date)
            const isPast = isBefore(date, today)
            const isSelectable = !isWeekendDay && !isPast

            return (
              <button
                key={date.toString()}
                onClick={() => handleDateClick(date)}
                disabled={!isSelectable}
                style={{
                  backgroundColor: isSelected ? '#3b82f6' : isWeekendDay ? '#f3f4f6' : '#ffffff',
                  color: isSelected ? '#ffffff' : isWeekendDay ? '#9ca3af' : '#1f2937',
                  border: '2px solid #e5e7eb',
                  padding: '12px',
                  minHeight: '48px',
                  cursor: isSelectable ? 'pointer' : 'not-allowed',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {format(date, 'd')}
                  </span>
                  {isWeekendDay && (
                    <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                      Closed
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>• Click on weekdays to select</p>
        <p>• Weekends show "Closed" and can't be selected</p>
        <p>• Check browser console for debug logs</p>
      </div>
    </div>
  )
}

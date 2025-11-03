'use client'

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function SimpleCalendarDebug() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`🔍 ${message}`)
  }

  // Simple test events
  const events = [
    {
      id: '1',
      title: 'Test Event 1',
      start: new Date().toISOString().split('T')[0] + 'T10:00:00',
      end: new Date().toISOString().split('T')[0] + 'T12:00:00',
      backgroundColor: '#3b82f6',
      borderColor: '#1e40af',
      textColor: '#ffffff'
    },
    {
      id: '2',
      title: 'Test Event 2',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T14:00:00',
      end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00',
      backgroundColor: '#10b981',
      borderColor: '#059669',
      textColor: '#ffffff'
    }
  ]

  const handleEventClick = (info: any) => {
    addLog(`Event clicked: ${info.event.title} (ID: ${info.event.id})`)
    alert(`Clicked: ${info.event.title}`)
  }

  const handleDateClick = (info: any) => {
    addLog(`Date clicked: ${info.dateStr}`)
    alert(`Date clicked: ${info.dateStr}`)
  }

  const handleEventMount = (info: any) => {
    addLog(`Event mounted: ${info.event.title}`)
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Simple Calendar Debug</h1>
          <p className="text-gray-600 mt-2">Testing basic FullCalendar functionality</p>
        </div>

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Environment</h3>
              <ul className="text-sm space-y-1">
                <li>✅ FullCalendar React: 6.1.15</li>
                <li>✅ React: 18.3.1</li>
                <li>✅ Next.js: 15.0.3</li>
                <li>✅ Test Events: {events.length}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Plugins Loaded</h3>
              <ul className="text-sm space-y-1">
                <li>✅ dayGridPlugin</li>
                <li>✅ timeGridPlugin</li>
                <li>✅ interactionPlugin</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Calendar Test</h2>
            <div className="border rounded-lg overflow-hidden">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                height="500px"
                events={events}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                eventDidMount={handleEventMount}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                nowIndicator={true}
                eventDisplay="block"
                displayEventTime={true}
              />
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Event Log</h2>
              <button
                onClick={() => setLogs([])}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Clear Log
              </button>
            </div>
            <div className="bg-gray-50 rounded p-4 h-40 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">Click on events or dates to see interactions...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

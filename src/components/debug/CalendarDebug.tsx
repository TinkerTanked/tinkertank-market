'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { AdminCalendarEvent } from '@/types/booking'

interface CalendarDebugProps {
  events?: AdminCalendarEvent[]
}

export default function CalendarDebug({ events = [] }: CalendarDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [calendarRef, setCalendarRef] = useState<any>(null)

  // Debug test events
  const testEvents = [
    {
      id: 'test-1',
      title: 'Test Event 1',
      start: new Date(),
      end: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      extendedProps: {
        currentBookings: 5,
        capacity: 10,
        productType: 'CAMP',
        status: 'CONFIRMED'
      }
    },
    {
      id: 'test-2',
      title: 'Test Event 2',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      end: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow + 2 hours
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      extendedProps: {
        currentBookings: 8,
        capacity: 12,
        productType: 'BIRTHDAY',
        status: 'PENDING'
      }
    }
  ]

  useEffect(() => {
    const checkCalendarState = () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        fullCalendarVersion: '6.1.15',
        reactVersion: '18.3.1',
        eventsProvided: events?.length || 0,
        testEventsCount: testEvents.length,
        plugins: ['dayGrid', 'timeGrid', 'interaction'],
        domReady: document.readyState === 'complete',
        calendarContainerExists: !!document.querySelector('.fc'),
        calendarEventsExist: !!document.querySelectorAll('.fc-event').length,
        calendarHeaderExists: !!document.querySelector('.fc-toolbar'),
        calendarBodyExists: !!document.querySelector('.fc-view'),
        cssLoaded: {
          tailwind: !!document.querySelector('[data-tw-processed]'),
          customStyles: !!document.querySelector('style[data-styled]')
        },
        errors: []
      }

      // Check for console errors
      const originalError = console.error
      const errors: string[] = []
      console.error = (...args) => {
        errors.push(args.join(' '))
        originalError.apply(console, args)
      }

      setTimeout(() => {
        info.errors = errors
        console.error = originalError
      }, 1000)

      setDebugInfo(info)
    }

    checkCalendarState()
    const interval = setInterval(checkCalendarState, 2000)

    return () => clearInterval(interval)
  }, [events])

  const handleEventClick = (info: any) => {
    console.log('🎯 Event clicked:', info.event.title, info.event)
    alert(`Event clicked: ${info.event.title}`)
  }

  const handleDateClick = (info: any) => {
    console.log('📅 Date clicked:', info.dateStr, info)
    alert(`Date clicked: ${info.dateStr}`)
  }

  const handleEventMount = (info: any) => {
    console.log('🎨 Event mounted:', info.event.title, info.el)
    
    // Add visual debugging
    if (info.el) {
      info.el.style.border = '2px solid red'
      info.el.title = `Debug: ${info.event.title} - Click to test`
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Calendar Debug Tool</h1>
        
        {/* Debug Information Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Calendar State</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify({
                  eventsCount: debugInfo.eventsProvided,
                  testEventsCount: debugInfo.testEventsCount,
                  domReady: debugInfo.domReady,
                  calendarElements: {
                    container: debugInfo.calendarContainerExists,
                    events: debugInfo.calendarEventsExist,
                    header: debugInfo.calendarHeaderExists,
                    body: debugInfo.calendarBodyExists
                  }
                }, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Environment</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify({
                  fullCalendarVersion: debugInfo.fullCalendarVersion,
                  reactVersion: debugInfo.reactVersion,
                  plugins: debugInfo.plugins,
                  timestamp: debugInfo.timestamp
                }, null, 2)}
              </pre>
            </div>
          </div>
          
          {debugInfo.errors?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-red-700 mb-2">Console Errors</h3>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                {debugInfo.errors.map((error: string, index: number) => (
                  <div key={index} className="text-red-600 text-sm font-mono">{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                console.log('🔄 Calendar API test')
                if (calendarRef?.getApi) {
                  const api = calendarRef.getApi()
                  console.log('Calendar API:', api)
                  console.log('Current events:', api.getEvents())
                  console.log('Current view:', api.view)
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Calendar API
            </button>
            <button
              onClick={() => {
                console.log('🎨 DOM Elements check')
                console.log('Calendar container:', document.querySelector('.fc'))
                console.log('Calendar events:', document.querySelectorAll('.fc-event'))
                console.log('Calendar cells:', document.querySelectorAll('.fc-daygrid-day'))
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Check DOM Elements
            </button>
            <button
              onClick={() => {
                console.log('⚡ Force Re-render')
                window.location.reload()
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Force Refresh
            </button>
          </div>
        </div>

        {/* Simple Calendar Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Basic Calendar Test</h2>
          <div className="border border-gray-300 rounded">
            <FullCalendar
              ref={(ref) => setCalendarRef(ref)}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="400px"
              events={testEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventDidMount={handleEventMount}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              editable={true}
              selectable={true}
              eventOverlap={false}
              dayMaxEvents={3}
              eventDisplay="block"
              displayEventTime={true}
              displayEventEnd={true}
            />
          </div>
        </div>

        {/* Advanced Calendar Test (using provided events) */}
        {events && events.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Advanced Calendar Test ({events.length} events)
            </h2>
            <div className="border border-gray-300 rounded">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height="500px"
                events={events}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                eventDidMount={handleEventMount}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

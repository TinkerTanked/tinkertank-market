'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { 
  AdminCalendarEvent, 
  BookingEvent, 
  BookingStatus, 
  PaymentStatus,
  getBookingStatusColor,
  getPaymentStatusColor 
} from '@/types/booking'
import { format } from 'date-fns'
import { clsx } from 'clsx'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  event: AdminCalendarEvent
  onUpdate?: (eventId: string, updates: Partial<BookingEvent>) => void
  onDelete?: (eventId: string) => void
}

export default function EventModal({
  isOpen,
  onClose,
  event,
  onUpdate,
  onDelete
}: EventModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'settings'>('overview')
  const [isEditing, setIsEditing] = useState(false)

  const { 
    product, 
    bookings = [], 
    availableSpots, 
    capacity, 
    currentBookings,
    location,
    status,
    paymentStatus
  } = event.extendedProps

  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amountPaid, 0)
  const totalPending = bookings.reduce((sum, booking) => 
    sum + (booking.totalAmount - booking.amountPaid), 0
  )

  const statusCounts = bookings.reduce((counts, booking) => {
    counts[booking.status] = (counts[booking.status] || 0) + 1
    return counts
  }, {} as Record<BookingStatus, number>)

  const paymentCounts = bookings.reduce((counts, booking) => {
    counts[booking.paymentStatus] = (counts[booking.paymentStatus] || 0) + 1
    return counts
  }, {} as Record<PaymentStatus, number>)

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    if (onUpdate) {
      onUpdate(bookingId, { status: newStatus })
    }
  }

  const handlePaymentStatusChange = (bookingId: string, newStatus: PaymentStatus) => {
    if (onUpdate) {
      onUpdate(bookingId, { paymentStatus: newStatus })
    }
  }

  const exportToICal = () => {
    const startDate = event.start.toISOString().replace(/[:\-]|\.\d\d\d/g, '')
    const endDate = event.end.toISOString().replace(/[:\-]|\.\d\d\d/g, '')
    
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TinkerTank//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@tinkertank.com.au`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${product?.description || ''}`,
      `LOCATION:${location}`,
      `STATUS:${status === BookingStatus.CONFIRMED ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n')

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tinkertank-${event.title.toLowerCase().replace(/\s+/g, '-')}.ics`
    link.click()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {event.title}
              </Dialog.Title>
              <p className="text-sm text-gray-600 mt-1">
                {format(event.start, 'EEEE, MMMM d, yyyy • h:mm a')} - {format(event.end, 'h:mm a')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['overview', 'students', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={clsx(
                    'py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors',
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Capacity</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {currentBookings || 0} / {capacity || 0}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {availableSpots} spots available
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-900">Revenue</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${totalRevenue.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      ${totalPending.toFixed(2)} pending
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">Location</div>
                    <div className="text-lg font-semibold text-gray-800">{location}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {product?.type || 'Unknown Type'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Status</h3>
                    <div className="space-y-2">
                      {Object.entries(statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getBookingStatusColor(status as BookingStatus) }}
                            />
                            <span className="text-sm capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Status</h3>
                    <div className="space-y-2">
                      {Object.entries(paymentCounts).map(([paymentStatus, count]) => (
                        <div key={paymentStatus} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getPaymentStatusColor(paymentStatus as PaymentStatus) }}
                            />
                            <span className="text-sm capitalize">{paymentStatus.toLowerCase().replace('_', ' ')}</span>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Enrolled Students ({bookings.length})
                </h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.student?.name || 'Unknown Student'}
                            </div>
                            {booking.specialRequests && (
                              <div className="text-xs text-gray-500 mt-1">
                                Special requests: {booking.specialRequests}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={booking.status}
                              onChange={(e) => handleStatusChange(booking.id, e.target.value as BookingStatus)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {Object.values(BookingStatus).map((status) => (
                                <option key={status} value={status}>
                                  {status.toLowerCase().replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={booking.paymentStatus}
                              onChange={(e) => handlePaymentStatusChange(booking.id, e.target.value as PaymentStatus)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {Object.values(PaymentStatus).map((status) => (
                                <option key={status} value={status}>
                                  {status.toLowerCase().replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${booking.amountPaid.toFixed(2)} / ${booking.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              View
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Event Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Title
                      </label>
                      <input
                        type="text"
                        value={event.title}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={capacity || ''}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {isEditing ? 'Save Changes' : 'Edit Event'}
                    </button>
                    <button
                      onClick={exportToICal}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Export iCal
                    </button>
                  </div>
                  
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                          onDelete(event.id)
                          onClose()
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete Event
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

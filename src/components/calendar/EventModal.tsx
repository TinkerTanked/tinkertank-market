'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { 
  XMarkIcon, 
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
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

const toDate = (d: string | Date | null | undefined): Date => 
  d instanceof Date ? d : d ? new Date(d) : new Date()

type AttendanceStatus = 'NOT_ARRIVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT'

interface AttendanceRecord {
  id?: string
  bookingId: string
  status: AttendanceStatus
  checkInAt?: string
  checkOutAt?: string
  notes?: string
}

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  event: AdminCalendarEvent
  onUpdate?: (eventId: string, updates: Partial<BookingEvent>) => void
  onDelete?: (eventId: string) => void
}

const STATUS_ICONS = {
  [BookingStatus.CONFIRMED]: CheckCircleIcon,
  [BookingStatus.PENDING]: ClockIcon,
  [BookingStatus.CANCELLED]: XMarkIcon,
  [BookingStatus.COMPLETED]: CheckCircleIcon,
  [BookingStatus.NO_SHOW]: ExclamationCircleIcon,
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
  const [attendanceByBooking, setAttendanceByBooking] = useState<Record<string, AttendanceRecord>>({})
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | AttendanceStatus>('all')

  const { 
    product, 
    bookings = [], 
    availableSpots, 
    capacity, 
    currentBookings,
    location,
    status,
    paymentStatus,
    productType
  } = event.extendedProps

  const totalRevenue = bookings.reduce((sum, booking: any) => sum + (Number(booking.totalPrice) || 0), 0)
  const totalPending = 0
  const totalExpected = bookings.reduce((sum, booking: any) => sum + (Number(booking.totalAmount) || 0), 0)

  const statusCounts = bookings.reduce((counts, booking) => {
    counts[booking.status] = (counts[booking.status] || 0) + 1
    return counts
  }, {} as Record<BookingStatus, number>)

  const paymentCounts = bookings.reduce((counts, booking) => {
    counts[booking.paymentStatus] = (counts[booking.paymentStatus] || 0) + 1
    return counts
  }, {} as Record<PaymentStatus, number>)

  const utilizationPercent = capacity ? Math.round(((currentBookings || 0) / capacity) * 100) : 0

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

  useEffect(() => {
    if (isOpen) {
      const initialAttendance: Record<string, AttendanceRecord> = {}
      bookings.forEach((booking: any) => {
        initialAttendance[booking.id] = {
          bookingId: booking.id,
          status: 'NOT_ARRIVED' as AttendanceStatus
        }
      })
      setAttendanceByBooking(initialAttendance)
    }
  }, [isOpen, bookings])

  const handleCheckIn = async (bookingId: string) => {
    const now = new Date().toISOString()
    setAttendanceByBooking(prev => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], status: 'CHECKED_IN', checkInAt: now }
    }))
  }

  const handleCheckOut = async (bookingId: string) => {
    const now = new Date().toISOString()
    setAttendanceByBooking(prev => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], status: 'CHECKED_OUT', checkOutAt: now }
    }))
  }

  const handleMarkAbsent = async (bookingId: string) => {
    setAttendanceByBooking(prev => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], status: 'ABSENT' }
    }))
  }

  const exportToICal = () => {
    const startDate = toDate(event.start).toISOString().replace(/[:\-]|\.\d\d\d/g, '')
    const endDate = toDate(event.end).toISOString().replace(/[:\-]|\.\d\d\d/g, '')
    
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

  const getProductTypeColor = () => {
    switch (productType) {
      case 'CAMP': return 'bg-blue-500'
      case 'BIRTHDAY': return 'bg-orange-500'
      case 'IGNITE': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className={clsx('p-6 text-white', getProductTypeColor())}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Dialog.Title className="text-2xl font-bold flex items-center gap-3">
                        <CalendarIcon className="h-7 w-7" />
                        {event.title}
                      </Dialog.Title>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span className="font-medium">
                            {format(toDate(event.start), 'EEEE, MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4" />
                          <span className="font-medium">{location}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="border-b border-gray-200 bg-gray-50">
                  <nav className="flex px-6">
                    {['overview', 'students', 'settings'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as typeof activeTab)}
                        className={clsx(
                          'py-4 px-6 border-b-2 font-semibold text-sm capitalize transition-all',
                          activeTab === tab
                            ? 'border-primary-500 text-primary-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                          <div className="flex items-center gap-3 mb-2">
                            <UsersIcon className="h-5 w-5 text-blue-600" />
                            <div className="text-sm font-medium text-blue-900">Capacity</div>
                          </div>
                          <div className="text-3xl font-bold text-blue-700">
                            {currentBookings || 0}/{capacity || 0}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-blue-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${utilizationPercent}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-blue-700">{utilizationPercent}%</span>
                          </div>
                          <div className="text-xs text-blue-700 mt-2 font-medium">
                            {availableSpots} spots available
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                          <div className="flex items-center gap-3 mb-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                            <div className="text-sm font-medium text-green-900">Revenue</div>
                          </div>
                          <div className="text-3xl font-bold text-green-700">
                            ${totalRevenue.toFixed(0)}
                          </div>
                          <div className="text-xs text-green-700 mt-2">
                            ${totalExpected.toFixed(0)} expected
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
                          <div className="flex items-center gap-3 mb-2">
                            <BanknotesIcon className="h-5 w-5 text-amber-600" />
                            <div className="text-sm font-medium text-amber-900">Pending</div>
                          </div>
                          <div className="text-3xl font-bold text-amber-700">
                            ${totalPending.toFixed(0)}
                          </div>
                          <div className="text-xs text-amber-700 mt-2">
                            {paymentCounts[PaymentStatus.PENDING] || 0} payments
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                            <div className="text-sm font-medium text-purple-900">Status</div>
                          </div>
                          <div className="text-lg font-bold text-purple-700 capitalize">
                            {status?.toLowerCase().replace('_', ' ')}
                          </div>
                          <div className="text-xs text-purple-700 mt-2">
                            {statusCounts[BookingStatus.CONFIRMED] || 0} confirmed
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-gray-600" />
                            Booking Status
                          </h3>
                          <div className="space-y-3">
                            {Object.entries(statusCounts).map(([status, count]) => (
                              <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: getBookingStatusColor(status as BookingStatus) }}
                                  />
                                  <span className="text-sm font-medium capitalize">
                                    {status.toLowerCase().replace('_', ' ')}
                                  </span>
                                </div>
                                <span className="text-lg font-bold text-gray-900">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BanknotesIcon className="h-5 w-5 text-gray-600" />
                            Payment Status
                          </h3>
                          <div className="space-y-3">
                            {Object.entries(paymentCounts).map(([paymentStatus, count]) => (
                              <div key={paymentStatus} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: getPaymentStatusColor(paymentStatus as PaymentStatus) }}
                                  />
                                  <span className="text-sm font-medium capitalize">
                                    {paymentStatus.toLowerCase().replace('_', ' ')}
                                  </span>
                                </div>
                                <span className="text-lg font-bold text-gray-900">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'students' && (
                    <div className="space-y-6">
                      {/* Attendance Summary */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-5 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-700" />
                            <div>
                              <div className="text-sm font-medium text-green-900">Attendance</div>
                              <div className="text-2xl font-bold text-green-700">
                                {Object.values(attendanceByBooking).filter(a => a.status === 'CHECKED_IN').length}/{bookings.length}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-green-700 font-medium space-y-1 text-right">
                            <div>{Object.values(attendanceByBooking).filter(a => a.status === 'CHECKED_OUT').length} checked out</div>
                            <div>{Object.values(attendanceByBooking).filter(a => a.status === 'ABSENT').length} absent</div>
                          </div>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-green-600 h-full rounded-full transition-all"
                            style={{ 
                              width: `${bookings.length > 0 ? (Object.values(attendanceByBooking).filter(a => a.status === 'CHECKED_IN').length / bookings.length) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {(['all', 'NOT_ARRIVED', 'CHECKED_IN', 'CHECKED_OUT', 'ABSENT'] as const).map((filter) => {
                          const count = filter === 'all' 
                            ? bookings.length 
                            : Object.values(attendanceByBooking).filter(a => a.status === filter).length
                          return (
                            <button
                              key={filter}
                              onClick={() => setAttendanceFilter(filter)}
                              className={clsx(
                                'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all',
                                attendanceFilter === filter
                                  ? 'bg-primary-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              )}
                            >
                              {filter === 'all' ? 'All' : filter.replace('_', ' ')} ({count})
                            </button>
                          )
                        })}
                      </div>

                      {/* Student List - Mobile Cards */}
                      <div className="space-y-4 md:hidden">
                        {bookings
                          .filter((booking: any) => {
                            if (attendanceFilter === 'all') return true
                            return attendanceByBooking[booking.id]?.status === attendanceFilter
                          })
                          .map((booking: any) => {
                          const attendance = attendanceByBooking[booking.id] || { status: 'NOT_ARRIVED' }
                          const allergies = booking.student?.allergies || booking.specialRequests
                          
                          return (
                            <div key={booking.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                  {(booking.student?.name || 'U')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-lg font-bold text-gray-900 truncate">
                                    {booking.student?.name || 'Unknown Student'}
                                  </div>
                                  {allergies && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-800 text-xs font-bold">
                                        ⚠️ {allergies}
                                      </span>
                                    </div>
                                  )}
                                  <div className={clsx(
                                    'inline-flex items-center px-2 py-1 rounded-md text-xs font-bold mt-2',
                                    attendance.status === 'CHECKED_IN' && 'bg-green-100 text-green-800',
                                    attendance.status === 'CHECKED_OUT' && 'bg-indigo-100 text-indigo-800',
                                    attendance.status === 'ABSENT' && 'bg-red-100 text-red-800',
                                    attendance.status === 'NOT_ARRIVED' && 'bg-gray-100 text-gray-800'
                                  )}>
                                    {attendance.status === 'CHECKED_IN' && `✓ In at ${format(new Date(attendance.checkInAt!), 'h:mm a')}`}
                                    {attendance.status === 'CHECKED_OUT' && `← Out at ${format(new Date(attendance.checkOutAt!), 'h:mm a')}`}
                                    {attendance.status === 'ABSENT' && '✗ Absent'}
                                    {attendance.status === 'NOT_ARRIVED' && '○ Not arrived'}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {attendance.status !== 'CHECKED_IN' && attendance.status !== 'CHECKED_OUT' && (
                                  <button
                                    onClick={() => handleCheckIn(booking.id)}
                                    className="px-4 py-3 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors shadow-md"
                                  >
                                    ✓ Check In
                                  </button>
                                )}
                                {attendance.status === 'CHECKED_IN' && (
                                  <button
                                    onClick={() => handleCheckOut(booking.id)}
                                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
                                  >
                                    → Check Out
                                  </button>
                                )}
                                {attendance.status !== 'ABSENT' && (
                                  <button
                                    onClick={() => handleMarkAbsent(booking.id)}
                                    className="px-4 py-3 bg-red-100 text-red-700 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors"
                                  >
                                    ✗ Absent
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <a
                                  href="tel:"
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-200 transition-colors"
                                >
                                  <PhoneIcon className="h-4 w-4" />
                                  Call Parent
                                </a>
                                <a
                                  href="mailto:"
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold text-sm hover:bg-purple-200 transition-colors"
                                >
                                  <EnvelopeIcon className="h-4 w-4" />
                                  Email
                                </a>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Student List - Desktop Table */}
                      <div className="hidden md:block overflow-hidden shadow-sm ring-1 ring-gray-200 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Student</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Allergies/Medical</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Attendance</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Contact</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {bookings
                              .filter((booking: any) => {
                                if (attendanceFilter === 'all') return true
                                return attendanceByBooking[booking.id]?.status === attendanceFilter
                              })
                              .map((booking: any) => {
                              const attendance = attendanceByBooking[booking.id] || { status: 'NOT_ARRIVED' }
                              const allergies = booking.student?.allergies || booking.specialRequests
                              
                              return (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {(booking.student?.name || 'U')[0].toUpperCase()}
                                      </div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        {booking.student?.name || 'Unknown Student'}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {allergies ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-800 text-xs font-bold">
                                        ⚠️ {allergies}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">None</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className={clsx(
                                      'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold',
                                      attendance.status === 'CHECKED_IN' && 'bg-green-100 text-green-800',
                                      attendance.status === 'CHECKED_OUT' && 'bg-indigo-100 text-indigo-800',
                                      attendance.status === 'ABSENT' && 'bg-red-100 text-red-800',
                                      attendance.status === 'NOT_ARRIVED' && 'bg-gray-100 text-gray-800'
                                    )}>
                                      {attendance.status === 'CHECKED_IN' && `In ${format(new Date(attendance.checkInAt!), 'h:mm a')}`}
                                      {attendance.status === 'CHECKED_OUT' && `Out ${format(new Date(attendance.checkOutAt!), 'h:mm a')}`}
                                      {attendance.status === 'ABSENT' && 'Absent'}
                                      {attendance.status === 'NOT_ARRIVED' && 'Not arrived'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <a
                                        href="tel:"
                                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                        title="Call parent"
                                      >
                                        <PhoneIcon className="h-4 w-4" />
                                      </a>
                                      <a
                                        href="mailto:"
                                        className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                        title="Email parent"
                                      >
                                        <EnvelopeIcon className="h-4 w-4" />
                                      </a>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      {attendance.status !== 'CHECKED_IN' && attendance.status !== 'CHECKED_OUT' && (
                                        <button
                                          onClick={() => handleCheckIn(booking.id)}
                                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 transition-colors"
                                        >
                                          Check In
                                        </button>
                                      )}
                                      {attendance.status === 'CHECKED_IN' && (
                                        <button
                                          onClick={() => handleCheckOut(booking.id)}
                                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 transition-colors"
                                        >
                                          Check Out
                                        </button>
                                      )}
                                      {attendance.status !== 'ABSENT' && (
                                        <button
                                          onClick={() => handleMarkAbsent(booking.id)}
                                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-bold text-xs hover:bg-red-200 transition-colors"
                                        >
                                          Absent
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Event Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Event Title
                            </label>
                            <input
                              type="text"
                              value={event.title}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Capacity
                            </label>
                            <input
                              type="number"
                              value={capacity || ''}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <div className="flex gap-3">
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-semibold shadow-md transition-all"
                          >
                            <PencilIcon className="h-4 w-4" />
                            {isEditing ? 'Save Changes' : 'Edit Event'}
                          </button>
                          <button
                            onClick={exportToICal}
                            className="flex items-center gap-2 px-5 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-semibold shadow-md transition-all"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
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
                            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-semibold shadow-md transition-all"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete Event
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

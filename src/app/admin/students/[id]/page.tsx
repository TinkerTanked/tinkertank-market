'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface Booking {
  id: string
  startDate: string
  endDate: string
  status: string
  totalPrice: string
  product: {
    id: string
    name: string
    type: string
  }
  location: {
    id: string
    name: string
  }
  event: {
    id: string
    title: string
  } | null
}

interface OrderItem {
  id: string
  bookingDate: string
  price: string
  createdAt: string
  order: {
    id: string
    customerEmail: string
    customerName: string
    status: string
    createdAt: string
  }
  product: {
    id: string
    name: string
    type: string
  }
}

interface IgniteSubscription {
  id: string
  igniteSubscription: {
    id: string
    customerEmail: string
    status: string
    weeklyAmount: string
  }
}

interface StudentProfile {
  id: string
  name: string
  birthdate: string
  school: string | null
  allergies: string | null
  medicalNotes: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  createdAt: string
  bookings: Booking[]
  orderItems: OrderItem[]
  igniteSubscriptions: IgniteSubscription[]
  totalSpend: number
  parentContact: {
    name: string
    email: string
    phone: string | null
  } | null
  _count: {
    bookings: number
    orderItems: number
  }
}

function calculateAge(birthdate: string): number {
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(num)
}

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
    case 'PAID':
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED':
    case 'CANCELED':
      return 'bg-red-100 text-red-800'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/admin/students/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Student not found')
          } else {
            setError('Failed to load student')
          }
          return
        }
        const data = await response.json()
        setStudent(data)
      } catch (err) {
        console.error('Error fetching student:', err)
        setError('Failed to load student')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchStudent()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/students"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Students
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error || 'Student not found'}</p>
        </div>
      </div>
    )
  }

  const age = calculateAge(student.birthdate)

  return (
    <div className="space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Students
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Student since {formatDate(student.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(student.totalSpend)}</p>
          <p className="text-sm text-gray-500">Total spend</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Age</dt>
              <dd className="text-sm text-gray-900">{age} years old</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="text-sm text-gray-900">{formatDate(student.birthdate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">School</dt>
              <dd className="text-sm text-gray-900">{student.school || '—'}</dd>
            </div>
            {student.allergies && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-sm font-medium text-red-800">Allergies</dt>
                    <dd className="text-sm text-red-700">{student.allergies}</dd>
                  </div>
                </div>
              </div>
            )}
            {student.medicalNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <dt className="text-sm font-medium text-amber-800">Medical Notes</dt>
                <dd className="text-sm text-amber-700">{student.medicalNotes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

          {/* Parent/Customer Contact from Orders */}
          {student.parentContact && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Parent/Guardian</h3>
              <dl className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <dd className="text-sm text-gray-900">{student.parentContact.name}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                  <dd className="text-sm text-gray-900">
                    <a href={`mailto:${student.parentContact.email}`} className="text-orange-600 hover:text-orange-700">
                      {student.parentContact.email}
                    </a>
                  </dd>
                </div>
                {student.parentContact.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <dd className="text-sm text-gray-900">
                      <a href={`tel:${student.parentContact.phone}`} className="text-orange-600 hover:text-orange-700">
                        {student.parentContact.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Emergency Contact */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>
            {student.emergencyContactName ? (
              <dl className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <dd className="text-sm text-gray-900">{student.emergencyContactName}</dd>
                </div>
                {student.emergencyContactPhone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <dd className="text-sm text-gray-900">
                      <a href={`tel:${student.emergencyContactPhone}`} className="text-orange-600 hover:text-orange-700">
                        {student.emergencyContactPhone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-500 italic">No emergency contact on file</p>
            )}
          </div>

          {!student.parentContact && !student.emergencyContactName && (
            <p className="text-sm text-gray-500 italic">No contact information available</p>
          )}
        </div>

        {/* Subscriptions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscriptions</h2>
          {student.igniteSubscriptions.length > 0 ? (
            <ul className="space-y-3">
              {student.igniteSubscriptions.map((sub) => (
                <li key={sub.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Ignite Subscription</span>
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(sub.igniteSubscription.status))}>
                      {sub.igniteSubscription.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(sub.igniteSubscription.weeklyAmount)}/week
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No active subscriptions</p>
          )}
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Purchase History</h2>
        </div>

        {student.orderItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {student.orderItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-sm text-gray-500">{item.product.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.bookingDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(item.order.status))}>
                        {item.order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            No purchase history found
          </div>
        )}
      </div>

      {/* Bookings */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bookings</h2>
        </div>

        {student.bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {student.bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(booking.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.product.name}</div>
                      <div className="text-sm text-gray-500">{booking.product.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.location.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(booking.status))}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            No bookings found
          </div>
        )}
      </div>
    </div>
  )
}

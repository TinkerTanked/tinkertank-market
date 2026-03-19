'use client'

import { useEffect, useState } from 'react'
import { CalendarDaysIcon, PlusIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface BundleOrder {
  orderId: string
  customerName: string
  customerEmail: string
  studentId: string
  studentName: string
  productId: string
  productName: string
  bookingDates: string[]
}

export default function BundleBookingsPage() {
  const [bundles, setBundles] = useState<BundleOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBundle, setSelectedBundle] = useState<BundleOrder | null>(null)
  const [newDate, setNewDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/bookings/bundles')
      if (!response.ok) throw new Error('Failed to fetch bundles')
      const data = await response.json()
      setBundles(data.bundles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBundles()
  }, [])

  const handleAddDate = async () => {
    if (!selectedBundle || !newDate) return

    setAdding(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/bookings/bundles/${selectedBundle.orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedBundle.studentId,
          productId: selectedBundle.productId,
          bookingDate: newDate
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add booking date')
      }

      setSuccessMessage(`Added booking for ${format(new Date(newDate), 'EEEE, MMMM d, yyyy')}`)
      setNewDate('')
      setSelectedBundle(null)
      await fetchBundles()

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add date')
    } finally {
      setAdding(false)
    }
  }

  const getMissingDatesCount = (bundle: BundleOrder) => 3 - bundle.bookingDates.length

  const getCampTimes = (productName: string) => {
    if (productName.includes('All Day')) {
      return '9:00 AM - 5:00 PM'
    }
    return '9:00 AM - 3:00 PM'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bundle Booking Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage incomplete 3-day bundle bookings</p>
        </div>
        <button
          onClick={fetchBundles}
          className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ) : bundles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Incomplete Bundles</h3>
          <p className="mt-1 text-sm text-gray-500">All 3-day bundle purchases have their booking dates assigned.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bundles.map((bundle) => (
                <tr key={`${bundle.orderId}-${bundle.studentId}-${bundle.productId}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bundle.customerName}</div>
                    <div className="text-sm text-gray-500">{bundle.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{bundle.studentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bundle.productName}</div>
                    <div className="text-xs text-gray-500">{getCampTimes(bundle.productName)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {bundle.bookingDates.length > 0 ? (
                        bundle.bookingDates.map((date, idx) => (
                          <div key={idx} className="text-sm text-gray-900">
                            {format(new Date(date), 'EEE, MMM d, yyyy')}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">No dates assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {getMissingDatesCount(bundle)} date{getMissingDatesCount(bundle) > 1 ? 's' : ''} missing
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedBundle(bundle)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Date
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedBundle && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Booking Date</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Student:</span> {selectedBundle.studentName}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Product:</span> {selectedBundle.productName}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Time:</span> {getCampTimes(selectedBundle.productName)}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Location:</span> TinkerTank Neutral Bay
                </p>
              </div>

              {selectedBundle.bookingDates.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Existing dates:</p>
                  <ul className="text-sm text-gray-500 list-disc list-inside">
                    {selectedBundle.bookingDates.map((date, idx) => (
                      <li key={idx}>{format(new Date(date), 'EEEE, MMMM d, yyyy')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label htmlFor="newDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Select new date
                </label>
                <input
                  type="date"
                  id="newDate"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedBundle(null)
                  setNewDate('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDate}
                disabled={!newDate || adding}
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : 'Add Date'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

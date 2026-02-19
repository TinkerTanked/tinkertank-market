'use client'

import { useEffect, useState } from 'react'
import { FireIcon, UserGroupIcon, CurrencyDollarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface IgniteSubscription {
  id: string
  stripeSubscriptionId: string
  customerEmail: string
  customerName: string | null
  status: 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'
  weeklyAmount: number
  currentPeriodEnd: string
  sessionName: string
  sessionLocation: string
  sessionDays: string[]
  sessionTime: string
  cancelAtPeriodEnd: boolean
}

interface SubscriptionStats {
  active: number
  paused: number
  canceled: number
  weeklyRevenue: number
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELED: 'bg-red-100 text-red-800',
  PAST_DUE: 'bg-orange-100 text-orange-800',
  TRIALING: 'bg-blue-100 text-blue-800',
}

export default function IgniteSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<IgniteSubscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const response = await fetch(`/api/admin/ignite-subscriptions${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [filter])

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FireIcon className="h-8 w-8 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Ignite Subscriptions</h1>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowPathIcon className={clsx('h-5 w-5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paused</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paused}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Canceled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.canceled}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Weekly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.weeklyRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CANCELED">Canceled</option>
              <option value="PAST_DUE">Past Due</option>
            </select>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FireIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No subscriptions found</p>
            <p className="text-sm mt-1">
              Run <code className="bg-gray-100 px-2 py-1 rounded">npx tsx scripts/sync-stripe-subscriptions.ts</code> to sync from Stripe
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sub.customerName || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{sub.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sub.sessionName}</div>
                      <div className="text-sm text-gray-500">
                        {sub.sessionLocation} • {sub.sessionDays.join(', ')} {sub.sessionTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', statusColors[sub.status])}>
                        {sub.status}
                      </span>
                      {sub.cancelAtPeriodEnd && (
                        <span className="ml-2 text-xs text-red-500">Canceling</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${sub.weeklyAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

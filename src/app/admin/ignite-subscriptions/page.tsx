'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { ArrowPathIcon, ChevronRightIcon, FireIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { AdminSubscriptionView } from '@/lib/adminCustomers'
import SubscriptionBillingSheet, {
  formatDate,
  formatSessionTime,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/components/admin/SubscriptionBillingSheet'

interface SubscriptionStats {
  active: number
  paused: number
  canceled: number
  weeklyRevenue: number
}

const customerHref = (email: string) => `/admin/customers/${encodeURIComponent(email.trim().toLowerCase())}`

export default function IgniteSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionView[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('ACTIVE')
  const [sessionId, setSessionId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [billingSubscription, setBillingSubscription] = useState<AdminSubscriptionView | null>(null)

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ignite-subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
        setStats(data.stats)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const sessions = useMemo(() => {
    const map = new Map<string, string>()
    for (const sub of subscriptions) if (sub.sessionId) map.set(sub.sessionId, `${sub.sessionLocation} · ${formatSessionTime(sub)}`)
    return [...map].sort((a, b) => a[1].localeCompare(b[1]))
  }, [subscriptions])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return subscriptions.filter(
      sub =>
        (!status || sub.status === status) &&
        (!sessionId || sub.sessionId === sessionId) &&
        (!query ||
          (sub.customerName || '').toLowerCase().includes(query) ||
          sub.customerEmail.toLowerCase().includes(query) ||
          sub.students.some(student => student.name.toLowerCase().includes(query)))
    )
  }, [subscriptions, status, sessionId, search])

  const statusTabs: { value: string; label: string; count?: number }[] = [
    { value: 'ACTIVE', label: 'Active', count: stats?.active },
    { value: 'PAUSED', label: 'Paused', count: stats?.paused },
    { value: 'PAST_DUE', label: 'Unpaid', count: subscriptions.filter(sub => sub.status === 'PAST_DUE').length },
    { value: 'CANCELED', label: 'Cancelled', count: stats?.canceled },
    { value: '', label: 'All', count: subscriptions.length },
  ]

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 sm:text-2xl'>Ignite subscriptions</h1>
          {stats && (
            <p className='text-sm text-gray-500'>
              ${stats.weeklyRevenue.toFixed(2)} weekly from {stats.active} active
            </p>
          )}
        </div>
        <button
          onClick={fetchSubscriptions}
          className='rounded-lg border border-gray-300 bg-white p-2.5 text-gray-600 hover:bg-gray-50'
          aria-label='Refresh'
        >
          <ArrowPathIcon className={clsx('h-5 w-5', loading && 'animate-spin')} />
        </button>
      </div>

      <div className='-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0'>
        {statusTabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setStatus(tab.value)}
            className={clsx(
              'flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium',
              status === tab.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className='ml-1.5 opacity-70'>{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className='grid gap-2 sm:grid-cols-2'>
        <label className='relative block'>
          <span className='sr-only'>Search</span>
          <MagnifyingGlassIcon className='pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-400' />
          <input
            type='search'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search parent, email or child'
            className='h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500'
          />
        </label>
        <select
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          className='h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-base'
          aria-label='Session'
        >
          <option value=''>All sessions</option>
          {sessions.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading && subscriptions.length === 0 ? (
        <div className='flex h-40 items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600' />
        </div>
      ) : visible.length === 0 ? (
        <div className='rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500'>
          <FireIcon className='mx-auto mb-3 h-10 w-10 text-gray-300' />
          No subscriptions match.
        </div>
      ) : (
        <ul className='divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white'>
          {visible.map(sub => (
            <li key={sub.id} className='flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-6'>
              <div className='min-w-0 flex-1'>
                <Link href={customerHref(sub.customerEmail)} className='group flex items-start gap-2'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-base font-semibold text-gray-900 group-hover:text-orange-700'>
                        {sub.customerName || sub.customerEmail}
                      </span>
                      <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[sub.status])}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                      {sub.status === 'PAUSED' && sub.pauseResumesAt && (
                        <span className='text-xs text-gray-500'>until {formatDate(sub.pauseResumesAt)}</span>
                      )}
                      {sub.cancelAt && sub.status !== 'CANCELED' && (
                        <span className='rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700'>
                          Ends {formatDate(sub.cancelAt)}
                        </span>
                      )}
                    </div>
                    <div className='mt-1 text-sm text-gray-700'>
                      {sub.sessionLocation} · {formatSessionTime(sub)}
                    </div>
                  </div>
                  <ChevronRightIcon className='mt-1 h-5 w-5 flex-shrink-0 text-gray-400 lg:hidden' />
                </Link>
                <div className='mt-2 flex flex-wrap gap-1.5'>
                  {sub.students.length > 0 ? (
                    sub.students.map(student => (
                      <Link
                        key={student.id}
                        href={`/admin/students/${student.id}`}
                        className='inline-flex h-8 items-center rounded-full border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-800 hover:border-orange-300 hover:text-orange-700'
                      >
                        {student.name}
                      </Link>
                    ))
                  ) : (
                    <span className='text-sm italic text-gray-400'>No child linked</span>
                  )}
                </div>
              </div>
              <div className='flex items-center justify-between gap-3 lg:justify-end'>
                <div className='text-sm lg:text-right'>
                  <div className='font-semibold text-gray-900'>${sub.weeklyAmount.toFixed(2)}/wk</div>
                  {(sub.status === 'ACTIVE' || sub.status === 'TRIALING') &&
                    sub.currentPeriodEnd &&
                    new Date(sub.currentPeriodEnd) > new Date() && (
                      <div className='text-gray-500'>Next bill {formatDate(sub.currentPeriodEnd)}</div>
                    )}
                </div>
                <button
                  onClick={() => setBillingSubscription(sub)}
                  className='inline-flex h-11 items-center rounded-xl bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800'
                >
                  Billing
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {billingSubscription && (
        <SubscriptionBillingSheet
          subscription={billingSubscription}
          onClose={() => setBillingSubscription(null)}
          onDone={updated => {
            setSubscriptions(subs => subs.map(sub => (sub.id === billingSubscription.id ? { ...sub, ...updated } : sub)))
            setBillingSubscription(null)
          }}
        />
      )}
    </div>
  )
}

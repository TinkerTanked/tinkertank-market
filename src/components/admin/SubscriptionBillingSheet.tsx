'use client'

import { useEffect, useState } from 'react'
import { ArrowUturnLeftIcon, NoSymbolIcon, PauseIcon, PlayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { AdminSubscriptionView } from '@/lib/adminCustomers'

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELED: 'bg-red-100 text-red-800',
  PAST_DUE: 'bg-orange-100 text-orange-800',
  TRIALING: 'bg-blue-100 text-blue-800',
}

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELED: 'Cancelled',
  PAST_DUE: 'Unpaid',
  TRIALING: 'Starting',
}

export function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' })
    : ''
}

function to12Hour(time: string) {
  const [hours, minutes] = time.trim().split(':').map(Number)
  if (Number.isNaN(hours)) return time
  return `${hours % 12 || 12}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}${hours >= 12 ? 'pm' : 'am'}`
}

export function formatSessionTime(sub: Pick<AdminSubscriptionView, 'sessionDays' | 'sessionTime'>) {
  const days = sub.sessionDays.length === 5 ? ['Mon–Fri'] : sub.sessionDays.map(day => day[0].toUpperCase() + day.slice(1, 3))
  const time = sub.sessionTime ? sub.sessionTime.split('-').map(to12Hour).join('–') : ''
  return [days.join(', '), time].filter(Boolean).join(' · ')
}

type BillingRequest = { action: 'pause'; resumesAt: string } | { action: 'resume' | 'cancel' | 'undo-cancel' }

export default function SubscriptionBillingSheet({
  subscription,
  onClose,
  onDone,
}: {
  subscription: AdminSubscriptionView
  onClose: () => void
  onDone: (updated: Partial<AdminSubscriptionView>) => void
}) {
  const [resumesAt, setResumesAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const paused = subscription.status === 'PAUSED'
  const ended = subscription.status === 'CANCELED'
  const canceling = !!subscription.cancelAt && !ended

  useEffect(() => {
    fetch('/api/admin/ignite-subscriptions/next-term')
      .then(response => response.json())
      .then(data => data.resumesAt && setResumesAt(data.resumesAt))
      .catch(() => undefined)
  }, [])

  const run = async (request: BillingRequest, confirmText: string) => {
    if (!window.confirm(confirmText)) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/ignite-subscriptions/${subscription.id}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Update failed')
      onDone(data.subscription)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const name = subscription.customerName || subscription.customerEmail
  const weekly = `$${subscription.weeklyAmount.toFixed(2)}/week`

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4' role='dialog' aria-modal='true'>
      <div className='w-full max-w-md rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl sm:rounded-2xl'>
        <div className='flex items-start justify-between border-b p-5'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Manage billing</h2>
            <p className='mt-0.5 text-sm text-gray-500'>
              {name} · {subscription.sessionName}
            </p>
          </div>
          <button onClick={onClose} className='-mr-2 rounded-full p-2 text-gray-400 hover:text-gray-600' aria-label='Close'>
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        <div className='space-y-4 p-5'>
          {ended ? (
            <p className='text-sm text-gray-600'>This subscription has ended. The family can re-enrol from the website.</p>
          ) : (
            <>
              {paused ? (
                <button
                  disabled={busy}
                  onClick={() => run({ action: 'resume' }, `Resume billing for ${name} now at ${weekly}?`)}
                  className='flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-base font-semibold text-white disabled:opacity-50'
                >
                  <PlayIcon className='h-5 w-5' /> Resume billing now
                </button>
              ) : (
                <div className='space-y-2 rounded-xl border border-gray-200 p-4'>
                  <label className='block text-sm font-medium text-gray-700' htmlFor='resumesAt'>
                    Pause until
                  </label>
                  <input
                    id='resumesAt'
                    type='date'
                    value={resumesAt}
                    onChange={e => setResumesAt(e.target.value)}
                    className='h-12 w-full rounded-xl border border-gray-300 px-3 text-base'
                  />
                  <p className='text-xs text-gray-500'>No invoices are created while paused. Defaults to the first day of next term.</p>
                  <button
                    disabled={busy || !resumesAt}
                    onClick={() =>
                      run(
                        { action: 'pause', resumesAt },
                        `Pause billing for ${name} until ${resumesAt}? No invoices will be created until then.`
                      )
                    }
                    className='flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-base font-semibold text-white disabled:opacity-50'
                  >
                    <PauseIcon className='h-5 w-5' /> Pause billing
                  </button>
                </div>
              )}

              {canceling ? (
                <div className='space-y-2 rounded-xl border border-red-200 bg-red-50 p-4'>
                  <p className='text-sm text-red-800'>Ends {formatDate(subscription.cancelAt)}.</p>
                  <button
                    disabled={busy}
                    onClick={() => run({ action: 'undo-cancel' }, `Keep ${name}'s subscription going?`)}
                    className='flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-base font-semibold text-gray-800 disabled:opacity-50'
                  >
                    <ArrowUturnLeftIcon className='h-5 w-5' /> Undo cancellation
                  </button>
                </div>
              ) : (
                <div className='space-y-2'>
                  <button
                    disabled={busy}
                    onClick={() =>
                      run(
                        { action: 'cancel' },
                        `Cancel ${name}'s subscription with two weeks' notice? They will be charged for the current week and next week (${weekly}), then it ends.`
                      )
                    }
                    className='flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-base font-semibold text-red-700 disabled:opacity-50'
                  >
                    <NoSymbolIcon className='h-5 w-5' /> Cancel with 2 weeks&apos; notice
                  </button>
                  <p className='text-xs text-gray-500'>Charges the current week and next week, then stops.</p>
                </div>
              )}
            </>
          )}
          {error && <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p>}
        </div>
      </div>
    </div>
  )
}

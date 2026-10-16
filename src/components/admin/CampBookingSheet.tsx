'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { ArrowsRightLeftIcon, CheckCircleIcon, TicketIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getLocationAvailability, isDateKeyAvailableForLocation, LOCATION_AVAILABILITY } from '@/data/locationAvailability'

export interface ManagedCampDay {
  id: string
  studentName: string
  productName: string
  dateKey: string
  locationName: string
  price: number
}

interface DateAvailability {
  date: string
  bookings: number
  capacity: number | null
}

function prettyDate(dateKey: string, withYear = false) {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  })
}

function sydneyToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
}

/** Super admin: move a camp day (free) or cancel it for a one-year credit (no refunds). */
export default function CampBookingSheet({
  booking,
  onClose,
  onDone,
}: {
  booking: ManagedCampDay
  onClose: () => void
  onDone: () => void
}) {
  const [mode, setMode] = useState<'move' | 'credit'>('move')
  const [locationId, setLocationId] = useState(
    () => getLocationAvailability(booking.locationName)?.locationId ?? LOCATION_AVAILABILITY[0].locationId
  )
  const [dateKey, setDateKey] = useState('')
  const [availability, setAvailability] = useState<{ capacity: number | null; dates: DateAvailability[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ title: string; detail: string } | null>(null)

  const camp = LOCATION_AVAILABILITY.find(location => location.locationId === locationId)!
  const today = sydneyToday()
  const allDayBlocked = booking.productName.toLowerCase().includes('all day') && !camp.availableCampTypes.includes('allday')
  const isCurrent = (key: string) => key === booking.dateKey && getLocationAvailability(booking.locationName)?.locationId === locationId

  useEffect(() => {
    setAvailability(null)
    setDateKey('')
    fetch(`/api/availability?locationId=${locationId}`)
      .then(response => response.json())
      .then(data => setAvailability({ capacity: data.dailyCapacity ?? null, dates: data.dates || [] }))
      .catch(() => setAvailability({ capacity: null, dates: [] }))
  }, [locationId])

  const placesLeft = (key: string) => {
    const capacity = availability?.capacity
    if (capacity == null) return null
    const booked = availability?.dates.find(date => date.date === key)?.bookings ?? 0
    return Math.max(0, capacity - booked)
  }

  const fixedDates = (camp.availableDates ?? []).filter(key => key >= today && !isCurrent(key))
  const left = dateKey ? placesLeft(dateKey) : null
  const running = dateKey ? isDateKeyAvailableForLocation(dateKey, camp.locationName) : true
  const canMove = !!dateKey && dateKey >= today && running && left !== 0 && !allDayBlocked && !isCurrent(dateKey)

  const post = async (path: string, body?: object) => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Something went wrong')
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return null
    } finally {
      setBusy(false)
    }
  }

  const move = async () => {
    const data = await post('move', { date: dateKey, locationId })
    if (data) {
      setResult({
        title: `Moved to ${prettyDate(dateKey, true)}`,
        detail: `${camp.locationName}. ${data.emailSent ? 'The parent has been emailed.' : 'The confirmation email could not be sent; let the parent know.'}`,
      })
    }
  }

  const credit = async () => {
    if (
      !window.confirm(
        `Cancel ${booking.studentName}'s camp day on ${prettyDate(booking.dateKey, true)} and issue a $${booking.price.toFixed(2)} credit? This cannot be undone.`
      )
    )
      return
    const data = await post('credit')
    if (data) {
      const expires = new Date(data.credit.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
      setResult({
        title: `Credit ${data.credit.code} issued`,
        detail: `$${data.credit.amount.toFixed(2)}, one use, valid until ${expires}. ${data.emailSent ? `Emailed to ${data.credit.customerEmail}.` : 'The email could not be sent; give the parent this code.'}`,
      })
    }
  }

  const tab = (active: boolean) =>
    clsx(
      'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold',
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
    )

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4'
      role='dialog'
      aria-modal='true'
      aria-label='Manage camp day'
    >
      <div className='max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl sm:rounded-2xl'>
        <div className='flex items-start justify-between border-b p-5'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>{booking.studentName}</h2>
            <p className='mt-0.5 text-sm text-gray-500'>
              {booking.productName} · {prettyDate(booking.dateKey, true)} · {booking.locationName}
            </p>
          </div>
          <button
            onClick={result ? onDone : onClose}
            className='-mr-2 rounded-full p-2 text-gray-400 hover:text-gray-600'
            aria-label='Close'
          >
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        {result ? (
          <div className='space-y-4 p-5 text-center'>
            <CheckCircleIcon className='mx-auto h-12 w-12 text-green-600' />
            <div>
              <p className='text-lg font-semibold text-gray-900'>{result.title}</p>
              <p className='mt-1 text-sm text-gray-600'>{result.detail}</p>
            </div>
            <button onClick={onDone} className='min-h-[52px] w-full rounded-xl bg-gray-900 text-base font-semibold text-white'>
              Done
            </button>
          </div>
        ) : (
          <div className='space-y-4 p-5'>
            <div className='flex gap-1 rounded-xl bg-gray-100 p-1'>
              <button className={tab(mode === 'move')} onClick={() => setMode('move')}>
                <ArrowsRightLeftIcon className='h-4 w-4' /> Move day
              </button>
              <button className={tab(mode === 'credit')} onClick={() => setMode('credit')}>
                <TicketIcon className='h-4 w-4' /> Cancel for credit
              </button>
            </div>

            {mode === 'move' ? (
              <>
                <div className='grid grid-cols-2 gap-2'>
                  {LOCATION_AVAILABILITY.map(location => (
                    <button
                      key={location.locationId}
                      onClick={() => setLocationId(location.locationId)}
                      className={clsx(
                        'min-h-[48px] rounded-xl border px-3 text-sm font-medium',
                        location.locationId === locationId
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 bg-white text-gray-700'
                      )}
                    >
                      {location.locationName.replace(/^TinkerTank /, '')}
                    </button>
                  ))}
                </div>

                {camp.availableDates ? (
                  fixedDates.length === 0 ? (
                    <p className='rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-600'>No upcoming camp days at {camp.locationName}.</p>
                  ) : (
                    <div className='grid grid-cols-2 gap-2'>
                      {fixedDates.map(key => {
                        const spots = placesLeft(key)
                        return (
                          <button
                            key={key}
                            disabled={spots === 0}
                            onClick={() => setDateKey(key)}
                            className={clsx(
                              'rounded-xl border px-3 py-2.5 text-left disabled:opacity-40',
                              key === dateKey ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-300 bg-white'
                            )}
                          >
                            <div className='text-sm font-semibold text-gray-900'>{prettyDate(key)}</div>
                            <div className='text-xs text-gray-500'>{spots === null ? '…' : spots === 0 ? 'Full' : `${spots} left`}</div>
                          </button>
                        )
                      })}
                    </div>
                  )
                ) : (
                  <label className='block space-y-1.5'>
                    <span className='text-sm font-medium text-gray-700'>New date</span>
                    <input
                      type='date'
                      min={today}
                      value={dateKey}
                      onChange={e => setDateKey(e.target.value)}
                      className='h-12 w-full rounded-xl border border-gray-300 px-3 text-base'
                    />
                    {dateKey && (
                      <span
                        className={clsx('block text-sm', running && left !== 0 && !isCurrent(dateKey) ? 'text-green-700' : 'text-red-700')}
                      >
                        {isCurrent(dateKey)
                          ? 'That is the current booking.'
                          : !running
                            ? `${camp.locationName} has no camp that day.`
                            : left === 0
                              ? 'Full that day.'
                              : left === null
                                ? 'Checking places…'
                                : `${left} place${left === 1 ? '' : 's'} left`}
                      </span>
                    )}
                  </label>
                )}

                {allDayBlocked && (
                  <p className='rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800'>{camp.locationName} only runs Day Camp.</p>
                )}

                <button
                  disabled={!canMove || busy}
                  onClick={move}
                  className='min-h-[52px] w-full rounded-xl bg-orange-600 px-4 text-base font-semibold text-white disabled:opacity-40'
                >
                  {busy ? 'Moving…' : dateKey && canMove ? `Move to ${prettyDate(dateKey)}` : 'Choose a day'}
                </button>
                <p className='text-center text-xs text-gray-500'>Free. The parent is emailed the new day.</p>
              </>
            ) : (
              <>
                <div className='rounded-xl border border-gray-200 p-4 text-sm text-gray-700'>
                  <p>
                    Cancels this day and emails the parent a <strong>${booking.price.toFixed(2)}</strong> credit code.
                  </p>
                  <p className='mt-2 text-gray-500'>One use on any camp or party, valid for 1 year. No refund is made.</p>
                </div>
                <button
                  disabled={busy}
                  onClick={credit}
                  className='min-h-[52px] w-full rounded-xl border border-red-300 bg-white px-4 text-base font-semibold text-red-700 disabled:opacity-40'
                >
                  {busy ? 'Working…' : 'Cancel day and issue credit'}
                </button>
              </>
            )}

            {error && <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

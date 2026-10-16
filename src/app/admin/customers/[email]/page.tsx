'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { clsx } from 'clsx'
import { ArrowLeftIcon, EnvelopeIcon, ExclamationTriangleIcon, PhoneIcon } from '@heroicons/react/24/outline'
import type { AdminSubscriptionView } from '@/lib/adminCustomers'
import SubscriptionBillingSheet, {
  formatDate,
  formatSessionTime,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/components/admin/SubscriptionBillingSheet'
import CampBookingSheet, { type ManagedCampDay } from '@/components/admin/CampBookingSheet'

interface CustomerBooking {
  id: string
  dateKey: string
  productName: string
  productType: 'CAMP' | 'BIRTHDAY'
  locationName: string
  status: string
  studentId: string
  studentName: string
  price: number
  checkedIn: boolean
  creditCode: string | null
}

interface CustomerDetail {
  customer: { email: string; name: string; phone: string | null; emergencyContactName: string | null; emergencyContactPhone: string | null }
  totals: { orders: number; spent: number }
  students: { id: string; name: string; birthdate: string; school: string | null; allergies: string | null; medicalNotes: string | null }[]
  subscriptions: AdminSubscriptionView[]
  bookings: CustomerBooking[]
  credits: { code: string; amount: number; expiresAt: string; redeemedAt: string | null; createdAt: string }[]
}

const BOOKING_STATUS: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

function age(birthdate: string) {
  const born = new Date(birthdate)
  const now = new Date()
  return now.getFullYear() - born.getFullYear() - (now < new Date(now.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0)
}

function hasNote(value: string | null) {
  return !!value && !/^(n\/?a|none|nil|no)$/i.test(value.trim())
}

function campDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
      <div className='flex items-center justify-between border-b border-gray-100 px-4 py-3'>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function CustomerPage() {
  const email = decodeURIComponent(String(useParams().email || ''))
  const [data, setData] = useState<CustomerDetail | null>(null)
  const [error, setError] = useState('')
  const [billing, setBilling] = useState<AdminSubscriptionView | null>(null)
  const [managing, setManaging] = useState<ManagedCampDay | null>(null)
  const [showPast, setShowPast] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/admin/customers/${encodeURIComponent(email)}`)
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Failed to load customer')
        setData(body)
      })
      .catch(err => setError(err.message))
  }, [email])

  useEffect(load, [load])

  if (error) {
    return <div className='rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800'>{error}</div>
  }
  if (!data) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600' />
      </div>
    )
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
  const upcoming = data.bookings.filter(booking => booking.dateKey >= today && booking.status !== 'CANCELLED').reverse()
  const past = data.bookings.filter(booking => booking.dateKey < today || booking.status === 'CANCELLED')
  const activeSubscriptions = data.subscriptions.filter(sub => sub.status === 'ACTIVE' || sub.status === 'TRIALING').length

  const bookingRow = (booking: CustomerBooking, manageable: boolean) => (
    <li key={booking.id} className='flex items-center gap-3 px-4 py-3'>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-semibold text-gray-900'>{campDate(booking.dateKey)}</span>
          <span
            className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', BOOKING_STATUS[booking.status] || 'bg-gray-100 text-gray-600')}
          >
            {booking.creditCode ? `Credited ${booking.creditCode}` : booking.status.toLowerCase()}
          </span>
        </div>
        <div className='mt-0.5 truncate text-sm text-gray-600'>
          <Link href={`/admin/students/${booking.studentId}`} className='font-medium text-gray-800 hover:text-orange-700'>
            {booking.studentName}
          </Link>
          {` · ${booking.productName} · ${booking.locationName}`}
        </div>
      </div>
      {manageable && booking.productType === 'CAMP' && booking.status === 'CONFIRMED' && !booking.checkedIn && (
        <button
          onClick={() =>
            setManaging({
              id: booking.id,
              studentName: booking.studentName,
              productName: booking.productName,
              dateKey: booking.dateKey,
              locationName: booking.locationName,
              price: booking.price,
            })
          }
          className='inline-flex h-10 flex-shrink-0 items-center rounded-xl border border-gray-300 bg-white px-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50'
        >
          Manage
        </button>
      )}
    </li>
  )

  return (
    <div className='space-y-4 sm:space-y-6'>
      <Link href='/admin/customers' className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700'>
        <ArrowLeftIcon className='mr-1 h-4 w-4' /> Customers
      </Link>

      <div className='space-y-3'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 sm:text-2xl'>{data.customer.name}</h1>
          <p className='text-sm text-gray-500'>
            {data.students.length} {data.students.length === 1 ? 'child' : 'children'} · {activeSubscriptions} active Ignite · $
            {data.totals.spent.toFixed(2)} across {data.totals.orders} order{data.totals.orders === 1 ? '' : 's'}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {data.customer.phone && (
            <a
              href={`tel:${data.customer.phone.replace(/[^\d+]/g, '')}`}
              className='inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800'
            >
              <PhoneIcon className='h-4 w-4' /> {data.customer.phone}
            </a>
          )}
          <a
            href={`mailto:${data.customer.email}`}
            className='inline-flex h-11 max-w-full items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800'
          >
            <EnvelopeIcon className='h-4 w-4 flex-shrink-0' /> <span className='truncate'>{data.customer.email}</span>
          </a>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-2 lg:gap-6'>
        <Section title='Children'>
          <ul className='divide-y divide-gray-100'>
            {data.students.map(student => (
              <li key={student.id} className='flex items-start'>
                <Link href={`/admin/students/${student.id}`} className='block min-w-0 flex-1 px-4 py-3 hover:bg-gray-50'>
                  <div className='text-base font-semibold text-gray-900'>{student.name}</div>
                  <div className='text-sm text-gray-500'>
                    {age(student.birthdate)} years{student.school ? ` · ${student.school}` : ''}
                  </div>
                  {(hasNote(student.allergies) || hasNote(student.medicalNotes)) && (
                    <div className='mt-1.5 flex items-start gap-1.5 text-sm text-amber-800'>
                      <ExclamationTriangleIcon className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600' />
                      {[hasNote(student.allergies) && student.allergies, hasNote(student.medicalNotes) && student.medicalNotes]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                </Link>
                <Link
                  href={`/admin/bookings/new?studentId=${student.id}`}
                  className='m-3 flex-shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  Add booking
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title='Ignite'>
          {data.subscriptions.length === 0 ? (
            <p className='px-4 py-6 text-sm text-gray-500'>No Ignite subscriptions.</p>
          ) : (
            <ul className='divide-y divide-gray-100'>
              {data.subscriptions.map(sub => (
                <li key={sub.id} className='flex items-center gap-3 px-4 py-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm font-semibold text-gray-900'>{sub.sessionLocation}</span>
                      <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[sub.status])}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                      {sub.cancelAt && sub.status !== 'CANCELED' && (
                        <span className='rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700'>
                          Ends {formatDate(sub.cancelAt)}
                        </span>
                      )}
                    </div>
                    <div className='mt-0.5 text-sm text-gray-600'>
                      {formatSessionTime(sub)} · ${sub.weeklyAmount.toFixed(2)}/wk
                    </div>
                    <div className='mt-0.5 text-xs text-gray-500'>
                      {sub.students.map(student => student.name).join(', ') || 'No child linked'}
                      {sub.status === 'PAUSED' && sub.pauseResumesAt && ` · Paused until ${formatDate(sub.pauseResumesAt)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => setBilling(sub)}
                    className='inline-flex h-10 flex-shrink-0 items-center rounded-xl bg-gray-900 px-3.5 text-sm font-medium text-white hover:bg-gray-800'
                  >
                    Billing
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title='Camps & parties'>
        {upcoming.length === 0 ? (
          <p className='px-4 py-6 text-sm text-gray-500'>Nothing booked ahead.</p>
        ) : (
          <ul className='divide-y divide-gray-100'>{upcoming.map(booking => bookingRow(booking, true))}</ul>
        )}
        {past.length > 0 && (
          <div className='border-t border-gray-100'>
            <button onClick={() => setShowPast(open => !open)} className='w-full px-4 py-3 text-left text-sm font-medium text-orange-700'>
              {showPast ? 'Hide' : 'Show'} past and cancelled ({past.length})
            </button>
            {showPast && <ul className='divide-y divide-gray-100 bg-gray-50/60'>{past.map(booking => bookingRow(booking, false))}</ul>}
          </div>
        )}
      </Section>

      {data.credits.length > 0 && (
        <Section title='Camp credits'>
          <ul className='divide-y divide-gray-100'>
            {data.credits.map(credit => {
              const expired = !credit.redeemedAt && new Date(credit.expiresAt) < new Date()
              return (
                <li key={credit.code} className='flex items-center justify-between gap-3 px-4 py-3'>
                  <div>
                    <div className='font-mono text-sm font-semibold text-gray-900'>{credit.code}</div>
                    <div className='text-xs text-gray-500'>Issued {formatDate(credit.createdAt)}</div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-semibold text-gray-900'>${credit.amount.toFixed(2)}</div>
                    <div className={clsx('text-xs', credit.redeemedAt ? 'text-gray-500' : expired ? 'text-red-600' : 'text-green-700')}>
                      {credit.redeemedAt
                        ? `Used ${formatDate(credit.redeemedAt)}`
                        : expired
                          ? 'Expired'
                          : `Until ${formatDate(credit.expiresAt)}`}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      {billing && (
        <SubscriptionBillingSheet
          subscription={billing}
          onClose={() => setBilling(null)}
          onDone={() => {
            setBilling(null)
            load()
          }}
        />
      )}
      {managing && (
        <CampBookingSheet
          booking={managing}
          onClose={() => setManaging(null)}
          onDone={() => {
            setManaging(null)
            load()
          }}
        />
      )}
    </div>
  )
}

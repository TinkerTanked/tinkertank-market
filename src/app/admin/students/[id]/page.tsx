'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { ArrowLeftIcon, ChevronRightIcon, EnvelopeIcon, ExclamationTriangleIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline'
import type { AdminSubscriptionView } from '@/lib/adminCustomers'
import { useAdminRole } from '@/components/admin/AdminRole'
import SubscriptionBillingSheet, {
  formatDate as formatSydneyDate,
  formatSessionTime,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/components/admin/SubscriptionBillingSheet'
import CampBookingSheet, { type ManagedCampDay } from '@/components/admin/CampBookingSheet'

interface StudentBooking {
  id: string
  dateKey: string
  status: string
  productName: string
  productType: 'CAMP' | 'BIRTHDAY' | 'SUBSCRIPTION'
  locationName: string
  checkedIn: boolean
  creditCode: string | null
  price?: number
}

interface GroupedOrder {
  orderId: string
  orderDate: string
  status: string
  productName: string
  productType: string
  bookingDates: string[]
  totalPrice: number
}

interface StudentProfile {
  id: string
  name: string
  birthdate: string
  birthdateEstimated: boolean
  school: string | null
  allergies: string | null
  medicalNotes: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  createdAt: string
  totalAttendanceMinutes: number
  parentContact: { name: string; email: string; phone: string | null } | null
  bookings: StudentBooking[]
  subscriptions: (Omit<AdminSubscriptionView, 'weeklyAmount'> & { weeklyAmount?: number })[]
  // Super admin only
  totalSpend?: number
  groupedOrders?: GroupedOrder[]
}

function calculateAge(birthdate: string): number {
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateKey(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount)
}

function formatHours(minutes: number): string {
  if (!minutes) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function hasNote(value: string | null) {
  return !!value && !/^(n\/?a|none|nil|no)$/i.test(value.trim())
}

const BOOKING_STATUS: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

const TYPE_LABEL: Record<string, string> = { CAMP: 'Camp', BIRTHDAY: 'Party', SUBSCRIPTION: 'Ignite' }

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx('overflow-hidden rounded-xl border border-gray-200 bg-white', className)}>
      <h2 className='border-b border-gray-100 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500'>{title}</h2>
      {children}
    </section>
  )
}

export default function StudentProfilePage() {
  const params = useParams()
  const isSuper = useAdminRole() === 'super'
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const [billing, setBilling] = useState<AdminSubscriptionView | null>(null)
  const [managing, setManaging] = useState<ManagedCampDay | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/students/${params.id}`)
      if (!response.ok) {
        setError(response.status === 404 ? 'Student not found' : 'Failed to load student')
        return
      }
      setStudent(await response.json())
    } catch {
      setError('Failed to load student')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) load()
  }, [params.id, load])

  if (loading) {
    return (
      <div className='flex justify-center py-12'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600' />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className='space-y-6'>
        <Link href='/admin/students' className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700'>
          <ArrowLeftIcon className='mr-1 h-4 w-4' /> Students
        </Link>
        <div className='rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800'>{error || 'Student not found'}</div>
      </div>
    )
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
  const upcoming = student.bookings.filter(booking => booking.dateKey >= today && booking.status !== 'CANCELLED').reverse()
  const past = student.bookings.filter(booking => booking.dateKey < today || booking.status === 'CANCELLED')
  const attended = student.bookings.filter(booking => booking.checkedIn).length
  // Camp and party days are always shown (they can be managed); weekly Ignite
  // sessions collapse to the next few.
  let igniteShown = 0
  const upcomingPreview = upcoming.filter(booking => booking.productType !== 'SUBSCRIPTION' || igniteShown++ < 4)

  const bookingRow = (booking: StudentBooking, manageable: boolean) => (
    <li key={booking.id} className='flex items-center gap-3 px-4 py-3'>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <Link href={`/admin/schedule?date=${booking.dateKey}`} className='text-sm font-semibold text-gray-900 hover:text-orange-700'>
            {formatDateKey(booking.dateKey)}
          </Link>
          <span
            className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', BOOKING_STATUS[booking.status] || 'bg-gray-100 text-gray-600')}
          >
            {booking.creditCode ? `Credited ${booking.creditCode}` : booking.checkedIn ? 'attended' : booking.status.toLowerCase()}
          </span>
        </div>
        <div className='mt-0.5 truncate text-sm text-gray-600'>
          {booking.productType === 'SUBSCRIPTION'
            ? 'Ignite'
            : `${TYPE_LABEL[booking.productType] ?? booking.productType} · ${booking.productName}`}{' '}
          · {booking.locationName}
        </div>
      </div>
      {isSuper && manageable && booking.productType === 'CAMP' && booking.status === 'CONFIRMED' && !booking.checkedIn && (
        <button
          onClick={() =>
            setManaging({
              id: booking.id,
              studentName: student.name,
              productName: booking.productName,
              dateKey: booking.dateKey,
              locationName: booking.locationName,
              price: booking.price ?? 0,
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
      <Link href='/admin/students' className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700'>
        <ArrowLeftIcon className='mr-1 h-4 w-4' /> Students
      </Link>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 sm:text-2xl'>{student.name}</h1>
          <p className='mt-1 text-sm text-gray-500'>
            {calculateAge(student.birthdate)} years{student.school ? ` · ${student.school}` : ''} · with us since{' '}
            {formatDate(student.createdAt)}
          </p>
        </div>
        <div className='grid grid-cols-2 gap-2 sm:flex sm:gap-3'>
          <div className='rounded-xl border border-gray-200 bg-white px-4 py-2.5'>
            <p className='text-xl font-bold text-gray-900'>{formatHours(student.totalAttendanceMinutes)}</p>
            <p className='text-xs text-gray-500'>Time with TinkerTank</p>
          </div>
          {isSuper && student.totalSpend !== undefined ? (
            <div className='rounded-xl border border-gray-200 bg-white px-4 py-2.5'>
              <p className='text-xl font-bold text-gray-900'>{formatCurrency(student.totalSpend)}</p>
              <p className='text-xs text-gray-500'>Total spend</p>
            </div>
          ) : (
            <div className='rounded-xl border border-gray-200 bg-white px-4 py-2.5'>
              <p className='text-xl font-bold text-gray-900'>{attended}</p>
              <p className='text-xs text-gray-500'>Sessions attended</p>
            </div>
          )}
        </div>
      </div>

      {(hasNote(student.allergies) || hasNote(student.medicalNotes)) && (
        <div className='space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4'>
          {hasNote(student.allergies) && (
            <div className='flex items-start gap-2 text-amber-900'>
              <ExclamationTriangleIcon className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
              <p>
                <span className='font-semibold'>Allergies:</span> {student.allergies}
              </p>
            </div>
          )}
          {hasNote(student.medicalNotes) && (
            <p className='pl-7 text-amber-900'>
              <span className='font-semibold'>Medical:</span> {student.medicalNotes}
            </p>
          )}
        </div>
      )}

      <div className='grid gap-4 lg:grid-cols-3 lg:gap-6'>
        <Card title='Details'>
          <dl className='space-y-3 p-4 text-sm'>
            <div>
              <dt className='text-gray-500'>Date of birth</dt>
              <dd className='text-gray-900'>
                {formatDate(student.birthdate)}
                {student.birthdateEstimated ? ' (estimated)' : ''}
              </dd>
            </div>
            <div>
              <dt className='text-gray-500'>School</dt>
              <dd className='text-gray-900'>{student.school || '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card title='Contacts'>
          <div className='space-y-4 p-4 text-sm'>
            {student.parentContact && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-gray-900'>
                  <UserIcon className='h-4 w-4 text-gray-400' /> {student.parentContact.name}
                  <span className='text-xs text-gray-500'>parent</span>
                </div>
                {student.parentContact.phone && (
                  <a href={`tel:${student.parentContact.phone.replace(/[^\d+]/g, '')}`} className='flex items-center gap-2 text-orange-700'>
                    <PhoneIcon className='h-4 w-4 text-gray-400' /> {student.parentContact.phone}
                  </a>
                )}
                <a href={`mailto:${student.parentContact.email}`} className='flex items-center gap-2 break-all text-orange-700'>
                  <EnvelopeIcon className='h-4 w-4 flex-shrink-0 text-gray-400' /> {student.parentContact.email}
                </a>
                {isSuper && (
                  <Link
                    href={`/admin/customers/${encodeURIComponent(student.parentContact.email.trim().toLowerCase())}`}
                    className='inline-flex items-center gap-1 pt-1 font-medium text-gray-900 hover:text-orange-700'
                  >
                    Customer account <ChevronRightIcon className='h-4 w-4' />
                  </Link>
                )}
              </div>
            )}
            <div className='space-y-2 border-t border-gray-100 pt-3'>
              <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>Emergency</p>
              {student.emergencyContactName ? (
                <>
                  <div className='text-gray-900'>{student.emergencyContactName}</div>
                  {student.emergencyContactPhone && (
                    <a
                      href={`tel:${student.emergencyContactPhone.replace(/[^\d+]/g, '')}`}
                      className='flex items-center gap-2 text-orange-700'
                    >
                      <PhoneIcon className='h-4 w-4 text-gray-400' /> {student.emergencyContactPhone}
                    </a>
                  )}
                </>
              ) : (
                <p className='italic text-gray-500'>No emergency contact on file</p>
              )}
            </div>
          </div>
        </Card>

        <Card title='Ignite'>
          {student.subscriptions.length === 0 ? (
            <p className='p-4 text-sm italic text-gray-500'>Not enrolled in Ignite</p>
          ) : (
            <ul className='divide-y divide-gray-100'>
              {student.subscriptions.map(sub => (
                <li key={sub.id} className='flex items-center gap-3 px-4 py-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm font-semibold text-gray-900'>{sub.sessionLocation}</span>
                      <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[sub.status])}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                    </div>
                    <div className='mt-0.5 text-sm text-gray-600'>
                      {formatSessionTime(sub)}
                      {sub.weeklyAmount !== undefined && ` · $${sub.weeklyAmount.toFixed(2)}/wk`}
                    </div>
                    {sub.status === 'PAUSED' && sub.pauseResumesAt && (
                      <div className='text-xs text-gray-500'>Paused until {formatSydneyDate(sub.pauseResumesAt)}</div>
                    )}
                    {sub.cancelAt && sub.status !== 'CANCELED' && (
                      <div className='text-xs text-red-700'>Ends {formatSydneyDate(sub.cancelAt)}</div>
                    )}
                  </div>
                  {isSuper && sub.weeklyAmount !== undefined && (
                    <button
                      onClick={() => setBilling(sub as AdminSubscriptionView)}
                      className='inline-flex h-10 flex-shrink-0 items-center rounded-xl bg-gray-900 px-3.5 text-sm font-medium text-white hover:bg-gray-800'
                    >
                      Billing
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title='Sessions'>
        {upcoming.length === 0 ? (
          <p className='px-4 py-6 text-sm text-gray-500'>Nothing booked ahead.</p>
        ) : (
          <ul className='divide-y divide-gray-100'>
            {(showAllUpcoming ? upcoming : upcomingPreview).map(booking => bookingRow(booking, true))}
          </ul>
        )}
        {upcomingPreview.length < upcoming.length && (
          <button
            onClick={() => setShowAllUpcoming(open => !open)}
            className='w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-medium text-orange-700'
          >
            {showAllUpcoming ? 'Show fewer' : `Show all ${upcoming.length} upcoming`}
          </button>
        )}
        {past.length > 0 && (
          <div className='border-t border-gray-100'>
            <button onClick={() => setShowPast(open => !open)} className='w-full px-4 py-3 text-left text-sm font-medium text-orange-700'>
              {showPast ? 'Hide' : 'Show'} past sessions ({past.length})
            </button>
            {showPast && <ul className='divide-y divide-gray-100 bg-gray-50/60'>{past.map(booking => bookingRow(booking, false))}</ul>}
          </div>
        )}
      </Card>

      {isSuper && student.groupedOrders && student.groupedOrders.length > 0 && (
        <Card title='Purchases'>
          <ul className='divide-y divide-gray-100'>
            {student.groupedOrders.map(order => (
              <li key={`${order.orderId}-${order.bookingDates[0]}`} className='flex items-start justify-between gap-3 px-4 py-3 text-sm'>
                <div className='min-w-0'>
                  <div className='font-medium text-gray-900'>{order.productName}</div>
                  <div className='text-gray-500'>
                    Bought {formatDate(order.orderDate)} · {order.bookingDates.length} day{order.bookingDates.length === 1 ? '' : 's'}
                  </div>
                </div>
                <div className='flex-shrink-0 text-right'>
                  <div className='font-semibold text-gray-900'>{formatCurrency(order.totalPrice)}</div>
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      BOOKING_STATUS[order.status] || 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {order.status.toLowerCase()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
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

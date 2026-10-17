'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { ChevronRightIcon, ClipboardDocumentCheckIcon, PlusIcon, UsersIcon } from '@heroicons/react/24/outline'

interface DashboardData {
  unpaid: { id: string; customerName: string; customerEmail: string; session: string }[]
  endingSoon: { id: string; customerName: string; customerEmail: string; session: string; cancelAt: string }[]
  parties: { id: string; startsAt: string; studentId: string; studentName: string; productName: string; venue: string }[]
  missingDetails: { studentId: string; name: string; reason: string }[]
}

interface TodayLocation {
  id: string
  name: string
  students: number
  here: number
}

const customerHref = (email: string) => `/admin/customers/${encodeURIComponent(email.trim().toLowerCase())}`

function sydneyToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
}

function partyTime(startsAt: string) {
  // Party times are Sydney wall-clock fields stored as UTC.
  const date = new Date(`${startsAt}:00Z`)
  return `${date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}, ${date
    .toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    .replace(' ', '')
    .toLowerCase()}`
}

function AttentionGroup({
  title,
  tone,
  children,
  count
}: {
  title: string
  tone: 'red' | 'amber' | 'blue'
  count: number
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <section className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
      <div className='flex items-center gap-2 border-b border-gray-100 px-4 py-3'>
        <span className={clsx('h-2 w-2 rounded-full', tone === 'red' ? 'bg-red-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500')} />
        <h2 className='text-sm font-semibold text-gray-900'>{title}</h2>
        <span className='text-sm text-gray-500'>{count}</span>
      </div>
      <ul className='divide-y divide-gray-100'>{children}</ul>
    </section>
  )
}

function Row({ href, primary, secondary }: { href: string; primary: string; secondary: string }) {
  return (
    <li>
      <Link href={href} className='flex items-center gap-3 px-4 py-3 hover:bg-gray-50'>
        <div className='min-w-0 flex-1'>
          <div className='truncate text-sm font-medium text-gray-900'>{primary}</div>
          <div className='truncate text-sm text-gray-500'>{secondary}</div>
        </div>
        <ChevronRightIcon className='h-5 w-5 flex-shrink-0 text-gray-300' />
      </Link>
    </li>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [today, setToday] = useState<TodayLocation[] | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(response => response.json())
      .then(setData)
      .catch(() => setData({ unpaid: [], endingSoon: [], parties: [], missingDetails: [] }))
    fetch(`/api/admin/schedule?date=${sydneyToday()}`)
      .then(response => response.json())
      .then(
        (schedule: {
          locations: { id: string; name: string }[]
          items: { locationId: string; checkInAt: string | null; checkOutAt: string | null }[]
        }) =>
          setToday(
            schedule.locations.map(location => {
              const items = schedule.items.filter(item => item.locationId === location.id)
              return { ...location, students: items.length, here: items.filter(item => item.checkInAt && !item.checkOutAt).length }
            })
          )
      )
      .catch(() => setToday([]))
  }, [])

  const attentionCount = data ? data.unpaid.length + data.endingSoon.length + data.parties.length + data.missingDetails.length : 0
  const todayTotal = today?.reduce((sum, location) => sum + location.students, 0) ?? 0

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 sm:text-2xl'>Dashboard</h1>
          <p className='text-sm text-gray-500'>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Australia/Sydney' })}
          </p>
        </div>
        <div className='grid grid-cols-2 gap-2 sm:flex'>
          <Link
            href='/admin/bookings/new'
            className='col-span-2 inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700'
          >
            <PlusIcon className='h-4 w-4' /> Add booking
          </Link>
          <Link
            href='/admin/schedule'
            className='inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50'
          >
            <ClipboardDocumentCheckIcon className='h-4 w-4' /> Check-in
          </Link>
          <Link
            href='/admin/customers'
            className='inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50'
          >
            <UsersIcon className='h-4 w-4' /> Customers
          </Link>
        </div>
      </div>

      <section className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
        <div className='flex items-baseline justify-between border-b border-gray-100 px-4 py-3'>
          <h2 className='text-sm font-semibold text-gray-900'>Today</h2>
          {today && <span className='text-sm text-gray-500'>{todayTotal} students</span>}
        </div>
        {!today ? (
          <p className='px-4 py-6 text-sm text-gray-500'>Loading…</p>
        ) : today.length === 0 ? (
          <p className='px-4 py-6 text-sm text-gray-500'>Nobody is booked in today.</p>
        ) : (
          <ul className='grid divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3'>
            {today.map(location => (
              <li key={location.id}>
                <Link href='/admin/schedule' className='flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50'>
                  <span className='truncate text-sm font-medium text-gray-900'>{location.name}</span>
                  <span className='flex-shrink-0 text-sm text-gray-600'>
                    <span className='font-semibold text-gray-900'>{location.here}</span> of {location.students} here
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className='space-y-3'>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>Needs attention</h2>
        {!data ? (
          <p className='text-sm text-gray-500'>Loading…</p>
        ) : attentionCount === 0 ? (
          <div className='rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500'>
            All clear. Nothing needs you right now.
          </div>
        ) : (
          <div className='grid gap-3 lg:grid-cols-2'>
            <AttentionGroup title='Unpaid Ignite' tone='red' count={data.unpaid.length}>
              {data.unpaid.map(sub => (
                <Row
                  key={sub.id}
                  href={customerHref(sub.customerEmail)}
                  primary={sub.customerName}
                  secondary={`${sub.session} · payment failed`}
                />
              ))}
            </AttentionGroup>
            <AttentionGroup title='Ignite ending in the next 2 weeks' tone='amber' count={data.endingSoon.length}>
              {data.endingSoon.map(sub => (
                <Row
                  key={sub.id}
                  href={customerHref(sub.customerEmail)}
                  primary={sub.customerName}
                  secondary={`${sub.session} · ends ${new Date(sub.cancelAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'Australia/Sydney' })}`}
                />
              ))}
            </AttentionGroup>
            <AttentionGroup title='Parties in the next 7 days' tone='blue' count={data.parties.length}>
              {data.parties.map(party => (
                <Row
                  key={party.id}
                  href={`/admin/students/${party.studentId}`}
                  primary={`${party.studentName} · ${party.productName}`}
                  secondary={`${partyTime(party.startsAt)} · ${party.venue}`}
                />
              ))}
            </AttentionGroup>
            <AttentionGroup title='Missing details for upcoming sessions' tone='amber' count={data.missingDetails.length}>
              {data.missingDetails.map(student => (
                <Row
                  key={student.studentId}
                  href={`/admin/students/${student.studentId}`}
                  primary={student.name}
                  secondary={student.reason}
                />
              ))}
            </AttentionGroup>
          </div>
        )}
      </div>

      <Link
        href='/admin/analytics'
        className='flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50'
      >
        <span className='text-sm font-medium text-gray-900'>Sales: camp fill, booking pace and Meta ads</span>
        <ChevronRightIcon className='h-5 w-5 text-gray-300' />
      </Link>
    </div>
  )
}

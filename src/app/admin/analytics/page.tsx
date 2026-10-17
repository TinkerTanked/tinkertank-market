'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline'
import type { MetaAdsSummary, MetaAdsTotals } from '@/lib/metaAds'

interface Analytics {
  generatedAt: string
  campFill: {
    name: string
    start: string
    end: string
    locations: { id: string; name: string; capacity: number; days: { date: string; booked: number }[]; booked: number; places: number }[]
  } | null
  pace: {
    campDays: { last7: number; prev7: number; last30: number; prev30: number }
    parties: { last30: number; prev30: number }
    igniteNew: { last30: number; prev30: number }
  }
  ignite: {
    active: number
    weeklyRecurring: number
    paused: number
    cancelling: number
    cancelledLast30: number
    manualStudents: number
    sessions: { id: string; location: string; days: string; enrolled: number; capacity: number }[]
  }
  parties: { weeks: { weekStart: string; booked: number; slots: number }[]; booked: number; slots: number }
}

type MetaAdsResponse = ({ configured: true } & MetaAdsSummary) | { configured: false } | { configured: true; error: string }

const dollars = (value: number) => `$${Math.round(value).toLocaleString('en-AU')}`
const shortDate = (key: string) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const weekday = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString('en-AU', { weekday: 'short', timeZone: 'UTC' })
const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
      <div className='border-b border-gray-100 px-4 py-3'>
        <h2 className='text-sm font-semibold text-gray-900'>{title}</h2>
        {subtitle && <p className='text-xs text-gray-500'>{subtitle}</p>}
      </div>
      <div className='p-4'>{children}</div>
    </section>
  )
}

function Pace({ label, value, previous, period }: { label: string; value: number; previous: number; period: string }) {
  const up = value >= previous
  const change = previous === 0 ? null : Math.round(((value - previous) / previous) * 100)
  return (
    <div className='rounded-xl border border-gray-200 bg-white px-4 py-3'>
      <div className='text-2xl font-bold text-gray-900'>{value}</div>
      <div className='text-sm text-gray-600'>{label}</div>
      <div className={clsx('mt-1 flex items-center gap-1 text-xs', up ? 'text-green-700' : 'text-red-700')}>
        {up ? <ArrowUpRightIcon className='h-3.5 w-3.5' /> : <ArrowDownRightIcon className='h-3.5 w-3.5' />}
        {change === null ? `vs ${previous} ${period} before` : `${change > 0 ? '+' : ''}${change}% vs ${previous} ${period} before`}
      </div>
    </div>
  )
}

function fillColor(booked: number, capacity: number) {
  const share = capacity > 0 ? booked / capacity : 0
  if (share >= 1) return 'bg-gray-900 text-white'
  if (share >= 0.75) return 'bg-green-600 text-white'
  if (share >= 0.4) return 'bg-green-200 text-green-900'
  if (booked > 0) return 'bg-amber-100 text-amber-900'
  return 'bg-gray-50 text-gray-500'
}

const money = (value: number) => `$${value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const per = (spend: number, count: number) => (count > 0 ? money(spend / count) : '–')

function MetaStat({ value, label, detail }: { value: string; label: string; detail?: string }) {
  return (
    <div className='rounded-lg bg-gray-50 px-3 py-2'>
      <div className='text-lg font-bold text-gray-900'>{value}</div>
      <div className='text-xs text-gray-600'>{label}</div>
      {detail && <div className='text-[11px] text-gray-500'>{detail}</div>}
    </div>
  )
}

function MetaAdsCard() {
  const [meta, setMeta] = useState<MetaAdsResponse | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics/meta')
      .then(response => response.json())
      .then(setMeta)
      .catch(() => setMeta({ configured: true, error: 'Could not load results from Meta right now.' }))
  }, [])

  return (
    <Card title='Meta ads, last 30 days' subtitle='Spend and purchases as reported by Meta. Compare with camp days sold above.'>
      {!meta ? (
        <div className='h-24 animate-pulse rounded-lg bg-gray-100' />
      ) : !meta.configured ? (
        <p className='text-sm text-gray-600'>Meta isn&apos;t connected yet, so ad results can&apos;t be shown.</p>
      ) : 'error' in meta ? (
        <p className='rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900'>{meta.error}</p>
      ) : (
        <MetaAdsResults meta={meta} />
      )}
    </Card>
  )
}

function MetaAdsResults({ meta }: { meta: MetaAdsSummary }) {
  const total: MetaAdsTotals = meta.last30
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
        <MetaStat value={money(total.spend)} label='Spent' detail={`${total.impressions.toLocaleString('en-AU')} impressions`} />
        <MetaStat
          value={total.linkClicks.toLocaleString('en-AU')}
          label='Link clicks'
          detail={`${per(total.spend, total.linkClicks)} each`}
        />
        <MetaStat value={String(total.purchases)} label='Purchases' detail={`${per(total.spend, total.purchases)} each`} />
        <MetaStat
          value={money(total.purchaseValue)}
          label='Purchase value'
          detail={total.spend > 0 ? `$${(total.purchaseValue / total.spend).toFixed(2)} back per $1` : undefined}
        />
      </div>
      <p className='text-sm text-gray-600'>
        Last 7 days: {money(meta.last7.spend)} spent · {meta.last7.purchases} {meta.last7.purchases === 1 ? 'purchase' : 'purchases'}
      </p>
      {meta.campaigns.length > 0 && (
        <ul className='divide-y divide-gray-100 rounded-lg border border-gray-100'>
          {meta.campaigns.map(campaign => (
            <li key={campaign.id} className='flex items-center gap-3 px-3 py-2.5 text-sm'>
              <div className='min-w-0 flex-1'>
                <div className='font-medium leading-snug text-gray-900'>{campaign.name}</div>
                <div className='text-xs text-gray-500'>
                  {money(campaign.spend)} · {campaign.linkClicks} clicks · {campaign.purchases}{' '}
                  {campaign.purchases === 1 ? 'purchase' : 'purchases'}
                  {campaign.purchases > 0 && ` · ${per(campaign.spend, campaign.purchases)} each`}
                </div>
              </div>
              <span
                className={clsx(
                  'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                )}
              >
                {campaign.status === 'ACTIVE' ? 'Running' : campaign.status === 'PAUSED' ? 'Paused' : 'Ended'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SalesPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Failed to load')
        setData(body)
      })
      .catch(err => setError(err.message))
  }, [])

  if (error) return <div className='rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800'>{error}</div>
  if (!data) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600' />
      </div>
    )
  }

  const maxPartySlots = Math.max(1, ...data.parties.weeks.map(week => week.slots))

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div>
        <h1 className='text-xl font-bold text-gray-900 sm:text-2xl'>Sales</h1>
        <p className='text-sm text-gray-500'>
          Updated{' '}
          {new Date(data.generatedAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Sydney' })}
        </p>
      </div>

      {data.campFill && (
        <Card
          title={`Camp fill · ${data.campFill.name}`}
          subtitle={`${shortDate(data.campFill.start)} – ${shortDate(data.campFill.end)}. Promote the emptiest days.`}
        >
          <div className='space-y-5'>
            {data.campFill.locations.map(location => (
              <div key={location.id}>
                <div className='mb-2 flex items-baseline justify-between gap-2'>
                  <span className='text-sm font-semibold text-gray-900'>{location.name}</span>
                  {location.days.length > 0 && (
                    <span className='text-sm text-gray-600'>
                      {location.booked} of {location.places} places · {percent(location.booked, location.places)}%
                    </span>
                  )}
                </div>
                {location.days.length === 0 ? (
                  <p className='rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900'>
                    No camp days are set up here for these holidays.
                  </p>
                ) : (
                  <div className='grid grid-cols-5 gap-1.5 sm:grid-cols-10'>
                    {location.days.map(day => (
                      <div
                        key={day.date}
                        className={clsx('rounded-lg px-1.5 py-1.5 text-center', fillColor(day.booked, location.capacity))}
                      >
                        <div className='text-[11px] leading-tight opacity-80'>
                          {weekday(day.date)} {shortDate(day.date)}
                        </div>
                        <div className='text-sm font-semibold'>{day.booked}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className='flex flex-wrap gap-3 text-xs text-gray-500'>
              {[
                ['bg-gray-50 border border-gray-200', 'Empty'],
                ['bg-amber-100', 'Under 40%'],
                ['bg-green-200', '40–75%'],
                ['bg-green-600', 'Over 75%'],
                ['bg-gray-900', 'Full']
              ].map(([color, label]) => (
                <span key={label} className='flex items-center gap-1.5'>
                  <span className={clsx('h-3 w-3 rounded', color)} /> {label}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'>
        <Pace label='Camp days sold, last 7 days' value={data.pace.campDays.last7} previous={data.pace.campDays.prev7} period='the week' />
        <Pace
          label='Camp days sold, last 30 days'
          value={data.pace.campDays.last30}
          previous={data.pace.campDays.prev30}
          period='the 30 days'
        />
        <Pace
          label='New Ignite, last 30 days'
          value={data.pace.igniteNew.last30}
          previous={data.pace.igniteNew.prev30}
          period='the 30 days'
        />
        <Pace
          label='Parties booked, last 30 days'
          value={data.pace.parties.last30}
          previous={data.pace.parties.prev30}
          period='the 30 days'
        />
      </div>

      <MetaAdsCard />

      <div className='grid gap-4 lg:grid-cols-2 lg:gap-6'>
        <Card title='Ignite' subtitle='Sessions with the most spare places first.'>
          <div className='mb-4 grid grid-cols-3 gap-2 text-center'>
            <div className='rounded-lg bg-gray-50 px-2 py-2'>
              <div className='text-lg font-bold text-gray-900'>{data.ignite.active}</div>
              <div className='text-[11px] text-gray-500'>active</div>
            </div>
            <div className='rounded-lg bg-gray-50 px-2 py-2'>
              <div className='text-lg font-bold text-gray-900'>{dollars(data.ignite.weeklyRecurring)}</div>
              <div className='text-[11px] text-gray-500'>per week</div>
            </div>
            <div className='rounded-lg bg-gray-50 px-2 py-2'>
              <div className='text-lg font-bold text-gray-900'>{data.ignite.paused}</div>
              <div className='text-[11px] text-gray-500'>paused</div>
            </div>
          </div>
          <p className='mb-3 text-sm text-gray-600'>
            {data.ignite.cancelling} ending soon · {data.ignite.cancelledLast30} ended in the last 30 days
            {data.ignite.manualStudents > 0 && ` · ${data.ignite.manualStudents} on invoiced places`}
          </p>
          <ul className='space-y-2.5'>
            {data.ignite.sessions.map(session => (
              <li key={session.id}>
                <div className='flex justify-between gap-2 text-sm'>
                  <span className='truncate text-gray-800'>
                    {session.location} <span className='text-gray-500'>· {session.days}</span>
                  </span>
                  <span className='flex-shrink-0 text-gray-600'>
                    {session.enrolled}/{session.capacity}
                  </span>
                </div>
                <div className='mt-1 h-2 overflow-hidden rounded-full bg-gray-100'>
                  <div
                    className='h-full rounded-full bg-emerald-500'
                    style={{ width: `${Math.min(100, percent(session.enrolled, session.capacity))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title='Parties, next 8 weeks' subtitle='Friday and Saturday, three slots a day.'>
          <p className='mb-3 text-sm text-gray-700'>
            <span className='text-lg font-bold text-gray-900'>{data.parties.booked}</span> of {data.parties.slots} slots booked
          </p>
          <ul className='space-y-2'>
            {data.parties.weeks.map(week => (
              <li key={week.weekStart} className='flex items-center gap-3 text-sm'>
                <span className='w-16 flex-shrink-0 text-gray-600'>{shortDate(week.weekStart)}</span>
                <div className='flex flex-1 gap-1'>
                  {Array.from({ length: maxPartySlots }, (_, index) => (
                    <span
                      key={index}
                      className={clsx(
                        'h-3 flex-1 rounded-sm',
                        index < week.booked ? 'bg-pink-500' : index < week.slots ? 'bg-gray-100' : 'invisible'
                      )}
                    />
                  ))}
                </div>
                <span className='w-10 flex-shrink-0 text-right text-gray-600'>
                  {week.booked}/{week.slots}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

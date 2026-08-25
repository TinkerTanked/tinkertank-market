'use client'

import { CalendarDaysIcon, ClockIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import type { CampBookingDraft } from '@/lib/bookingSchema'
import { fromCalendarDate } from '@/lib/bookingSchema'

export function getCampTotal(draft: CampBookingDraft) {
  const campType = draft.selection.campType
  if (!campType) return 0
  const pricePerChild = campType.isBundle ? campType.price : campType.price * draft.selection.dates.length
  return Number((pricePerChild * Math.max(draft.children.length, 1)).toFixed(2))
}

export default function BookingSummary({ draft }: { draft: CampBookingDraft }) {
  const { location, dates, campType } = draft.selection
  const childCount = draft.children.length
  const total = getCampTotal(draft)

  return (
    <div className='space-y-4 text-sm'>
      {campType ? (
        <div>
          <p className='font-bold text-slate-950'>{campType.name}</p>
          <p className='mt-1 text-slate-500'>
            {campType.isBundle ? `${campType.bundleDays}-day bundle` : `${dates.length || 1} camp ${dates.length === 1 ? 'day' : 'days'}`}
          </p>
        </div>
      ) : (
        <p className='text-slate-500'>Choose your location, dates and camp format.</p>
      )}

      {location && (
        <p className='flex items-start gap-2 text-slate-700'>
          <MapPinIcon className='mt-0.5 h-4 w-4 flex-none text-primary-700' />
          <span>{location.name}</span>
        </p>
      )}
      {dates.length > 0 && (
        <div className='flex items-start gap-2 text-slate-700'>
          <CalendarDaysIcon className='mt-0.5 h-4 w-4 flex-none text-primary-700' />
          <div className='flex flex-wrap gap-1.5'>
            {dates.map(date => (
              <span key={date} className='rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold'>
                {fromCalendarDate(date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            ))}
          </div>
        </div>
      )}
      {campType && (
        <p className='flex items-center gap-2 text-slate-700'>
          <ClockIcon className='h-4 w-4 text-primary-700' />
          {campType.time}
        </p>
      )}
      {childCount > 0 && (
        <p className='flex items-center gap-2 text-slate-700'>
          <UsersIcon className='h-4 w-4 text-primary-700' />
          {childCount} {childCount === 1 ? 'child' : 'children'}
        </p>
      )}

      {campType && dates.length > 0 && (
        <div className='border-t border-slate-200 pt-4'>
          <div className='flex items-center justify-between'>
            <span className='font-semibold text-slate-700'>Total AUD</span>
            <span className='text-xl font-bold text-slate-950'>${total.toFixed(2)}</span>
          </div>
          {childCount === 0 && <p className='mt-1 text-xs text-slate-500'>For one child; updates as children are added.</p>}
        </div>
      )}
    </div>
  )
}

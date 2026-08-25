'use client'

import { CheckCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import type { CampBookingDraft } from '@/lib/bookingSchema'
import { fromCalendarDate } from '@/lib/bookingSchema'
import { getCampTotal } from './BookingSummary'

interface ReviewStepProps {
  draft: CampBookingDraft
  onEdit: (step: number) => void
  error?: string | null
}

export default function ReviewStep({ draft, onEdit, error }: ReviewStepProps) {
  const { selection, children, contact, emergencyContact } = draft
  const total = getCampTotal(draft)
  const defaultEmergencyName = `${contact.firstName} ${contact.lastName}`.trim()
  const emergencyName = emergencyContact.sameAsBookingContact
    ? defaultEmergencyName
    : `${emergencyContact.contact.firstName} ${emergencyContact.contact.lastName}`.trim()

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-display text-2xl font-bold text-slate-950 sm:text-3xl'>Review and pay</h2>
        <p className='mt-2 text-slate-600'>Check every detail before continuing to secure payment.</p>
      </div>

      {error && (
        <div role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800'>
          {error}
        </div>
      )}

      <ReviewSection title='Experience' onEdit={() => onEdit(1)}>
        <p className='font-bold text-slate-950'>{selection.campType?.name}</p>
        <p>{selection.location?.name}</p>
        <p>{selection.campType?.time}</p>
        <div className='mt-2 flex flex-wrap gap-2'>
          {selection.dates.map(date => (
            <span key={date} className='rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-800'>
              {fromCalendarDate(date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long' })}
            </span>
          ))}
        </div>
      </ReviewSection>

      <ReviewSection title='Children' onEdit={() => onEdit(2)}>
        <div className='space-y-3'>
          {children.map(child => (
            <div key={child.id}>
              <p className='font-bold text-slate-950'>
                {child.firstName} {child.lastName}
              </p>
              <p>
                DOB {fromCalendarDate(child.dateOfBirth).toLocaleDateString('en-AU')}
                {child.school && ` · ${child.school}`}
              </p>
              <p className='mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700'>
                <CheckCircleIcon className='h-4 w-4' />
                {child.allergies.hasDetails || child.supportNeeds.hasDetails ? 'Support details supplied' : 'No additional support details'}
              </p>
            </div>
          ))}
        </div>
      </ReviewSection>

      <ReviewSection title='Contact' onEdit={() => onEdit(3)}>
        <p className='font-bold text-slate-950'>
          {contact.firstName} {contact.lastName}
        </p>
        <p>{contact.email}</p>
        <p>{contact.mobile}</p>
        <p className='mt-2 text-xs font-semibold text-slate-500'>Emergency contact: {emergencyName}</p>
      </ReviewSection>

      <section className='rounded-2xl bg-slate-950 p-5 text-white sm:p-6'>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <p className='text-sm font-semibold text-slate-300'>Total AUD</p>
            <p className='mt-1 text-xs text-slate-400'>
              {children.length} {children.length === 1 ? 'child' : 'children'} · {selection.dates.length}{' '}
              {selection.dates.length === 1 ? 'day' : 'days'}
            </p>
          </div>
          <p className='font-display text-3xl font-bold'>${total.toFixed(2)}</p>
        </div>
      </section>

      <p className='text-sm leading-6 text-slate-600'>
        By continuing, you agree to TinkerTank&apos;s{' '}
        <Link href='/terms' target='_blank' className='font-semibold text-primary-700 underline'>
          booking terms
        </Link>{' '}
        and{' '}
        <Link href='/privacy' target='_blank' className='font-semibold text-primary-700 underline'>
          privacy policy
        </Link>
        .
      </p>
    </div>
  )
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className='rounded-2xl border border-slate-200 p-5'>
      <div className='flex items-center justify-between gap-4'>
        <h3 className='font-display text-lg font-bold text-slate-950'>{title}</h3>
        <button
          type='button'
          onClick={onEdit}
          className='inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:text-primary-900'
        >
          <PencilSquareIcon className='h-4 w-4' /> Edit
        </button>
      </div>
      <div className='mt-3 text-sm leading-6 text-slate-600'>{children}</div>
    </section>
  )
}

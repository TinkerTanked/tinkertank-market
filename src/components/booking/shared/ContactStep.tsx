'use client'

import { ChevronDownIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import type { BookingChild, CampBookingDraft, EmergencyContact, BookingValidationError } from '@/lib/bookingSchema'

function errorFor(errors: BookingValidationError[], path: string) {
  return errors.find(error => error.path === path)?.message
}

function fieldClass(error?: string) {
  return `mt-1 w-full rounded-xl border px-3 py-3 text-slate-950 outline-none transition focus:ring-2 ${
    error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-primary-600 focus:ring-primary-100'
  }`
}

const emptyEmergencyContact = (): EmergencyContact => ({ firstName: '', lastName: '', mobile: '', relationship: '' })

interface ContactStepProps {
  contact: CampBookingDraft['contact']
  emergencyContact: CampBookingDraft['emergencyContact']
  childrenData: BookingChild[]
  onContactChange: (contact: CampBookingDraft['contact']) => void
  onEmergencyChange: (contact: CampBookingDraft['emergencyContact']) => void
  onChildrenChange: (children: BookingChild[]) => void
  errors: BookingValidationError[]
}

export default function ContactStep({
  contact,
  emergencyContact,
  childrenData,
  onContactChange,
  onEmergencyChange,
  onChildrenChange,
  errors,
}: ContactStepProps) {
  const updateChild = (index: number, child: BookingChild) => {
    onChildrenChange(childrenData.map((item, childIndex) => (childIndex === index ? child : item)))
  }

  return (
    <div className='space-y-7'>
      <div>
        <h2 className='font-display text-2xl font-bold text-slate-950 sm:text-3xl'>Your details</h2>
        <p className='mt-2 text-slate-600'>We will send confirmation and important booking updates here.</p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        {(['firstName', 'lastName'] as const).map(field => (
          <label key={field} className='text-sm font-bold text-slate-800'>
            {field === 'firstName' ? 'First name' : 'Last name'} <span className='text-red-600'>*</span>
            <input
              autoComplete={field === 'firstName' ? 'given-name' : 'family-name'}
              value={contact[field]}
              onChange={event => onContactChange({ ...contact, [field]: event.target.value })}
              className={fieldClass(errorFor(errors, `contact.${field}`))}
            />
            {errorFor(errors, `contact.${field}`) && (
              <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `contact.${field}`)}</span>
            )}
          </label>
        ))}
        <label className='text-sm font-bold text-slate-800 sm:col-span-2'>
          Email <span className='text-red-600'>*</span>
          <input
            type='email'
            autoComplete='email'
            inputMode='email'
            value={contact.email}
            onChange={event => onContactChange({ ...contact, email: event.target.value })}
            className={fieldClass(errorFor(errors, 'contact.email'))}
          />
          {errorFor(errors, 'contact.email') && (
            <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, 'contact.email')}</span>
          )}
        </label>
        <label className='text-sm font-bold text-slate-800 sm:col-span-2'>
          Mobile <span className='text-red-600'>*</span>
          <input
            type='tel'
            autoComplete='tel'
            inputMode='tel'
            value={contact.mobile}
            onChange={event => onContactChange({ ...contact, mobile: event.target.value })}
            className={fieldClass(errorFor(errors, 'contact.mobile'))}
          />
          {errorFor(errors, 'contact.mobile') && (
            <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, 'contact.mobile')}</span>
          )}
        </label>
      </div>

      <section className='rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6'>
        <div className='flex items-start gap-3'>
          <span className='grid h-10 w-10 flex-none place-items-center rounded-xl bg-emerald-100 text-emerald-700'>
            <ShieldCheckIcon className='h-5 w-5' />
          </span>
          <div>
            <h3 className='font-display text-lg font-bold text-slate-950'>Emergency contact</h3>
            <p className='mt-1 text-sm text-slate-600'>Who should we call first in an emergency?</p>
          </div>
        </div>

        <label className='mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4'>
          <input
            type='checkbox'
            checked={emergencyContact.sameAsBookingContact}
            onChange={event =>
              onEmergencyChange(
                event.target.checked ? { sameAsBookingContact: true } : { sameAsBookingContact: false, contact: emptyEmergencyContact() }
              )
            }
            className='mt-0.5 h-5 w-5 rounded border-slate-300 text-primary-700 focus:ring-primary-600'
          />
          <span>
            <span className='block font-bold text-slate-900'>Use my details as the emergency contact</span>
            <span className='mt-1 block text-sm text-slate-500'>This is the simplest option and is selected by default.</span>
          </span>
        </label>

        {!emergencyContact.sameAsBookingContact && (
          <EmergencyFields
            contact={emergencyContact.contact}
            path='emergencyContact.contact'
            errors={errors}
            onChange={value => onEmergencyChange({ sameAsBookingContact: false, contact: value })}
          />
        )}
      </section>

      {childrenData.length > 1 && (
        <details className='rounded-2xl border border-slate-200 bg-white'>
          <summary className='flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-bold text-slate-900'>
            Use a different emergency contact for a child
            <ChevronDownIcon className='h-5 w-5 text-slate-500' />
          </summary>
          <div className='space-y-5 border-t border-slate-200 p-5'>
            {childrenData.map((child, index) => (
              <div key={child.id} className='rounded-xl bg-slate-50 p-4'>
                <label className='flex cursor-pointer items-center gap-3 font-semibold text-slate-900'>
                  <input
                    type='checkbox'
                    checked={!!child.emergencyContactOverride}
                    onChange={event =>
                      updateChild(index, {
                        ...child,
                        emergencyContactOverride: event.target.checked ? emptyEmergencyContact() : undefined,
                      })
                    }
                    className='h-5 w-5 rounded border-slate-300 text-primary-700 focus:ring-primary-600'
                  />
                  Different contact for {child.firstName || `child ${index + 1}`}
                </label>
                {child.emergencyContactOverride && (
                  <EmergencyFields
                    contact={child.emergencyContactOverride}
                    path={`children.${index}.emergencyContactOverride`}
                    errors={errors}
                    onChange={value => updateChild(index, { ...child, emergencyContactOverride: value })}
                  />
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      <p className='rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900'>
        Your contact details are used to manage this booking and support your child. They are not stored in browser history.
      </p>
    </div>
  )
}

function EmergencyFields({
  contact,
  path,
  errors,
  onChange,
}: {
  contact: EmergencyContact
  path: string
  errors: BookingValidationError[]
  onChange: (contact: EmergencyContact) => void
}) {
  return (
    <div className='mt-5 grid gap-4 sm:grid-cols-2'>
      {(['firstName', 'lastName'] as const).map(field => (
        <label key={field} className='text-sm font-bold text-slate-800'>
          {field === 'firstName' ? 'First name' : 'Last name'} <span className='text-red-600'>*</span>
          <input
            value={contact[field]}
            onChange={event => onChange({ ...contact, [field]: event.target.value })}
            className={fieldClass(errorFor(errors, `${path}.${field}`))}
          />
          {errorFor(errors, `${path}.${field}`) && (
            <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `${path}.${field}`)}</span>
          )}
        </label>
      ))}
      <label className='text-sm font-bold text-slate-800'>
        Mobile <span className='text-red-600'>*</span>
        <input
          type='tel'
          inputMode='tel'
          value={contact.mobile}
          onChange={event => onChange({ ...contact, mobile: event.target.value })}
          className={fieldClass(errorFor(errors, `${path}.mobile`))}
        />
        {errorFor(errors, `${path}.mobile`) && (
          <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `${path}.mobile`)}</span>
        )}
      </label>
      <label className='text-sm font-bold text-slate-800'>
        Relationship <span className='font-normal text-slate-500'>(optional)</span>
        <input
          value={contact.relationship || ''}
          onChange={event => onChange({ ...contact, relationship: event.target.value })}
          className={fieldClass()}
        />
      </label>
    </div>
  )
}

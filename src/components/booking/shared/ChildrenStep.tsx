'use client'

import { PlusIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import type { BookingChild, BookingValidationError } from '@/lib/bookingSchema'

function newChild(): BookingChild {
  return {
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    school: '',
    allergies: { hasDetails: null },
    supportNeeds: { hasDetails: null },
  }
}

function errorFor(errors: BookingValidationError[], path: string) {
  return errors.find(error => error.path === path)?.message
}

function fieldClass(error?: string) {
  return `mt-1 w-full rounded-xl border px-3 py-3 text-slate-950 outline-none transition focus:ring-2 ${
    error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-primary-600 focus:ring-primary-100'
  }`
}

function YesNoChoice({
  value,
  onChange,
  label,
  error,
}: {
  value: boolean | null
  onChange: (value: boolean) => void
  label: string
  error?: string
}) {
  return (
    <fieldset>
      <legend className='text-sm font-bold text-slate-800'>{label}</legend>
      <div className='mt-2 flex gap-2'>
        {[false, true].map(option => (
          <button
            key={String(option)}
            type='button'
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`min-w-20 rounded-xl border px-4 py-2.5 text-sm font-bold ${
              value === option
                ? 'border-primary-700 bg-primary-50 text-primary-800 ring-1 ring-primary-700'
                : 'border-slate-300 bg-white text-slate-600 hover:border-primary-400'
            }`}
          >
            {option ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
      {error && <span className='mt-2 block text-sm text-red-700'>{error}</span>}
    </fieldset>
  )
}

interface ChildrenStepProps {
  childrenData: BookingChild[]
  onChange: (children: BookingChild[]) => void
  errors: BookingValidationError[]
}

export default function ChildrenStep({ childrenData, onChange, errors }: ChildrenStepProps) {
  const update = (index: number, value: BookingChild) => {
    onChange(childrenData.map((child, childIndex) => (childIndex === index ? value : child)))
  }

  const addChild = () => onChange([...childrenData, newChild()])

  return (
    <div className='space-y-7'>
      <div>
        <h2 className='font-display text-2xl font-bold text-slate-950 sm:text-3xl'>Who is coming?</h2>
        <p className='mt-2 text-slate-600'>Add each child attending. You can review everything before payment.</p>
      </div>

      {childrenData.length === 0 && (
        <button
          type='button'
          onClick={addChild}
          className='flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 px-5 py-8 font-bold text-primary-800 hover:border-primary-500'
        >
          <PlusIcon className='h-5 w-5' />
          Add a child
        </button>
      )}

      {childrenData.map((child, index) => {
        const path = `children.${index}`
        return (
          <section key={child.id} className='rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6'>
            <div className='flex items-center justify-between gap-4'>
              <h3 className='flex items-center gap-2 font-display text-lg font-bold text-slate-950'>
                <span className='grid h-9 w-9 place-items-center rounded-full bg-primary-100 text-primary-700'>
                  <UserIcon className='h-5 w-5' />
                </span>
                Child {index + 1}
              </h3>
              {childrenData.length > 1 && (
                <button
                  type='button'
                  onClick={() => onChange(childrenData.filter((_, childIndex) => childIndex !== index))}
                  className='inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-red-700 hover:bg-red-50'
                >
                  <TrashIcon className='h-4 w-4' /> Remove
                </button>
              )}
            </div>

            <div className='mt-5 grid gap-4 sm:grid-cols-2'>
              <label className='text-sm font-bold text-slate-800'>
                First name <span className='text-red-600'>*</span>
                <input
                  value={child.firstName}
                  onChange={event => update(index, { ...child, firstName: event.target.value })}
                  className={fieldClass(errorFor(errors, `${path}.firstName`))}
                  aria-invalid={!!errorFor(errors, `${path}.firstName`)}
                />
                {errorFor(errors, `${path}.firstName`) && (
                  <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `${path}.firstName`)}</span>
                )}
              </label>
              <label className='text-sm font-bold text-slate-800'>
                Last name <span className='text-red-600'>*</span>
                <input
                  value={child.lastName}
                  onChange={event => update(index, { ...child, lastName: event.target.value })}
                  className={fieldClass(errorFor(errors, `${path}.lastName`))}
                  aria-invalid={!!errorFor(errors, `${path}.lastName`)}
                />
                {errorFor(errors, `${path}.lastName`) && (
                  <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `${path}.lastName`)}</span>
                )}
              </label>
              <label className='text-sm font-bold text-slate-800'>
                Date of birth <span className='text-red-600'>*</span>
                <input
                  type='date'
                  value={child.dateOfBirth}
                  onChange={event => update(index, { ...child, dateOfBirth: event.target.value })}
                  className={fieldClass(errorFor(errors, `${path}.dateOfBirth`))}
                  aria-invalid={!!errorFor(errors, `${path}.dateOfBirth`)}
                />
                {errorFor(errors, `${path}.dateOfBirth`) && (
                  <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `${path}.dateOfBirth`)}</span>
                )}
              </label>
              <label className='text-sm font-bold text-slate-800'>
                School <span className='font-normal text-slate-500'>(optional)</span>
                <input
                  value={child.school}
                  onChange={event => update(index, { ...child, school: event.target.value })}
                  className={fieldClass(errorFor(errors, `${path}.school`))}
                  placeholder='School name, if applicable'
                  list='school-alternatives'
                  aria-invalid={!!errorFor(errors, `${path}.school`)}
                />
                {errorFor(errors, `${path}.school`) && (
                  <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `${path}.school`)}</span>
                )}
              </label>
            </div>

            <div className='mt-6 space-y-5 border-t border-slate-200 pt-5'>
              <YesNoChoice
                label='Allergies or dietary requirements?'
                value={child.allergies.hasDetails}
                error={errorFor(errors, `${path}.allergies.hasDetails`)}
                onChange={hasDetails =>
                  update(index, { ...child, allergies: { hasDetails, details: hasDetails ? child.allergies.details : undefined } })
                }
              />
              {child.allergies.hasDetails && (
                <label className='block text-sm font-bold text-slate-800'>
                  What should our team know? <span className='text-red-600'>*</span>
                  <textarea
                    value={child.allergies.details || ''}
                    onChange={event => update(index, { ...child, allergies: { hasDetails: true, details: event.target.value } })}
                    rows={3}
                    className={fieldClass(errorFor(errors, `${path}.allergies.details`))}
                  />
                  {errorFor(errors, `${path}.allergies.details`) && (
                    <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `${path}.allergies.details`)}</span>
                  )}
                </label>
              )}

              <YesNoChoice
                label='Medical, accessibility or support needs?'
                value={child.supportNeeds.hasDetails}
                error={errorFor(errors, `${path}.supportNeeds.hasDetails`)}
                onChange={hasDetails =>
                  update(index, { ...child, supportNeeds: { hasDetails, details: hasDetails ? child.supportNeeds.details : undefined } })
                }
              />
              {child.supportNeeds.hasDetails && (
                <label className='block text-sm font-bold text-slate-800'>
                  How can we safely support this child? <span className='text-red-600'>*</span>
                  <textarea
                    value={child.supportNeeds.details || ''}
                    onChange={event => update(index, { ...child, supportNeeds: { hasDetails: true, details: event.target.value } })}
                    rows={3}
                    className={fieldClass(errorFor(errors, `${path}.supportNeeds.details`))}
                  />
                  {errorFor(errors, `${path}.supportNeeds.details`) && (
                    <span className='mt-1 block font-normal text-red-700'>{errorFor(errors, `${path}.supportNeeds.details`)}</span>
                  )}
                </label>
              )}
              <p className='rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900'>
                We ask so our team can safely support your child. Only staff who need this information can access it.
              </p>
            </div>
          </section>
        )
      })}

      <datalist id='school-alternatives'>
        <option value='Home educated' />
        <option value='Not currently attending' />
      </datalist>

      {childrenData.length > 0 && (
        <button
          type='button'
          onClick={addChild}
          className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-5 py-4 font-bold text-slate-600 hover:border-primary-400 hover:text-primary-800'
        >
          <PlusIcon className='h-5 w-5' /> Add another child
        </button>
      )}
    </div>
  )
}

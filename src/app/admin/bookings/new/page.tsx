'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'
import { CheckCircleIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Options {
  igniteSessions: { id: string; label: string; priceWeekly: number }[]
  campLocations: { id: string; name: string; allDay: boolean }[]
  parties: { id: string; name: string; price: number }[]
  partyStartTimes: string[]
}

interface StudentOption {
  id: string
  name: string
  birthdate: string
}

type Kind = 'ignite' | 'camp' | 'party'
type Preview = { summary: string; count: number; suggestedAmount: number } | { error: string } | null
type Created = { studentId: string; customerEmail: string; count: number; summary: string; amount: number }

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
const input = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:ring-orange-500 sm:text-sm'
const label = 'mb-1 block text-sm font-medium text-gray-700'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-xl border border-gray-200 bg-white p-4 sm:p-5'>
      <h2 className='mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500'>{title}</h2>
      {children}
    </section>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      className='mb-4 grid gap-1 rounded-lg bg-gray-100 p-1'
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(option => (
        <button
          key={option.value}
          type='button'
          onClick={() => onChange(option.value)}
          className={clsx(
            'rounded-md px-3 py-2 text-sm font-medium',
            value === option.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function AddBookingForm() {
  const searchParams = useSearchParams()
  const [options, setOptions] = useState<Options | null>(null)
  const [students, setStudents] = useState<StudentOption[]>([])

  const [childMode, setChildMode] = useState<'existing' | 'new'>('existing')
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState<StudentOption | null>(null)
  const [child, setChild] = useState({ firstName: '', lastName: '', birthdate: '', school: '', allergies: '', medicalNotes: '' })
  const [parent, setParent] = useState({ name: '', email: '', phone: '' })

  const [kind, setKind] = useState<Kind>('ignite')
  const [ignite, setIgnite] = useState({ sessionId: '', fromDate: todayKey() })
  const [camp, setCamp] = useState({ locationId: '', allDay: false, dates: [] as string[], next: '' })
  const [party, setParty] = useState({ productId: '', date: '', startTime: '', atVenue: false, venueAddress: '' })

  const [payment, setPayment] = useState<'invoiced' | 'complimentary'>('invoiced')
  const [amount, setAmount] = useState('')
  const [amountEdited, setAmountEdited] = useState(false)

  const [preview, setPreview] = useState<Preview>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [created, setCreated] = useState<Created | null>(null)

  useEffect(() => {
    fetch('/api/admin/bookings/manual')
      .then(response => response.json())
      .then((data: Options) => {
        setOptions(data)
        setIgnite(current => ({ ...current, sessionId: data.igniteSessions[0]?.id ?? '' }))
        setCamp(current => ({ ...current, locationId: data.campLocations[0]?.id ?? '' }))
        setParty(current => ({ ...current, productId: data.parties[0]?.id ?? '', startTime: data.partyStartTimes[0] ?? '' }))
      })
    fetch('/api/admin/students')
      .then(response => response.json())
      .then((data: StudentOption[]) => {
        setStudents(data)
        const preselected = data.find(candidate => candidate.id === searchParams.get('studentId'))
        if (preselected) chooseStudent(preselected)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function chooseStudent(choice: StudentOption) {
    setStudent(choice)
    setSearch('')
    fetch(`/api/admin/students/${choice.id}`)
      .then(response => response.json())
      .then(detail => {
        const contact = detail.parentContact
        setParent({
          name: contact?.name || detail.emergencyContactName || '',
          email: contact?.email || '',
          phone: contact?.phone || detail.emergencyContactPhone || ''
        })
      })
  }

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return []
    return students.filter(candidate => candidate.name.toLowerCase().includes(term)).slice(0, 8)
  }, [search, students])

  const booking = useMemo(() => {
    if (kind === 'ignite') return ignite.sessionId && ignite.fromDate ? { kind, ...ignite } : null
    if (kind === 'camp')
      return camp.locationId && camp.dates.length ? { kind, locationId: camp.locationId, allDay: camp.allDay, dates: camp.dates } : null
    if (!party.productId || !party.date || !party.startTime) return null
    return {
      kind,
      productId: party.productId,
      date: party.date,
      startTime: party.startTime,
      venueAddress: party.atVenue ? party.venueAddress : undefined
    }
  }, [kind, ignite, camp, party])

  // Preview what will be booked whenever the choice changes.
  useEffect(() => {
    if (!booking) {
      setPreview(null)
      if (!amountEdited) setAmount('')
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch('/api/admin/bookings/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview: true, booking, student: student ? { id: student.id } : undefined }),
        signal: controller.signal
      })
        .then(async response => {
          const body = await response.json()
          setPreview(response.ok ? body : { error: body.error || 'Could not check this booking' })
          if (!amountEdited) setAmount(response.ok ? body.suggestedAmount.toFixed(2) : '')
        })
        .catch(() => {})
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [booking, student, amountEdited])

  const selectedCamp = options?.campLocations.find(location => location.id === camp.locationId)
  const childReady = childMode === 'existing' ? !!student : !!(child.firstName.trim() && child.lastName.trim() && child.birthdate)
  const previewOk = !!preview && !('error' in preview)
  const ready = childReady && parent.name.trim() && parent.email.trim() && previewOk && (payment === 'complimentary' || amount !== '')

  async function submit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const response = await fetch('/api/admin/bookings/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: childMode === 'existing' && student ? { id: student.id } : child,
          parent,
          booking,
          payment: payment === 'invoiced' ? { kind: 'invoiced', amount: Number(amount) } : { kind: 'complimentary' }
        })
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Failed to add the booking')
      setCreated(body)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add the booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className='mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center'>
        <CheckCircleIcon className='mx-auto h-12 w-12 text-green-600' />
        <h1 className='mt-3 text-xl font-bold text-gray-900'>Booking added</h1>
        <p className='mt-2 text-gray-700'>{created.summary}</p>
        <p className='mt-1 text-sm text-gray-500'>
          {created.count} {created.count === 1 ? 'session' : 'sessions'} ·{' '}
          {created.amount > 0 ? `$${created.amount.toFixed(2)} invoiced` : 'Complimentary'}
        </p>
        <div className='mt-6 grid gap-2 sm:grid-cols-2'>
          <Link
            href={`/admin/students/${created.studentId}`}
            className='rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700'
          >
            View child
          </Link>
          <Link
            href={`/admin/customers/${encodeURIComponent(created.customerEmail)}`}
            className='rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
          >
            View customer
          </Link>
        </div>
        <button
          type='button'
          onClick={() => window.location.assign('/admin/bookings/new')}
          className='mt-4 text-sm font-medium text-orange-700 hover:underline'
        >
          Add another booking
        </button>
      </div>
    )
  }

  if (!options) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600' />
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-2xl space-y-4'>
      <div>
        <h1 className='text-xl font-bold text-gray-900 sm:text-2xl'>Add booking</h1>
        <p className='text-sm text-gray-500'>For bookings made outside checkout, such as a term you invoice directly.</p>
      </div>

      <Section title='Child'>
        <Segmented
          value={childMode}
          onChange={setChildMode}
          options={[
            { value: 'existing', label: 'Existing child' },
            { value: 'new', label: 'New child' }
          ]}
        />
        {childMode === 'existing' ? (
          student ? (
            <div className='flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2.5'>
              <div>
                <div className='font-medium text-gray-900'>{student.name}</div>
                <div className='text-xs text-gray-500'>
                  Born {new Date(student.birthdate).toLocaleDateString('en-AU', { timeZone: 'UTC' })}
                </div>
              </div>
              <button
                type='button'
                onClick={() => setStudent(null)}
                className='rounded-md p-1.5 text-gray-500 hover:bg-orange-100'
                aria-label='Change child'
              >
                <XMarkIcon className='h-5 w-5' />
              </button>
            </div>
          ) : (
            <div>
              <div className='relative'>
                <MagnifyingGlassIcon className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder='Search by name'
                  className={clsx(input, 'pl-10')}
                  autoFocus
                />
              </div>
              {matches.length > 0 && (
                <ul className='mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200'>
                  {matches.map(match => (
                    <li key={match.id}>
                      <button
                        type='button'
                        onClick={() => chooseStudent(match)}
                        className='w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50'
                      >
                        {match.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {search.trim() && matches.length === 0 && (
                <p className='mt-2 text-sm text-gray-500'>
                  No match.{' '}
                  <button type='button' onClick={() => setChildMode('new')} className='font-medium text-orange-700 hover:underline'>
                    Add a new child
                  </button>
                </p>
              )}
            </div>
          )
        ) : (
          <div className='grid gap-3 sm:grid-cols-2'>
            <div>
              <label className={label}>First name</label>
              <input value={child.firstName} onChange={event => setChild({ ...child, firstName: event.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Last name</label>
              <input value={child.lastName} onChange={event => setChild({ ...child, lastName: event.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Date of birth</label>
              <input
                type='date'
                value={child.birthdate}
                onChange={event => setChild({ ...child, birthdate: event.target.value })}
                className={input}
              />
            </div>
            <div>
              <label className={label}>
                School <span className='font-normal text-gray-400'>(optional)</span>
              </label>
              <input value={child.school} onChange={event => setChild({ ...child, school: event.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>
                Allergies <span className='font-normal text-gray-400'>(optional)</span>
              </label>
              <input value={child.allergies} onChange={event => setChild({ ...child, allergies: event.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>
                Medical notes <span className='font-normal text-gray-400'>(optional)</span>
              </label>
              <input
                value={child.medicalNotes}
                onChange={event => setChild({ ...child, medicalNotes: event.target.value })}
                className={input}
              />
            </div>
          </div>
        )}
      </Section>

      <Section title='Parent'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='sm:col-span-2'>
            <label className={label}>Name</label>
            <input
              value={parent.name}
              onChange={event => setParent({ ...parent, name: event.target.value })}
              className={input}
              autoComplete='off'
            />
          </div>
          <div>
            <label className={label}>Email</label>
            <input
              type='email'
              value={parent.email}
              onChange={event => setParent({ ...parent, email: event.target.value })}
              className={input}
              autoComplete='off'
            />
          </div>
          <div>
            <label className={label}>
              Phone <span className='font-normal text-gray-400'>(optional)</span>
            </label>
            <input
              type='tel'
              value={parent.phone}
              onChange={event => setParent({ ...parent, phone: event.target.value })}
              className={input}
              autoComplete='off'
            />
          </div>
        </div>
      </Section>

      <Section title='Booking'>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'ignite', label: 'Ignite term' },
            { value: 'camp', label: 'Camp' },
            { value: 'party', label: 'Party' }
          ]}
        />

        {kind === 'ignite' && (
          <div className='grid gap-3 sm:grid-cols-[1fr_auto]'>
            <div>
              <label className={label}>Session</label>
              <select
                value={ignite.sessionId}
                onChange={event => setIgnite({ ...ignite, sessionId: event.target.value })}
                className={input}
              >
                {options.igniteSessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Starting</label>
              <input
                type='date'
                value={ignite.fromDate}
                onChange={event => setIgnite({ ...ignite, fromDate: event.target.value })}
                className={input}
              />
            </div>
          </div>
        )}

        {kind === 'camp' && (
          <div className='space-y-3'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div>
                <label className={label}>Location</label>
                <select
                  value={camp.locationId}
                  onChange={event => setCamp({ ...camp, locationId: event.target.value, allDay: false })}
                  className={input}
                >
                  {options.campLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCamp?.allDay && (
                <div>
                  <label className={label}>Hours</label>
                  <select
                    value={camp.allDay ? 'allday' : 'day'}
                    onChange={event => setCamp({ ...camp, allDay: event.target.value === 'allday' })}
                    className={input}
                  >
                    <option value='day'>Day camp, 9am–3pm</option>
                    <option value='allday'>All day camp, 9am–5pm</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className={label}>Days</label>
              <div className='flex gap-2'>
                <input
                  type='date'
                  value={camp.next}
                  min={todayKey()}
                  onChange={event => setCamp({ ...camp, next: event.target.value })}
                  className={input}
                />
                <button
                  type='button'
                  disabled={!camp.next || camp.dates.includes(camp.next)}
                  onClick={() => setCamp({ ...camp, dates: [...camp.dates, camp.next].sort(), next: '' })}
                  className='rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-40'
                >
                  Add
                </button>
              </div>
              {camp.dates.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-2'>
                  {camp.dates.map(date => (
                    <span
                      key={date}
                      className='inline-flex items-center gap-1 rounded-full bg-orange-100 py-1 pl-3 pr-1.5 text-sm text-orange-900'
                    >
                      {new Date(`${date}T12:00:00Z`).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'UTC'
                      })}
                      <button
                        type='button'
                        onClick={() => setCamp({ ...camp, dates: camp.dates.filter(other => other !== date) })}
                        className='rounded-full p-0.5 hover:bg-orange-200'
                        aria-label='Remove day'
                      >
                        <XMarkIcon className='h-4 w-4' />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {kind === 'party' && (
          <div className='space-y-3'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div>
                <label className={label}>Party</label>
                <select value={party.productId} onChange={event => setParty({ ...party, productId: event.target.value })} className={input}>
                  {options.parties.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Date</label>
                <input
                  type='date'
                  value={party.date}
                  min={todayKey()}
                  onChange={event => setParty({ ...party, date: event.target.value })}
                  className={input}
                />
              </div>
            </div>
            <div>
              <label className={label}>Start time</label>
              <div className='grid grid-cols-3 gap-2'>
                {options.partyStartTimes.map(time => (
                  <button
                    key={time}
                    type='button'
                    onClick={() => setParty({ ...party, startTime: time })}
                    className={clsx(
                      'rounded-lg border px-3 py-2 text-sm font-medium',
                      party.startTime === time ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-gray-300 text-gray-700'
                    )}
                  >
                    {new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            </div>
            <label className='flex items-center gap-2 text-sm text-gray-700'>
              <input
                type='checkbox'
                checked={party.atVenue}
                onChange={event => setParty({ ...party, atVenue: event.target.checked })}
                className='h-4 w-4 rounded border-gray-300 text-orange-600'
              />
              At the family&apos;s venue
            </label>
            {party.atVenue && (
              <input
                value={party.venueAddress}
                onChange={event => setParty({ ...party, venueAddress: event.target.value })}
                placeholder='Venue address'
                className={input}
              />
            )}
          </div>
        )}

        {preview && (
          <div
            className={clsx(
              'mt-4 flex gap-2 rounded-lg px-3 py-2.5 text-sm',
              'error' in preview ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-900'
            )}
          >
            {'error' in preview ? (
              <>
                <ExclamationTriangleIcon className='h-5 w-5 flex-shrink-0' /> {preview.error}
              </>
            ) : (
              <>
                <CheckCircleIcon className='h-5 w-5 flex-shrink-0' />
                <span>{preview.summary}</span>
              </>
            )}
          </div>
        )}
      </Section>

      <Section title='Payment'>
        <Segmented
          value={payment}
          onChange={setPayment}
          options={[
            { value: 'invoiced', label: 'Invoiced' },
            { value: 'complimentary', label: 'Complimentary' }
          ]}
        />
        {payment === 'invoiced' ? (
          <div>
            <label className={label}>Amount invoiced (AUD)</label>
            <div className='relative'>
              <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>$</span>
              <input
                type='number'
                inputMode='decimal'
                min='0'
                step='0.01'
                value={amount}
                onChange={event => {
                  setAmount(event.target.value)
                  setAmountEdited(true)
                }}
                className={clsx(input, 'pl-7')}
              />
            </div>
            <p className='mt-1 text-xs text-gray-500'>
              Counts as revenue today. {previewOk && !('error' in preview!) && `Normal price $${preview!.suggestedAmount.toFixed(2)}.`}
            </p>
          </div>
        ) : (
          <p className='text-sm text-gray-600'>No charge. The booking is recorded at $0.</p>
        )}
      </Section>

      {submitError && <div className='rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800'>{submitError}</div>}

      <div>
        <button
          type='button'
          onClick={submit}
          disabled={!ready || submitting}
          className='w-full rounded-lg bg-orange-600 px-4 py-3 text-base font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40'
        >
          {submitting ? 'Adding…' : 'Add booking'}
        </button>
      </div>
    </div>
  )
}

export default function AddBookingPage() {
  return (
    <Suspense>
      <AddBookingForm />
    </Suspense>
  )
}

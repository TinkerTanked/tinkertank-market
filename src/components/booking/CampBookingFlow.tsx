'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LocationStep from './LocationStep'
import DateStep from './DateStep'
import CampTypeStep from './CampTypeStep'
import BookingShell from './shared/BookingShell'
import BookingSummary, { getCampTotal } from './shared/BookingSummary'
import ChildrenStep from './shared/ChildrenStep'
import ContactStep from './shared/ContactStep'
import ReviewStep from './shared/ReviewStep'
import {
  CampBookingDraftSchema,
  calculateAgeOnDate,
  fromCalendarDate,
  toCalendarDate,
  validateCampBooking,
  type BookingValidationError,
  type CampBookingDraft,
  type CampLocation,
  type CampType,
} from '@/lib/bookingSchema'
import { DEFAULT_CAMP_DAILY_CAPACITY, getLocationAvailabilityById } from '@/data/locationAvailability'
import { trackEvent } from '@/lib/analytics'

const STEP_NAMES = ['selection', 'children', 'contact', 'review'] as const

function configuredLocation(locationId: string | null): CampLocation | null {
  if (!locationId) return null
  const location = getLocationAvailabilityById(locationId)
  if (!location) return null
  return {
    id: location.locationId,
    name: location.locationName,
    address: location.address,
    capacity: location.dailyCapacity ?? DEFAULT_CAMP_DAILY_CAPACITY,
  }
}

function createInitialDraft(locationId: string | null): CampBookingDraft {
  return {
    version: 1,
    kind: 'camp',
    currentStep: 1,
    selection: {
      location: configuredLocation(locationId),
      dates: [],
      campType: null,
    },
    children: [],
    contact: { firstName: '', lastName: '', email: '', mobile: '' },
    emergencyContact: { sameAsBookingContact: true },
  }
}

function errorsForStep(errors: BookingValidationError[], step: number) {
  if (step === 1) return errors.filter(error => error.path.startsWith('selection.'))
  if (step === 2)
    return errors.filter(
      error => error.path === 'children' || (error.path.startsWith('children.') && !error.path.includes('emergencyContactOverride'))
    )
  if (step === 3)
    return errors.filter(
      error =>
        error.path.startsWith('contact.') || error.path.startsWith('emergencyContact.') || error.path.includes('emergencyContactOverride')
    )
  return errors
}

export default function CampBookingFlow() {
  const searchParams = useSearchParams()
  const initialLocationId = searchParams.get('location')
  const canceled = searchParams.get('canceled') === 'true'
  const [draft, setDraft] = useState<CampBookingDraft>(() => createInitialDraft(initialLocationId))
  const [requestedLocation, setRequestedLocation] = useState<CampLocation | null>(null)
  const [errors, setErrors] = useState<BookingValidationError[]>([])
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)
  const [isContinuing, setIsContinuing] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasTrackedStart = useRef(false)

  const saveDraft = useCallback(async (value: CampBookingDraft) => {
    const response = await fetch('/api/booking-draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    })
    if (!response.ok) throw new Error('We could not save your booking progress.')
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/booking-draft')
      .then(async response => {
        if (!response.ok) return null
        return response.json()
      })
      .then(data => {
        if (!active || !data?.draft) return
        const parsed = CampBookingDraftSchema.safeParse(data.draft)
        if (!parsed.success) return

        const locationFromLink = configuredLocation(initialLocationId)
        const recoveredLocation = parsed.data.selection.location
        if (locationFromLink && recoveredLocation && locationFromLink.id !== recoveredLocation.id) {
          setRequestedLocation(locationFromLink)
        } else if (locationFromLink && !recoveredLocation) {
          parsed.data.selection.location = locationFromLink
        }
        setDraft(parsed.data)
      })
      .finally(() => {
        if (active) setIsLoadingDraft(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (isLoadingDraft) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveDraft(draft).catch(() => undefined)
    }, 700)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [draft, isLoadingDraft, saveDraft])

  useEffect(() => {
    if (isLoadingDraft) return
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true
      trackEvent(
        'booking_started',
        {
          product_kind: 'camp',
          source: searchParams.get('source') || 'camp_cta',
          location_id: draft.selection.location?.id,
        },
        { meta: false }
      )
      if (canceled) trackEvent('payment_cancelled', { product_kind: 'camp' }, { meta: false })
    }
  }, [canceled, draft.selection.location?.id, isLoadingDraft, searchParams])

  useEffect(() => {
    if (isLoadingDraft) return
    trackEvent(
      'booking_step_viewed',
      {
        product_kind: 'camp',
        step_name: STEP_NAMES[draft.currentStep - 1],
        step_number: draft.currentStep,
      },
      { meta: false }
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [draft.currentStep, isLoadingDraft])

  const total = getCampTotal(draft)
  const selectionDates = useMemo(() => draft.selection.dates.map(fromCalendarDate), [draft.selection.dates])

  const updateDraft = (update: Partial<CampBookingDraft>) => setDraft(current => ({ ...current, ...update }))

  const switchToRequestedLocation = () => {
    if (!requestedLocation) return
    setDraft(current => ({
      ...current,
      currentStep: 1,
      selection: { location: requestedLocation, dates: [], campType: null },
    }))
    setRequestedLocation(null)
    setErrors([])
  }

  const validateStep = (step: number) => {
    const stepErrors = errorsForStep(validateCampBooking(draft), step)
    setErrors(stepErrors)
    if (stepErrors.length > 0) {
      trackEvent(
        'booking_validation_error',
        {
          product_kind: 'camp',
          step_name: STEP_NAMES[step - 1],
          field_key: stepErrors[0].path,
          error_code: 'required_or_invalid',
        },
        { meta: false }
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return false
    }
    return true
  }

  const goToStep = async (step: number) => {
    const nextDraft = { ...draft, currentStep: step }
    setDraft(nextDraft)
    setErrors([])
    setCheckoutError(null)
    await saveDraft(nextDraft).catch(() => undefined)
  }

  const continueFlow = async () => {
    if (!validateStep(draft.currentStep)) return

    if (draft.currentStep < 4) {
      trackEvent(
        'booking_step_completed',
        {
          product_kind: 'camp',
          step_name: STEP_NAMES[draft.currentStep - 1],
          step_number: draft.currentStep,
          child_count: draft.children.length,
          date_count: draft.selection.dates.length,
        },
        { meta: false }
      )

      const nextStep = draft.currentStep + 1
      if (nextStep === 4) {
        trackEvent('begin_checkout', {
          currency: 'AUD',
          value: total,
          items: analyticsItems(draft),
        })
      }
      await goToStep(nextStep)
      return
    }

    await beginPayment()
  }

  const beginPayment = async () => {
    const { location, campType, dates } = draft.selection
    if (!location || !campType || dates.length === 0) return

    setIsContinuing(true)
    setCheckoutError(null)
    try {
      await saveDraft(draft)
      const defaultEmergency = draft.emergencyContact.sameAsBookingContact
        ? {
            name: `${draft.contact.firstName} ${draft.contact.lastName}`.trim(),
            phone: draft.contact.mobile,
          }
        : {
            name: `${draft.emergencyContact.contact.firstName} ${draft.emergencyContact.contact.lastName}`.trim(),
            phone: draft.emergencyContact.contact.mobile,
            relationship: draft.emergencyContact.contact.relationship,
          }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingSchemaVersion: 1,
          items: [
            {
              productId: campType.id,
              quantity: draft.children.length,
              students: draft.children.map(child => {
                const childEmergency = child.emergencyContactOverride
                  ? {
                      name: `${child.emergencyContactOverride.firstName} ${child.emergencyContactOverride.lastName}`.trim(),
                      phone: child.emergencyContactOverride.mobile,
                      relationship: child.emergencyContactOverride.relationship,
                    }
                  : defaultEmergency
                return {
                  firstName: child.firstName.trim(),
                  lastName: child.lastName.trim(),
                  dateOfBirth: child.dateOfBirth,
                  age: calculateAgeOnDate(child.dateOfBirth, dates[0]) ?? undefined,
                  school: child.school.trim(),
                  parentName: `${draft.contact.firstName} ${draft.contact.lastName}`.trim(),
                  parentEmail: draft.contact.email.trim(),
                  parentPhone: draft.contact.mobile.trim(),
                  allergies: child.allergies.hasDetails ? child.allergies.details?.trim() : undefined,
                  medicalNotes: child.supportNeeds.hasDetails ? child.supportNeeds.details?.trim() : undefined,
                  emergencyContact: childEmergency,
                }
              }),
              selectedDate: dates[0],
              selectedDates: dates,
              productName: campType.name,
              productPrice: campType.price,
              location: location.name,
            },
          ],
          customerInfo: {
            name: `${draft.contact.firstName} ${draft.contact.lastName}`.trim(),
            firstName: draft.contact.firstName.trim(),
            lastName: draft.contact.lastName.trim(),
            email: draft.contact.email.trim(),
            phone: draft.contact.mobile.trim(),
          },
          emergencyContact: defaultEmergency,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'We could not start secure payment. Please try again.')

      trackEvent('add_payment_info', {
        currency: 'AUD',
        value: total,
        payment_type: 'Stripe',
        items: analyticsItems(draft),
      })
      window.location.href = data.url
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'We could not start secure payment. Please try again.')
      setIsContinuing(false)
    }
  }

  if (isLoadingDraft) {
    return (
      <div className='min-h-[60vh] bg-slate-50 py-24 text-center'>
        <p className='font-semibold text-slate-600'>Loading your booking…</p>
      </div>
    )
  }

  const continueLabels = ['Continue — add children', 'Continue — your details', 'Continue — review booking', `Pay $${total.toFixed(2)}`]

  return (
    <>
      {canceled && (
        <div className='border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900'>
          Payment was cancelled. Nothing was charged and your booking details are still here.
        </div>
      )}
      {requestedLocation && draft.selection.location && (
        <div className='border-b border-blue-200 bg-blue-50 px-4 py-4 text-blue-950'>
          <div className='mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm leading-6'>
              We restored your {draft.selection.location.name} booking. Would you rather book at {requestedLocation.name}?
            </p>
            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => setRequestedLocation(null)}
                className='rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-bold text-blue-900'
              >
                Keep {draft.selection.location.name}
              </button>
              <button
                type='button'
                onClick={switchToRequestedLocation}
                className='rounded-lg bg-blue-900 px-3 py-2 text-sm font-bold text-white'
              >
                Switch to {requestedLocation.name}
              </button>
            </div>
          </div>
        </div>
      )}
      <BookingShell
        currentStep={draft.currentStep}
        summary={<BookingSummary draft={draft} />}
        onBack={draft.currentStep > 1 ? () => goToStep(draft.currentStep - 1) : undefined}
        onContinue={continueFlow}
        continueLabel={continueLabels[draft.currentStep - 1]}
        isContinuing={isContinuing}
      >
        {draft.currentStep === 1 && <CampSelectionStep draft={draft} errors={errors} onChange={selection => updateDraft({ selection })} />}
        {draft.currentStep === 2 && (
          <ChildrenStep childrenData={draft.children} errors={errors} onChange={children => updateDraft({ children })} />
        )}
        {draft.currentStep === 3 && (
          <ContactStep
            contact={draft.contact}
            emergencyContact={draft.emergencyContact}
            childrenData={draft.children}
            errors={errors}
            onContactChange={contact => updateDraft({ contact })}
            onEmergencyChange={emergencyContact => updateDraft({ emergencyContact })}
            onChildrenChange={children => updateDraft({ children })}
          />
        )}
        {draft.currentStep === 4 && <ReviewStep draft={draft} onEdit={goToStep} error={checkoutError} />}
      </BookingShell>
    </>
  )
}

function CampSelectionStep({
  draft,
  errors,
  onChange,
}: {
  draft: CampBookingDraft
  errors: BookingValidationError[]
  onChange: (selection: CampBookingDraft['selection']) => void
}) {
  const selection = draft.selection
  const selectedDates = selection.dates.map(fromCalendarDate)
  return (
    <div className='space-y-10'>
      <div>
        <h2 className='font-display text-2xl font-bold text-slate-950 sm:text-3xl'>Choose your camp</h2>
        <p className='mt-2 text-slate-600'>Choose a location, one or more dates and the camp day that suits your family.</p>
      </div>
      {errors.length > 0 && (
        <div role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800'>
          {errors[0].message}
        </div>
      )}
      <LocationStep
        selectedLocation={selection.location}
        onLocationSelect={location => onChange({ location, dates: [], campType: null })}
      />
      {selection.location && (
        <DateStep
          selectedDate={selectedDates[0] || null}
          selectedDates={selectedDates}
          onDateSelect={() => undefined}
          onDatesSelect={dates => onChange({ ...selection, dates: dates.map(toCalendarDate), campType: null })}
          location={selection.location}
          enableMultiSelect
        />
      )}
      {selection.location && selection.dates.length > 0 && (
        <CampTypeStep
          selectedCampType={selection.campType}
          onCampTypeSelect={(campType: CampType) => onChange({ ...selection, campType })}
          date={selectedDates[0]}
          location={selection.location}
          selectedDateCount={selectedDates.length}
          selectedDates={selectedDates}
        />
      )}
    </div>
  )
}

function analyticsItems(draft: CampBookingDraft) {
  const { campType, location, dates } = draft.selection
  if (!campType) return []
  return [
    {
      item_id: campType.id,
      item_name: campType.name,
      item_category: 'camps',
      item_variant: `${dates.length} ${dates.length === 1 ? 'day' : 'days'}`,
      location_id: location?.id,
      price: campType.price,
      quantity: campType.isBundle ? draft.children.length : draft.children.length * dates.length,
    },
  ]
}

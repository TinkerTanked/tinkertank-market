import { describe, expect, it } from 'vitest'
import { calculateAgeOnDate, validateCampBooking, type CampBookingDraft } from '@/lib/bookingSchema'

function validDraft(): CampBookingDraft {
  return {
    version: 1,
    kind: 'camp',
    currentStep: 4,
    selection: {
      location: {
        id: 'neutral-bay',
        name: 'TinkerTank Neutral Bay',
        address: '50 Yeo St, Neutral Bay NSW 2089',
        capacity: 35,
      },
      dates: ['2026-09-29'],
      campType: {
        id: 'day-camp',
        type: 'day',
        name: 'Day Camp',
        price: 119.99,
        duration: '6 hours',
        time: '9:00 AM - 3:00 PM',
      },
    },
    children: [
      {
        id: 'child-1',
        firstName: 'Ari',
        lastName: 'Smith',
        dateOfBirth: '2016-09-29',
        school: 'Neutral Bay Public School',
        allergies: { hasDetails: false },
        supportNeeds: { hasDetails: false },
      },
    ],
    contact: {
      firstName: 'Jamie',
      lastName: 'Smith',
      email: 'jamie@example.com',
      mobile: '0412 345 678',
    },
    emergencyContact: { sameAsBookingContact: true },
  }
}

describe('unified booking schema', () => {
  it('calculates age on the activity date rather than today', () => {
    expect(calculateAgeOnDate('2016-09-29', '2026-09-28')).toBe(9)
    expect(calculateAgeOnDate('2016-09-29', '2026-09-29')).toBe(10)
  })

  it('handles leap-day birthdays deterministically', () => {
    expect(calculateAgeOnDate('2016-02-29', '2026-02-28')).toBe(9)
    expect(calculateAgeOnDate('2016-02-29', '2026-03-01')).toBe(10)
  })

  it('accepts a complete camp booking with the parent as emergency contact', () => {
    expect(validateCampBooking(validDraft())).toEqual([])
  })

  it('accepts a participant who is 16 on the camp date and rejects one who is 17', () => {
    const draft = validDraft()
    draft.children[0].dateOfBirth = '2010-07-14'
    expect(validateCampBooking(draft)).toEqual([])

    draft.children[0].dateOfBirth = '2009-09-29'
    expect(validateCampBooking(draft)).toContainEqual({
      path: 'children.0.dateOfBirth',
      message: 'Camp participants must be aged 6–16 on their camp date',
    })
  })

  it('allows a child to attend without supplying a school', () => {
    const draft = validDraft()
    draft.children[0].school = ''

    expect(validateCampBooking(draft)).toEqual([])
  })

  it('requires details when a parent answers yes to a support question', () => {
    const draft = validDraft()
    draft.children[0].allergies = { hasDetails: true, details: '' }

    expect(validateCampBooking(draft)).toContainEqual({
      path: 'children.0.allergies.details',
      message: 'Tell us about the allergy or dietary requirement',
    })
  })

  it('requires an explicit answer to each safety question', () => {
    const draft = validDraft()
    draft.children[0].allergies = { hasDetails: null }
    draft.children[0].supportNeeds = { hasDetails: null }

    expect(validateCampBooking(draft)).toEqual(
      expect.arrayContaining([
        {
          path: 'children.0.allergies.hasDetails',
          message: 'Select Yes or No for allergies and dietary requirements',
        },
        {
          path: 'children.0.supportNeeds.hasDetails',
          message: 'Select Yes or No for medical, accessibility or support needs',
        },
      ])
    )
  })

  it('validates an optional per-child emergency contact', () => {
    const draft = validDraft()
    draft.children[0].emergencyContactOverride = {
      firstName: 'Alex',
      lastName: '',
      mobile: '12',
    }

    const errors = validateCampBooking(draft)
    expect(errors.map(error => error.path)).toEqual(
      expect.arrayContaining(['children.0.emergencyContactOverride.lastName', 'children.0.emergencyContactOverride.mobile'])
    )
  })
})

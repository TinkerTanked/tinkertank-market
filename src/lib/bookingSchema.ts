import { z } from 'zod'

const boundedText = (max: number) => z.string().max(max)

export const EmergencyContactSchema = z.object({
  firstName: boundedText(80),
  lastName: boundedText(80),
  mobile: boundedText(40),
  relationship: boundedText(80).optional(),
})

export const BookingChildSchema = z.object({
  id: boundedText(100),
  firstName: boundedText(80),
  lastName: boundedText(80),
  dateOfBirth: boundedText(10),
  school: boundedText(160),
  allergies: z.object({
    hasDetails: z.boolean().nullable(),
    details: boundedText(1000).optional(),
  }),
  supportNeeds: z.object({
    hasDetails: z.boolean().nullable(),
    details: boundedText(1000).optional(),
  }),
  emergencyContactOverride: EmergencyContactSchema.optional(),
})

export const CampLocationSchema = z.object({
  id: boundedText(100),
  name: boundedText(160),
  address: boundedText(300),
  capacity: z.number().int().positive(),
})

export const CampTypeSchema = z.object({
  id: boundedText(100),
  type: z.enum(['day', 'allday', 'day-bundle', 'allday-bundle']),
  name: boundedText(160),
  price: z.number().positive(),
  duration: boundedText(80),
  time: boundedText(80),
  isBundle: z.boolean().optional(),
  bundleDays: z.number().int().positive().optional(),
})

export const CampBookingDraftSchema = z.object({
  version: z.literal(1),
  kind: z.literal('camp'),
  currentStep: z.number().int().min(1).max(4),
  selection: z.object({
    location: CampLocationSchema.nullable(),
    dates: z.array(boundedText(10)).max(20),
    campType: CampTypeSchema.nullable(),
  }),
  children: z.array(BookingChildSchema).max(20),
  contact: z.object({
    firstName: boundedText(80),
    lastName: boundedText(80),
    email: boundedText(254),
    mobile: boundedText(40),
  }),
  emergencyContact: z.discriminatedUnion('sameAsBookingContact', [
    z.object({ sameAsBookingContact: z.literal(true) }),
    z.object({
      sameAsBookingContact: z.literal(false),
      contact: EmergencyContactSchema,
    }),
  ]),
})

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>
export type BookingChild = z.infer<typeof BookingChildSchema>
export type CampLocation = z.infer<typeof CampLocationSchema>
export type CampType = z.infer<typeof CampTypeSchema>
export type CampBookingDraft = z.infer<typeof CampBookingDraftSchema>

export interface BookingValidationError {
  path: string
  message: string
}

function parseCalendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

export function calculateAgeOnDate(dateOfBirth: string, activityDate: string): number | null {
  const birth = parseCalendarDate(dateOfBirth)
  const activity = parseCalendarDate(activityDate)
  if (!birth || !activity || birth >= activity) return null

  let age = activity.getUTCFullYear() - birth.getUTCFullYear()
  const monthDifference = activity.getUTCMonth() - birth.getUTCMonth()
  if (monthDifference < 0 || (monthDifference === 0 && activity.getUTCDate() < birth.getUTCDate())) {
    age--
  }
  return age
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

function validateEmergencyContact(contact: EmergencyContact, path: string, errors: BookingValidationError[]) {
  if (!contact.firstName.trim()) errors.push({ path: `${path}.firstName`, message: 'Enter the emergency contact’s first name' })
  if (!contact.lastName.trim()) errors.push({ path: `${path}.lastName`, message: 'Enter the emergency contact’s last name' })
  if (!isValidPhone(contact.mobile)) errors.push({ path: `${path}.mobile`, message: 'Enter a valid emergency contact mobile number' })
}

export function validateCampBooking(draft: CampBookingDraft): BookingValidationError[] {
  const errors: BookingValidationError[] = []
  const { selection, children, contact, emergencyContact } = draft

  if (!selection.location) errors.push({ path: 'selection.location', message: 'Choose a camp location' })
  if (selection.dates.length === 0) errors.push({ path: 'selection.dates', message: 'Choose at least one camp date' })
  if (!selection.campType) errors.push({ path: 'selection.campType', message: 'Choose a camp format' })

  if (children.length === 0) errors.push({ path: 'children', message: 'Add at least one child' })
  children.forEach((child, index) => {
    const path = `children.${index}`
    if (!child.firstName.trim()) errors.push({ path: `${path}.firstName`, message: 'Enter the child’s first name' })
    if (!child.lastName.trim()) errors.push({ path: `${path}.lastName`, message: 'Enter the child’s last name' })
    if (child.allergies.hasDetails === null) {
      errors.push({ path: `${path}.allergies.hasDetails`, message: 'Select Yes or No for allergies and dietary requirements' })
    }
    if (child.supportNeeds.hasDetails === null) {
      errors.push({ path: `${path}.supportNeeds.hasDetails`, message: 'Select Yes or No for medical, accessibility or support needs' })
    }

    const ages = selection.dates.map(date => calculateAgeOnDate(child.dateOfBirth, date))
    if (ages.some(age => age === null)) {
      errors.push({ path: `${path}.dateOfBirth`, message: 'Enter a valid date of birth' })
    } else if (ages.some(age => age! < 6 || age! > 16)) {
      errors.push({ path: `${path}.dateOfBirth`, message: 'Camp participants must be aged 6–16 on their camp date' })
    }

    if (child.allergies.hasDetails && !child.allergies.details?.trim()) {
      errors.push({ path: `${path}.allergies.details`, message: 'Tell us about the allergy or dietary requirement' })
    }
    if (child.supportNeeds.hasDetails && !child.supportNeeds.details?.trim()) {
      errors.push({ path: `${path}.supportNeeds.details`, message: 'Tell us how we can safely support this child' })
    }
    if (child.emergencyContactOverride) {
      validateEmergencyContact(child.emergencyContactOverride, `${path}.emergencyContactOverride`, errors)
    }
  })

  if (!contact.firstName.trim()) errors.push({ path: 'contact.firstName', message: 'Enter your first name' })
  if (!contact.lastName.trim()) errors.push({ path: 'contact.lastName', message: 'Enter your last name' })
  if (!z.string().email().safeParse(contact.email.trim()).success) {
    errors.push({ path: 'contact.email', message: 'Enter a valid email address' })
  }
  if (!isValidPhone(contact.mobile)) errors.push({ path: 'contact.mobile', message: 'Enter a valid mobile number' })

  if (!emergencyContact.sameAsBookingContact) {
    validateEmergencyContact(emergencyContact.contact, 'emergencyContact.contact', errors)
  }

  return errors
}

export function toCalendarDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromCalendarDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

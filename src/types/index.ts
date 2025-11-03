// Main type exports for TinkerTank Market

// Student types
export type {
  Student,
  StudentInput,
  StudentFormInput,
} from './student'

export {
  StudentSchema,
  StudentFormSchema,
  calculateAge,
  isStudentValid,
  formatBirthdateForInput,
} from './student'

// Product types
export type {
  Product,
  Camp,
  BirthdayParty,
  Subscription,
  ProductPricing,
} from './product'

export {
  ProductType,
  CampType,
  BirthdayPackageType,
  SubscriptionType,
  ProductSchema,
  CampSchema,
  BirthdayPartySchema,
  SubscriptionSchema,
  ProductPricingSchema,
  BaseProductSchema,
  isCamp,
  isBirthdayParty,
  isSubscription,
  calculatePrice,
  isEarlyBirdEligible,
} from './product'

// Booking types
export type {
  BookingEvent,
  RecurringEventTemplate,
  CalendarEvent,
  AdminCalendarEvent,
  BookingInput,
  RecurringEventInput,
  CalendarEventInput,
} from './booking'

export {
  BookingStatus,
  PaymentStatus,
  BookingEventSchema,
  RecurringEventTemplateSchema,
  CalendarEventSchema,
  isBookingConfirmed,
  isBookingPaid,
  getBookingStatusColor,
  getPaymentStatusColor,
  bookingToCalendarEvent,
  canCancelBooking,
} from './booking'

// Cart types
export type {
  CartItem,
  CartState,
  DiscountInfo,
  CheckoutItem,
  CheckoutSummary,
  CheckoutSession,
  TimeSlot,
  CartActions,
  CartInput,
  CheckoutInput,
  TimeSlotInput,
} from './cart'

export {
  CartItemSchema,
  CartStateSchema,
  DiscountInfoSchema,
  CheckoutItemSchema,
  CheckoutSummarySchema,
  CheckoutSessionSchema,
  TimeSlotSchema,
  createCartItem,
  calculateCartTotals,
  calculateSiblingDiscount,
  isTimeSlotAvailable,
  formatTimeSlot,
} from './cart'

// Location types
export type {
  Location,
  DayOperatingHours,
  LocationInput,
  AddressInput,
  OperatingHoursInput,
} from './location'

export {
  LocationSchema,
  AddressSchema,
  CoordinatesSchema,
  ContactSchema,
  DayOperatingHoursSchema,
  OperatingHoursSchema,
  ParkingSchema,
  AccessibilitySchema,
  NEUTRAL_BAY_LOCATION,
  isLocationOpen,
  formatAddress,
  formatOperatingHours,
  getLocationOperatingHours,
  calculateDistanceFromCoords,
  isValidLocation,
  getGoogleMapsUrl,
  getGoogleMapsEmbedUrl,
} from './location'

// Common validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+61|0)[2-9]\d{8}$/
  return phoneRegex.test(phone)
}

export const validatePostcode = (postcode: string): boolean => {
  const postcodeRegex = /^\d{4}$/
  return postcodeRegex.test(postcode)
}

// Date utilities
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

export const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay()
  return day >= 1 && day <= 5 // Monday to Friday
}

// Re-export closure date utilities
export {
  isClosureDate,
  getClosureInfo,
  getClosureDatesForYear,
  getClosureDatesInRange,
  isDateAvailableForBooking,
  getNextAvailableDate,
  RECURRING_CLOSURE_DATES,
  SPECIFIC_CLOSURE_DATES,
  type ClosureDate,
} from '@/data/closureDates'

export const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  let addedDays = 0
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1)
    if (isBusinessDay(result)) {
      addedDays++
    }
  }
  
  return result
}

export const formatCurrency = (amount: number, currency = 'AUD'): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const options: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
    short: { day: 'numeric', month: 'short' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  }
  
  return new Intl.DateTimeFormat('en-AU', options[format]).format(date)
}

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

// Type guard utilities
export const hasProperty = <T, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && prop in obj
}

export const isNotNull = <T>(value: T | null): value is T => {
  return value !== null
}

export const isNotUndefined = <T>(value: T | undefined): value is T => {
  return value !== undefined
}

export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined
}

// Error types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface APIError {
  message: string
  code: string
  details?: Record<string, unknown>
}

export class TinkerTankError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'TinkerTankError'
  }
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: APIError
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, unknown>
}

export interface SearchParams extends PaginationParams {
  query?: string
  categories?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

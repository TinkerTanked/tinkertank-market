import { z } from 'zod'

// Product type enums
export enum ProductType {
  CAMP = 'CAMP',
  BIRTHDAY = 'BIRTHDAY',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum CampType {
  DAY_CAMP = 'DAY_CAMP',
  ALL_DAY_CAMP = 'ALL_DAY_CAMP',
}

export enum BirthdayPackageType {
  BASIC = 'BASIC',
  DELUXE = 'DELUXE',
  PREMIUM = 'PREMIUM',
}

export enum SubscriptionType {
  IGNITE_MONTHLY = 'IGNITE_MONTHLY',
  IGNITE_TERM = 'IGNITE_TERM',
}

// Pricing structure
export interface ProductPricing {
  basePrice: number
  earlyBirdDiscount?: number
  earlyBirdDeadline?: Date
  siblingDiscount?: number
}

// Product interface
export interface Product {
  id: string
  name: string
  description: string
  type: ProductType
  subtype?: CampType | BirthdayPackageType | SubscriptionType
  pricing: ProductPricing
  duration: number // in hours for camps/birthdays, in weeks for subscriptions
  capacity: number
  minAge: number
  maxAge: number
  imageUrl?: string
  features: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Camp specific interface
export interface Camp extends Product {
  type: ProductType.CAMP
  subtype: CampType
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  includesLunch: boolean
  pickupDropoffTimes?: {
    dropoff: string
    pickup: string
  }
}

// Birthday specific interface
export interface BirthdayParty extends Product {
  type: ProductType.BIRTHDAY
  subtype: BirthdayPackageType
  partyDuration: number
  maxGuests: number
  includesCake: boolean
  includesDecorations: boolean
  additionalServices?: string[]
}

// Subscription specific interface
export interface Subscription extends Product {
  type: ProductType.SUBSCRIPTION
  subtype: SubscriptionType
  sessionsPerWeek: number
  totalSessions: number
  skipPolicy?: string
}

// Zod schemas
export const ProductPricingSchema = z.object({
  basePrice: z.number().min(0, 'Price must be non-negative'),
  earlyBirdDiscount: z.number().min(0).max(1).optional(),
  earlyBirdDeadline: z.coerce.date().optional(),
  siblingDiscount: z.number().min(0).max(1).optional(),
})

export const BaseProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.nativeEnum(ProductType),
  pricing: ProductPricingSchema,
  duration: z.number().min(1, 'Duration must be positive'),
  capacity: z.number().min(1, 'Capacity must be positive'),
  minAge: z.number().min(2, 'Minimum age is 2'),
  maxAge: z.number().max(18, 'Maximum age is 18'),
  imageUrl: z.string().url().optional(),
  features: z.array(z.string()),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const CampSchema = BaseProductSchema.extend({
  type: z.literal(ProductType.CAMP),
  subtype: z.nativeEnum(CampType),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  includesLunch: z.boolean(),
  pickupDropoffTimes: z
    .object({
      dropoff: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      pickup: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })
    .optional(),
})

export const BirthdayPartySchema = BaseProductSchema.extend({
  type: z.literal(ProductType.BIRTHDAY),
  subtype: z.nativeEnum(BirthdayPackageType),
  partyDuration: z.number().min(1),
  maxGuests: z.number().min(1),
  includesCake: z.boolean(),
  includesDecorations: z.boolean(),
  additionalServices: z.array(z.string()).optional(),
})

export const SubscriptionSchema = BaseProductSchema.extend({
  type: z.literal(ProductType.SUBSCRIPTION),
  subtype: z.nativeEnum(SubscriptionType),
  sessionsPerWeek: z.number().min(1),
  totalSessions: z.number().min(1),
  skipPolicy: z.string().optional(),
})

export const ProductSchema = z.discriminatedUnion('type', [CampSchema, BirthdayPartySchema, SubscriptionSchema])

// Type guards
export const isCamp = (product: Product): product is Camp => {
  return product.type === ProductType.CAMP
}

export const isBirthdayParty = (product: Product): product is BirthdayParty => {
  return product.type === ProductType.BIRTHDAY
}

export const isSubscription = (product: Product): product is Subscription => {
  return product.type === ProductType.SUBSCRIPTION
}

// Utility functions
export const calculatePrice = (product: Product, isEarlyBird = false, hasSiblingDiscount = false): number => {
  let price = product.pricing.basePrice

  if (isEarlyBird && product.pricing.earlyBirdDiscount) {
    price *= 1 - product.pricing.earlyBirdDiscount
  }

  if (hasSiblingDiscount && product.pricing.siblingDiscount) {
    price *= 1 - product.pricing.siblingDiscount
  }

  return Math.round(price * 100) / 100 // Round to 2 decimal places
}

export const isEarlyBirdEligible = (product: Product): boolean => {
  if (!product.pricing.earlyBirdDeadline || !product.pricing.earlyBirdDiscount) {
    return false
  }
  return new Date() <= product.pricing.earlyBirdDeadline
}

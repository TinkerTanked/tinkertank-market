// Re-export the catalog types
import type { CatalogProduct } from '@/lib/productCatalog'

export type Product = CatalogProduct
export type { CatalogProduct }

export type ProductCategory = 'camps' | 'birthdays' | 'subscriptions' | 'ignite'

export interface AddOn {
  id: string
  name: string
  description: string
  price: number
  maxQuantity?: number
}

export interface ProductAvailability {
  type: 'weekdays' | 'any-day' | 'weekly' | 'flexible'
  timeSlots?: TimeSlot[]
  weekDays?: number[] // 0-6, Sunday-Saturday
  duration?: number // in minutes
}

export interface TimeSlot {
  start: string // HH:MM format
  end: string // HH:MM format
}

export interface ProductFilter {
  category?: ProductCategory
  ageRange?: string
  priceRange?: { min: number; max: number }
  location?: string
  searchQuery?: string
  tags?: string[]
}

export interface CartItem {
  product: Product
  quantity: number
  selectedAddOns?: { addOn: AddOn; quantity: number }[]
  selectedDate?: Date
  selectedTimeSlot?: TimeSlot
  totalPrice: number
}

import { z } from 'zod'
import { Product, calculatePrice, isEarlyBirdEligible } from './product'
import { Student } from './student'
import { Location } from './location'

// Cart item interface
export interface CartItem {
  id: string
  product: Product
  student: Student
  selectedDate: Date
  selectedTimeSlot: string
  location: Location
  quantity: number
  basePrice: number
  finalPrice: number
  discountsApplied: string[]
  addedAt: Date
}

// Cart state interface
export interface CartState {
  items: CartItem[]
  totalItems: number
  subtotal: number
  totalDiscount: number
  total: number
  appliedCoupons: string[]
  lastUpdated: Date
}

// Discount information
export interface DiscountInfo {
  type: 'EARLY_BIRD' | 'SIBLING' | 'COUPON' | 'BULK'
  amount: number
  description: string
  code?: string
}

// Checkout types
export interface CheckoutItem {
  cartItemId: string
  productId: string
  studentId: string
  selectedDate: Date
  selectedTimeSlot: string
  locationId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discounts: DiscountInfo[]
}

export interface CheckoutSummary {
  items: CheckoutItem[]
  subtotal: number
  totalDiscount: number
  total: number
  paymentRequired: number
  taxAmount?: number
  processingFee?: number
}

export interface CheckoutSession {
  id: string
  items: CheckoutItem[]
  summary: CheckoutSummary
  customerInfo: {
    parentName: string
    email: string
    phone: string
    emergencyContact?: string
  }
  paymentMethod?: 'CARD' | 'BANK_TRANSFER'
  stripeSessionId?: string
  expiresAt: Date
  createdAt: Date
}

// Time slot interface
export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  availableSpots: number
  totalCapacity: number
  isAvailable: boolean
}

// Zod schemas
export const CartItemSchema = z.object({
  id: z.string().min(1),
  product: z.any(), // Product schema imported separately
  student: z.any(), // Student schema imported separately
  selectedDate: z.coerce.date(),
  selectedTimeSlot: z.string().min(1),
  location: z.any(), // Location schema imported separately
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  basePrice: z.number().min(0),
  finalPrice: z.number().min(0),
  discountsApplied: z.array(z.string()),
  addedAt: z.coerce.date(),
})

export const CartStateSchema = z.object({
  items: z.array(CartItemSchema),
  totalItems: z.number().min(0),
  subtotal: z.number().min(0),
  totalDiscount: z.number().min(0),
  total: z.number().min(0),
  appliedCoupons: z.array(z.string()),
  lastUpdated: z.coerce.date(),
})

export const DiscountInfoSchema = z.object({
  type: z.enum(['EARLY_BIRD', 'SIBLING', 'COUPON', 'BULK']),
  amount: z.number().min(0),
  description: z.string().min(1),
  code: z.string().optional(),
})

export const CheckoutItemSchema = z.object({
  cartItemId: z.string().min(1),
  productId: z.string().min(1),
  studentId: z.string().min(1),
  selectedDate: z.coerce.date(),
  selectedTimeSlot: z.string().min(1),
  locationId: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  discounts: z.array(DiscountInfoSchema),
})

export const CheckoutSummarySchema = z.object({
  items: z.array(CheckoutItemSchema),
  subtotal: z.number().min(0),
  totalDiscount: z.number().min(0),
  total: z.number().min(0),
  paymentRequired: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
  processingFee: z.number().min(0).optional(),
})

export const CheckoutSessionSchema = z.object({
  id: z.string().min(1),
  items: z.array(CheckoutItemSchema),
  summary: CheckoutSummarySchema,
  customerInfo: z.object({
    parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().regex(/^(\+61|0)[2-9]\d{8}$/, 'Invalid Australian phone number'),
    emergencyContact: z.string().optional(),
  }),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER']).optional(),
  stripeSessionId: z.string().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export const TimeSlotSchema = z.object({
  id: z.string().min(1),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  availableSpots: z.number().min(0),
  totalCapacity: z.number().min(1),
  isAvailable: z.boolean(),
})

// Utility functions
export const createCartItem = (
  product: Product,
  student: Student,
  selectedDate: Date,
  selectedTimeSlot: string,
  location: Location,
  quantity = 1
): Omit<CartItem, 'id' | 'addedAt'> => {
  // Calculate if early bird discount applies
  const isEarlyBird = isEarlyBirdEligible(product)
  
  // Check for sibling discount (would need additional context)
  const hasSiblingDiscount = false // This would be determined by other items in cart
  
  const basePrice = product.pricing.basePrice
  const finalPrice = calculatePrice(product, isEarlyBird, hasSiblingDiscount)
  
  const discountsApplied: string[] = []
  if (isEarlyBird && product.pricing.earlyBirdDiscount) {
    discountsApplied.push(`Early Bird (${Math.round(product.pricing.earlyBirdDiscount * 100)}% off)`)
  }
  if (hasSiblingDiscount && product.pricing.siblingDiscount) {
    discountsApplied.push(`Sibling Discount (${Math.round(product.pricing.siblingDiscount * 100)}% off)`)
  }
  
  return {
    product,
    student,
    selectedDate,
    selectedTimeSlot,
    location,
    quantity,
    basePrice,
    finalPrice: finalPrice * quantity,
    discountsApplied,
  }
}

export const calculateCartTotals = (items: CartItem[]): Pick<CartState, 'totalItems' | 'subtotal' | 'totalDiscount' | 'total'> => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0)
  const total = items.reduce((sum, item) => sum + item.finalPrice, 0)
  const totalDiscount = subtotal - total
  
  return {
    totalItems,
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export const calculateSiblingDiscount = (items: CartItem[]): CartItem[] => {
  // Group items by date and time to identify siblings attending together
  const grouped = items.reduce((acc, item) => {
    const key = `${item.selectedDate.toISOString()}-${item.selectedTimeSlot}`
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, CartItem[]>)
  
  return items.map(item => {
    const key = `${item.selectedDate.toISOString()}-${item.selectedTimeSlot}`
    const siblingItems = grouped[key]
    
    // If more than one student for the same time slot, apply sibling discount
    const hasSiblingDiscount = siblingItems.length > 1 && item.product.pricing.siblingDiscount
    
    if (hasSiblingDiscount && !item.discountsApplied.some(d => d.includes('Sibling'))) {
      const newDiscounts = [...item.discountsApplied, `Sibling Discount (${Math.round(item.product.pricing.siblingDiscount! * 100)}% off)`]
      const isEarlyBird = item.discountsApplied.some(d => d.includes('Early Bird'))
      const newFinalPrice = calculatePrice(item.product, isEarlyBird, true) * item.quantity
      
      return {
        ...item,
        finalPrice: newFinalPrice,
        discountsApplied: newDiscounts,
      }
    }
    
    return item
  })
}

export const isTimeSlotAvailable = (timeSlot: TimeSlot): boolean => {
  return timeSlot.isAvailable && timeSlot.availableSpots > 0
}

export const formatTimeSlot = (startTime: string, endTime: string): string => {
  const format12Hour = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }
  
  return `${format12Hour(startTime)} - ${format12Hour(endTime)}`
}

// Cart action types for state management
export interface CartActions {
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (couponCode: string) => boolean
  removeCoupon: (couponCode: string) => void
}

export type CartInput = z.infer<typeof CartItemSchema>
export type CheckoutInput = z.infer<typeof CheckoutSessionSchema>
export type TimeSlotInput = z.infer<typeof TimeSlotSchema>

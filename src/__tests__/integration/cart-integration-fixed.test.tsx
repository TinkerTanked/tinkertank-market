/**
 * Cart Integration Tests (Fixed)
 * 
 * Tests comprehensive cart functionality including:
 * - Adding multiple camp bookings
 * - Cart validation and business rules
 * - Student information management
 * - Price calculations and GST
 * - Cart persistence and state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { Product, ProductCategory } from '@/types/products'

// Test products
const dayCampProduct: Product = {
  id: 'day-camp-test',
  name: 'Test Day Camp',
  category: 'camps' as ProductCategory,
  type: 'day-camp',
  price: 85,
  shortDescription: 'Amazing STEM day camp',
  fullDescription: 'Full day of STEM learning and fun',
  ageRange: '6-12',
  duration: '9am-3pm',
  location: 'Neutral Bay',
  maxCapacity: 12,
  isActive: true,
  features: [],
  addOns: []
}

const allDayCampProduct: Product = {
  id: 'all-day-camp-test',
  name: 'Test All Day Camp',
  category: 'camps' as ProductCategory,
  type: 'all-day-camp',
  price: 105,
  shortDescription: 'Extended STEM camp',
  fullDescription: 'Extended day of STEM learning',
  ageRange: '6-12',
  duration: '8am-5pm',
  location: 'Neutral Bay',
  maxCapacity: 12,
  isActive: true,
  features: [],
  addOns: []
}

const birthdayProduct: Product = {
  id: 'birthday-test',
  name: 'Test Birthday Party',
  category: 'birthdays' as ProductCategory,
  type: 'birthday-party',
  price: 350,
  shortDescription: 'Amazing STEM birthday party',
  fullDescription: 'Science-themed birthday celebration',
  ageRange: '5-15',
  duration: '2 hours',
  location: 'Neutral Bay',
  maxCapacity: 12,
  isActive: true,
  features: [],
  addOns: []
}

describe('Cart Integration Tests (Fixed)', () => {
  beforeEach(() => {
    useEnhancedCartStore.getState().clearCart()
  })

  describe('Basic Cart Operations', () => {
    it('should add single camp booking to cart', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-18'),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      const { items } = useEnhancedCartStore.getState()
      
      expect(items).toHaveLength(1)
      expect(items[0].product.id).toBe('day-camp-test')
      expect(items[0].quantity).toBe(1)
      expect(items[0].totalPrice).toBe(85)
      expect(items[0].selectedDate).toEqual(new Date('2024-03-18'))
      expect(items[0].selectedTimeSlot).toBe('9:00 AM - 3:00 PM')
    })

    it('should add multiple different camp bookings', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-18'),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      useEnhancedCartStore.getState().addItem(allDayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-19'),
        selectedTimeSlot: '8:00 AM - 5:00 PM'
      })

      const { items } = useEnhancedCartStore.getState()
      expect(items).toHaveLength(2)
      expect(items[0].product.type).toBe('day-camp')
      expect(items[1].product.type).toBe('all-day-camp')
    })

    it('should merge identical bookings by increasing quantity', () => {
      const sameDate = new Date('2024-03-18')
      const sameTimeSlot = '9:00 AM - 3:00 PM'
      
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: sameDate,
        selectedTimeSlot: sameTimeSlot
      })
      
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 2,
        selectedDate: sameDate,
        selectedTimeSlot: sameTimeSlot
      })

      const { items } = useEnhancedCartStore.getState()
      expect(items).toHaveLength(1) // Should merge into one item
      expect(items[0].quantity).toBe(3) // 1 + 2
      expect(items[0].totalPrice).toBe(255) // 3 × 85
    })

    it('should treat different dates/times as separate items', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-18'),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-19'), // Different date
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      const { items } = useEnhancedCartStore.getState()
      expect(items).toHaveLength(2) // Should be separate items
      expect(items[0].selectedDate).toEqual(new Date('2024-03-18'))
      expect(items[1].selectedDate).toEqual(new Date('2024-03-19'))
    })
  })

  describe('Cart Calculations', () => {
    it('should calculate correct subtotal for multiple items', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 2 }) // 2 × 85 = 170
      useEnhancedCartStore.getState().addItem(allDayCampProduct, { quantity: 1 }) // 1 × 105 = 105
      useEnhancedCartStore.getState().addItem(birthdayProduct, { quantity: 1 }) // 1 × 350 = 350

      const { getSummary } = useEnhancedCartStore.getState()
      const summary = getSummary()
      expect(summary.subtotal).toBe(625) // 170 + 105 + 350
      expect(summary.itemCount).toBe(4) // Total quantity
    })

    it('should calculate GST correctly', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 }) // 85

      const { getSummary } = useEnhancedCartStore.getState()
      const summary = getSummary()
      expect(summary.subtotal).toBe(85)
      expect(summary.tax).toBeCloseTo(8.5, 2) // 10% GST
      expect(summary.total).toBeCloseTo(93.5, 2)
    })

    it('should update calculations when quantity changes', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      const items = useEnhancedCartStore.getState().items
      const itemId = items[0].id
      
      let summary = useEnhancedCartStore.getState().getSummary()
      expect(summary.subtotal).toBe(85)
      
      useEnhancedCartStore.getState().updateQuantity(itemId, 3)
      
      summary = useEnhancedCartStore.getState().getSummary()
      expect(summary.subtotal).toBe(255) // 3 × 85
    })

    it('should remove item when quantity set to 0', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      let items = useEnhancedCartStore.getState().items
      expect(items).toHaveLength(1)
      
      const itemId = items[0].id
      useEnhancedCartStore.getState().updateQuantity(itemId, 0)
      
      items = useEnhancedCartStore.getState().items
      expect(items).toHaveLength(0)
    })
  })

  describe('Student Management', () => {
    it('should add student information to cart item', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      const items = useEnhancedCartStore.getState().items
      const itemId = items[0].id
      
      const student = {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      }
      
      useEnhancedCartStore.getState().addStudent(itemId, student)
      
      const updatedItems = useEnhancedCartStore.getState().items
      expect(updatedItems[0].students).toHaveLength(1)
      expect(updatedItems[0].students[0].firstName).toBe('John')
      expect(updatedItems[0].students[0].parentEmail).toBe('jane@example.com')
    })

    it('should track student count in summary', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 2 })
      
      const items = useEnhancedCartStore.getState().items
      const itemId = items[0].id
      
      useEnhancedCartStore.getState().addStudent(itemId, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })
      
      useEnhancedCartStore.getState().addStudent(itemId, {
        id: 'student-2',
        firstName: 'Jane',
        lastName: 'Smith',
        age: 7,
        parentName: 'Bob Smith',
        parentEmail: 'bob@example.com',
        parentPhone: '0400000001'
      })

      const summary = useEnhancedCartStore.getState().getSummary()
      expect(summary.studentCount).toBe(2)
      expect(summary.itemCount).toBe(2) // Quantity stays the same
    })

    it('should allow updating student information', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      const items = useEnhancedCartStore.getState().items
      const itemId = items[0].id
      
      useEnhancedCartStore.getState().addStudent(itemId, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })
      
      useEnhancedCartStore.getState().updateStudent(itemId, 'student-1', {
        firstName: 'Johnny',
        age: 9
      })
      
      const updatedItems = useEnhancedCartStore.getState().items
      expect(updatedItems[0].students[0].firstName).toBe('Johnny')
      expect(updatedItems[0].students[0].age).toBe(9)
      expect(updatedItems[0].students[0].lastName).toBe('Doe') // Unchanged
    })

    it('should remove student from cart item', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      const items = useEnhancedCartStore.getState().items
      const itemId = items[0].id
      
      useEnhancedCartStore.getState().addStudent(itemId, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })
      
      expect(useEnhancedCartStore.getState().items[0].students).toHaveLength(1)
      
      useEnhancedCartStore.getState().removeStudent(itemId, 'student-1')
      
      const updatedItems = useEnhancedCartStore.getState().items
      expect(updatedItems[0].students).toHaveLength(0)
    })
  })

  describe('Validation Rules', () => {
    it('should require students for camp bookings', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 2 })
      
      const validation = useEnhancedCartStore.getState().getValidation()
      expect(validation.isValid).toBe(false)
      
      const studentErrors = validation.errors.filter(error => 
        error.message.includes('student(s) required')
      )
      expect(studentErrors).toHaveLength(1)
      expect(studentErrors[0].message).toContain('2 more student(s) required')
    })

    it('should validate student age against product age range', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      const items = useEnhancedCartStore.getState().items
      const itemId = items[0].id
      
      // Add student outside age range (6-12)
      useEnhancedCartStore.getState().addStudent(itemId, {
        id: 'student-1',
        firstName: 'Teenager',
        lastName: 'Too Old',
        age: 16, // Outside 6-12 range
        parentName: 'Parent Name',
        parentEmail: 'parent@example.com',
        parentPhone: '0400000000'
      })
      
      const validation = useEnhancedCartStore.getState().getValidation()
      expect(validation.isValid).toBe(false)
      
      const ageErrors = validation.errors.filter(error => 
        error.message.includes('age must be between')
      )
      expect(ageErrors).toHaveLength(1)
    })

    it('should validate required student fields', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      const items = useEnhancedCartStore.getState().items
      const itemId = items[0].id
      
      // Add student with missing required fields
      useEnhancedCartStore.getState().addStudent(itemId, {
        id: 'student-1',
        firstName: '', // Missing
        lastName: 'Doe',
        age: 8,
        parentName: '', // Missing
        parentEmail: 'invalid-email', // Invalid format would be caught by form validation
        parentPhone: '' // Missing
      })
      
      const validation = useEnhancedCartStore.getState().getValidation()
      expect(validation.isValid).toBe(false)
      
      const fieldErrors = validation.errors.filter(error => 
        error.message.includes('required') || 
        error.message.includes('First name') ||
        error.message.includes('Parent name') ||
        error.message.includes('Parent phone')
      )
      expect(fieldErrors.length).toBeGreaterThan(0)
    })

    it('should detect scheduling conflicts', () => {
      const conflictDate = new Date('2024-03-18')
      const conflictTime = '9:00 AM - 3:00 PM'
      
      // Add two different products for same date/time to avoid merging
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: conflictDate,
        selectedTimeSlot: conflictTime
      })
      
      // Create a different product to ensure separate cart items
      const differentCampProduct = {
        ...allDayCampProduct,
        id: 'different-camp-1',
        name: 'Different STEM Camp'
      }
      
      useEnhancedCartStore.getState().addItem(differentCampProduct, {
        quantity: 1,
        selectedDate: conflictDate,
        selectedTimeSlot: conflictTime // Same time as day camp
      })
      
      const items = useEnhancedCartStore.getState().items
      expect(items.length).toBe(2) // Should have 2 separate items
      
      // Add same student to both bookings
      const student = {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      }
      
      useEnhancedCartStore.getState().addStudent(items[0].id, student)
      useEnhancedCartStore.getState().addStudent(items[1].id, student)
      
      const validation = useEnhancedCartStore.getState().getValidation()
      const conflicts = validation.warnings.filter(warning => 
        warning.message.includes('overlapping bookings')
      )
      expect(conflicts.length).toBeGreaterThan(0)
    })

    it('should validate capacity limits', () => {
      // Add more than maxCapacity
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 15 }) // Exceeds maxCapacity of 12
      
      const validation = useEnhancedCartStore.getState().getValidation()
      expect(validation.isValid).toBe(false)
      
      const capacityErrors = validation.errors.filter(error => 
        error.message.includes('exceeds maximum capacity')
      )
      expect(capacityErrors).toHaveLength(1)
    })

    it('should pass validation with complete valid data', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      const items = useEnhancedCartStore.getState().items
      const itemId = items[0].id
      
      useEnhancedCartStore.getState().addStudent(itemId, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })
      
      const validation = useEnhancedCartStore.getState().getValidation()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('Cart Persistence and State', () => {
    it('should maintain cart state across store calls', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      
      // Get fresh state reference
      const items = useEnhancedCartStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].product.id).toBe('day-camp-test')
    })

    it('should clear cart completely', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, { quantity: 1 })
      useEnhancedCartStore.getState().addItem(allDayCampProduct, { quantity: 1 })
      
      let items = useEnhancedCartStore.getState().items
      expect(items).toHaveLength(2)
      
      useEnhancedCartStore.getState().clearCart()
      
      items = useEnhancedCartStore.getState().items
      expect(items).toHaveLength(0)
    })

    it('should handle date serialization/deserialization', () => {
      const testDate = new Date('2024-03-18T09:00:00')
      
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: testDate,
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      const items = useEnhancedCartStore.getState().items
      expect(items[0].selectedDate).toBeInstanceOf(Date)
      expect(items[0].selectedDate?.getTime()).toBe(testDate.getTime())
    })

    it('should generate unique IDs for cart items', () => {
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-18'),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      useEnhancedCartStore.getState().addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-19'), // Different date = different item
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      const items = useEnhancedCartStore.getState().items
      expect(items).toHaveLength(2)
      expect(items[0].id).not.toBe(items[1].id)
      expect(items[0].id).toBeTruthy()
      expect(items[1].id).toBeTruthy()
    })
  })
})

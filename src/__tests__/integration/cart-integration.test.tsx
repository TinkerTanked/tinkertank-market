/**
 * Cart Integration Tests
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
  features: []
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
  features: []
}

describe('Cart Integration Tests', () => {
  beforeEach(() => {
    useEnhancedCartStore.getState().clearCart()
  })

  describe('Basic Cart Operations', () => {
    it('should add single camp booking to cart', () => {
      const store = useEnhancedCartStore.getState()
      
      store.addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-18'),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      // Get fresh state after adding item
      const updatedState = useEnhancedCartStore.getState()
      const items = updatedState.items
      
      expect(items).toHaveLength(1)
      expect(items[0].product.id).toBe('day-camp-test')
      expect(items[0].quantity).toBe(1)
      expect(items[0].totalPrice).toBe(85)
      expect(items[0].selectedDate).toEqual(new Date('2024-03-18'))
      expect(items[0].selectedTimeSlot).toBe('9:00 AM - 3:00 PM')
    })

    it('should add multiple different camp bookings', () => {
      const store = useEnhancedCartStore.getState()
      
      store.addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-18'),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      store.addItem(allDayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-19'),
        selectedTimeSlot: '8:00 AM - 5:00 PM'
      })

      const items = useEnhancedCartStore.getState().items
      expect(items).toHaveLength(2)
      expect(items[0].product.type).toBe('day-camp')
      expect(items[1].product.type).toBe('all-day-camp')
    })

    it('should merge identical bookings by increasing quantity', () => {
      const { addItem, items } = useEnhancedCartStore.getState()
      
      const sameDate = new Date('2024-03-18')
      const sameTimeSlot = '9:00 AM - 3:00 PM'
      
      addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: sameDate,
        selectedTimeSlot: sameTimeSlot
      })
      
      addItem(dayCampProduct, {
        quantity: 2,
        selectedDate: sameDate,
        selectedTimeSlot: sameTimeSlot
      })

      expect(items).toHaveLength(1) // Should merge into one item
      expect(items[0].quantity).toBe(3) // 1 + 2
      expect(items[0].totalPrice).toBe(255) // 3 × 85
    })

    it('should treat different dates/times as separate items', () => {
      const { addItem, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-18'),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-19'), // Different date
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      expect(items).toHaveLength(2) // Should be separate items
      expect(items[0].selectedDate).toEqual(new Date('2024-03-18'))
      expect(items[1].selectedDate).toEqual(new Date('2024-03-19'))
    })
  })

  describe('Cart Calculations', () => {
    it('should calculate correct subtotal for multiple items', () => {
      const { addItem, getSummary } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 2 }) // 2 × 85 = 170
      addItem(allDayCampProduct, { quantity: 1 }) // 1 × 105 = 105
      addItem(birthdayProduct, { quantity: 1 }) // 1 × 350 = 350

      const summary = getSummary()
      expect(summary.subtotal).toBe(625) // 170 + 105 + 350
      expect(summary.itemCount).toBe(4) // Total quantity
    })

    it('should calculate GST correctly', () => {
      const { addItem, getSummary } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 }) // 85

      const summary = getSummary()
      expect(summary.subtotal).toBe(85)
      expect(summary.tax).toBeCloseTo(8.5, 2) // 10% GST
      expect(summary.total).toBeCloseTo(93.5, 2)
    })

    it('should update calculations when quantity changes', () => {
      const { addItem, updateQuantity, getSummary, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      const itemId = items[0].id
      
      let summary = getSummary()
      expect(summary.subtotal).toBe(85)
      
      updateQuantity(itemId, 3)
      
      summary = getSummary()
      expect(summary.subtotal).toBe(255) // 3 × 85
    })

    it('should remove item when quantity set to 0', () => {
      const { addItem, updateQuantity, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      expect(items).toHaveLength(1)
      
      const itemId = items[0].id
      updateQuantity(itemId, 0)
      
      const updatedItems = useEnhancedCartStore.getState().items
      expect(updatedItems).toHaveLength(0)
    })
  })

  describe('Student Management', () => {
    it('should add student information to cart item', () => {
      const { addItem, addStudent, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
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
      
      addStudent(itemId, student)
      
      const updatedItems = useEnhancedCartStore.getState().items
      expect(updatedItems[0].students).toHaveLength(1)
      expect(updatedItems[0].students[0].firstName).toBe('John')
      expect(updatedItems[0].students[0].parentEmail).toBe('jane@example.com')
    })

    it('should track student count in summary', () => {
      const { addItem, addStudent, getSummary, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 2 })
      const itemId = items[0].id
      
      addStudent(itemId, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })
      
      addStudent(itemId, {
        id: 'student-2',
        firstName: 'Jane',
        lastName: 'Smith',
        age: 7,
        parentName: 'Bob Smith',
        parentEmail: 'bob@example.com',
        parentPhone: '0400000001'
      })

      const summary = getSummary()
      expect(summary.studentCount).toBe(2)
      expect(summary.itemCount).toBe(2) // Quantity stays the same
    })

    it('should allow updating student information', () => {
      const { addItem, addStudent, updateStudent, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      const itemId = items[0].id
      
      addStudent(itemId, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })
      
      updateStudent(itemId, 'student-1', {
        firstName: 'Johnny',
        age: 9
      })
      
      const updatedItems = useEnhancedCartStore.getState().items
      expect(updatedItems[0].students[0].firstName).toBe('Johnny')
      expect(updatedItems[0].students[0].age).toBe(9)
      expect(updatedItems[0].students[0].lastName).toBe('Doe') // Unchanged
    })

    it('should remove student from cart item', () => {
      const { addItem, addStudent, removeStudent, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      const itemId = items[0].id
      
      addStudent(itemId, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })
      
      expect(useEnhancedCartStore.getState().items[0].students).toHaveLength(1)
      
      removeStudent(itemId, 'student-1')
      
      const updatedItems = useEnhancedCartStore.getState().items
      expect(updatedItems[0].students).toHaveLength(0)
    })
  })

  describe('Validation Rules', () => {
    it('should require students for camp bookings', () => {
      const { addItem, getValidation } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 2 })
      
      const validation = getValidation()
      expect(validation.isValid).toBe(false)
      
      const studentErrors = validation.errors.filter(error => 
        error.message.includes('student(s) required')
      )
      expect(studentErrors).toHaveLength(1)
      expect(studentErrors[0].message).toContain('2 more student(s) required')
    })

    it('should validate student age against product age range', () => {
      const { addItem, addStudent, getValidation, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      const itemId = items[0].id
      
      // Add student outside age range (6-12)
      addStudent(itemId, {
        id: 'student-1',
        firstName: 'Teenager',
        lastName: 'Too Old',
        age: 16, // Outside 6-12 range
        parentName: 'Parent Name',
        parentEmail: 'parent@example.com',
        parentPhone: '0400000000'
      })
      
      const validation = getValidation()
      expect(validation.isValid).toBe(false)
      
      const ageErrors = validation.errors.filter(error => 
        error.message.includes('age must be between')
      )
      expect(ageErrors).toHaveLength(1)
    })

    it('should validate required student fields', () => {
      const { addItem, addStudent, getValidation, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      const itemId = items[0].id
      
      // Add student with missing required fields
      addStudent(itemId, {
        id: 'student-1',
        firstName: '', // Missing
        lastName: 'Doe',
        age: 8,
        parentName: '', // Missing
        parentEmail: 'invalid-email', // Invalid format would be caught by form validation
        parentPhone: '' // Missing
      })
      
      const validation = getValidation()
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
      const { addItem, addStudent, getValidation, items } = useEnhancedCartStore.getState()
      
      const conflictDate = new Date('2024-03-18')
      const conflictTime = '9:00 AM - 3:00 PM'
      
      // Add two bookings for same date/time
      addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: conflictDate,
        selectedTimeSlot: conflictTime
      })
      
      addItem(allDayCampProduct, {
        quantity: 1,
        selectedDate: conflictDate,
        selectedTimeSlot: conflictTime // Same time as day camp
      })
      
      const itemIds = items.map(item => item.id)
      
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
      
      addStudent(itemIds[0], student)
      addStudent(itemIds[1], student)
      
      const validation = getValidation()
      const conflicts = validation.warnings.filter(warning => 
        warning.message.includes('overlapping bookings')
      )
      expect(conflicts.length).toBeGreaterThan(0)
    })

    it('should validate capacity limits', () => {
      const { addItem, getValidation } = useEnhancedCartStore.getState()
      
      // Add more than maxCapacity
      addItem(dayCampProduct, { quantity: 15 }) // Exceeds maxCapacity of 12
      
      const validation = getValidation()
      expect(validation.isValid).toBe(false)
      
      const capacityErrors = validation.errors.filter(error => 
        error.message.includes('exceeds maximum capacity')
      )
      expect(capacityErrors).toHaveLength(1)
    })

    it('should pass validation with complete valid data', () => {
      const { addItem, addStudent, getValidation, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      const itemId = items[0].id
      
      addStudent(itemId, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })
      
      const validation = getValidation()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('Cart Persistence and State', () => {
    it('should maintain cart state across store calls', () => {
      const { addItem, items: initialItems } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      
      // Get fresh state reference
      const { items: updatedItems } = useEnhancedCartStore.getState()
      expect(updatedItems).toHaveLength(1)
      expect(updatedItems[0].product.id).toBe('day-camp-test')
    })

    it('should clear cart completely', () => {
      const { addItem, clearCart, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, { quantity: 1 })
      addItem(allDayCampProduct, { quantity: 1 })
      
      expect(items).toHaveLength(2)
      
      clearCart()
      
      const { items: clearedItems } = useEnhancedCartStore.getState()
      expect(clearedItems).toHaveLength(0)
    })

    it('should handle date serialization/deserialization', () => {
      const { addItem, items } = useEnhancedCartStore.getState()
      
      const testDate = new Date('2024-03-18T09:00:00')
      
      addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: testDate,
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      expect(items[0].selectedDate).toBeInstanceOf(Date)
      expect(items[0].selectedDate?.getTime()).toBe(testDate.getTime())
    })

    it('should generate unique IDs for cart items', () => {
      const { addItem, items } = useEnhancedCartStore.getState()
      
      addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-18'),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      addItem(dayCampProduct, {
        quantity: 1,
        selectedDate: new Date('2024-03-19'), // Different date = different item
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })
      
      expect(items).toHaveLength(2)
      expect(items[0].id).not.toBe(items[1].id)
      expect(items[0].id).toBeTruthy()
      expect(items[1].id).toBeTruthy()
    })
  })
})

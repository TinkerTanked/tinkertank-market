import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { Product } from '@/types/products'
import { StudentDetails } from '@/types/enhancedCart'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch for API calls
global.fetch = vi.fn()

const mockProducts: Product[] = [
  {
    id: 'camp-1',
    name: 'Summer Tech Camp',
    description: 'Learn coding and robotics',
    price: 150,
    category: 'camps',
    ageRange: '8-14',
    maxCapacity: 20,
    duration: '5 days',
    images: ['https://example.com/camp1.jpg'],
    features: ['Coding', 'Robotics', 'Games'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'camp-2',
    name: 'Art & Craft Camp',
    description: 'Creative activities for kids',
    price: 120,
    category: 'camps',
    ageRange: '5-12',
    maxCapacity: 15,
    duration: '3 days',
    images: ['https://example.com/camp2.jpg'],
    features: ['Painting', 'Crafts', 'Music'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'birthday-1',
    name: 'Birthday Party Package',
    description: 'Complete birthday celebration',
    price: 200,
    category: 'birthdays',
    ageRange: '4-16',
    maxCapacity: 12,
    duration: '3 hours',
    images: ['https://example.com/birthday1.jpg'],
    features: ['Decorations', 'Activities', 'Cake'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockStudents: StudentDetails[] = [
  {
    id: 'student-1',
    firstName: 'Alice',
    lastName: 'Johnson',
    age: 9,
    parentName: 'Sarah Johnson',
    parentEmail: 'sarah@example.com',
    parentPhone: '+61-123-456-789',
    allergies: ['Nuts'],
    medicalNotes: 'Has inhaler',
  },
  {
    id: 'student-2',
    firstName: 'Bob',
    lastName: 'Smith',
    age: 11,
    parentName: 'Mike Smith',
    parentEmail: 'mike@example.com',
    parentPhone: '+61-987-654-321',
  },
]

describe('Cart Workflow Integration Tests', () => {
  let cartStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    
    // Get fresh store instance
    cartStore = useEnhancedCartStore.getState()
    cartStore.clearCart()
  })

  describe('Complete Cart Workflow', () => {
    it('should handle full cart workflow from empty to checkout', async () => {
      // Start with empty cart
      expect(cartStore.items).toHaveLength(0)
      
      // Add first product
      cartStore.addItem(mockProducts[0], { quantity: 2 })
      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0].quantity).toBe(2)
      expect(cartStore.items[0].totalPrice).toBe(300)
      
      // Add second product
      cartStore.addItem(mockProducts[1], { quantity: 1 })
      expect(cartStore.items).toHaveLength(2)
      
      // Check cart summary
      const summary = cartStore.getSummary()
      expect(summary.subtotal).toBe(420) // 300 + 120
      expect(summary.tax).toBe(42) // 10% GST
      expect(summary.total).toBe(462)
      expect(summary.itemCount).toBe(3) // 2 + 1
      expect(summary.studentCount).toBe(0)
      
      // Add students to first item
      const firstItemId = cartStore.items[0].id
      cartStore.addStudent(firstItemId, mockStudents[0])
      cartStore.addStudent(firstItemId, mockStudents[1])
      
      // Add student to second item
      const secondItemId = cartStore.items[1].id
      cartStore.addStudent(secondItemId, mockStudents[0])
      
      // Check validation
      const validation = cartStore.getValidation()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      
      // Final summary should include students
      const finalSummary = cartStore.getSummary()
      expect(finalSummary.studentCount).toBe(3) // 2 + 1
    })

    it('should handle cart modifications during workflow', async () => {
      // Add multiple products
      cartStore.addItem(mockProducts[0])
      cartStore.addItem(mockProducts[1])
      cartStore.addItem(mockProducts[2])
      
      expect(cartStore.items).toHaveLength(3)
      
      // Modify quantities
      cartStore.updateQuantity(cartStore.items[0].id, 3)
      cartStore.updateQuantity(cartStore.items[1].id, 2)
      
      expect(cartStore.items[0].quantity).toBe(3)
      expect(cartStore.items[1].quantity).toBe(2)
      
      // Remove one item
      cartStore.removeItem(cartStore.items[2].id)
      
      expect(cartStore.items).toHaveLength(2)
      
      // Check totals are updated
      const summary = cartStore.getSummary()
      expect(summary.subtotal).toBe(690) // (150 * 3) + (120 * 2)
    })

    it('should validate cart before checkout', async () => {
      // Add camp that requires students
      cartStore.addItem(mockProducts[0], { quantity: 2 })
      const itemId = cartStore.items[0].id
      
      // Check validation fails without students
      let validation = cartStore.getValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0].message).toContain('2 more student(s) required')
      
      // Add one student - still should fail
      cartStore.addStudent(itemId, mockStudents[0])
      validation = cartStore.getValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors[0].message).toContain('1 more student(s) required')
      
      // Add second student - should pass
      cartStore.addStudent(itemId, mockStudents[1])
      validation = cartStore.getValidation()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should handle persistence across sessions', async () => {
      // Add items to cart
      cartStore.addItem(mockProducts[0])
      cartStore.addStudent(cartStore.items[0].id, mockStudents[0])
      
      // Simulate saving to localStorage
      const serializedState = JSON.stringify({
        state: {
          items: cartStore.items,
        },
        version: 1,
      })
      
      localStorageMock.getItem.mockReturnValue(serializedState)
      
      // Create new store instance (simulating page reload)
      const newStore = useEnhancedCartStore.getState()
      
      // Should have restored items
      expect(newStore.items).toHaveLength(1)
      expect(newStore.items[0].product.id).toBe('camp-1')
      expect(newStore.items[0].students).toHaveLength(1)
    })
  })

  describe('Multi-Student Scenarios', () => {
    it('should handle same camp for multiple students', async () => {
      const campDate = new Date('2024-07-15')
      const timeSlot = { startTime: '09:00', endTime: '15:00' }
      
      // Add camp with 3 spots
      cartStore.addItem(mockProducts[0], {
        quantity: 3,
        selectedDate: campDate,
        selectedTimeSlot: timeSlot,
      })
      
      const itemId = cartStore.items[0].id
      
      // Add 3 different students
      cartStore.addStudent(itemId, mockStudents[0])
      cartStore.addStudent(itemId, mockStudents[1])
      cartStore.addStudent(itemId, {
        ...mockStudents[0],
        id: 'student-3',
        firstName: 'Charlie',
        lastName: 'Brown',
        age: 10,
      })
      
      expect(cartStore.items[0].students).toHaveLength(3)
      
      const validation = cartStore.getValidation()
      expect(validation.isValid).toBe(true)
      
      const summary = cartStore.getSummary()
      expect(summary.studentCount).toBe(3)
    })

    it('should handle different camps per student', async () => {
      const date1 = new Date('2024-07-15')
      const date2 = new Date('2024-07-22')
      
      // Add different camps for same student
      cartStore.addItem(mockProducts[0], { selectedDate: date1 })
      cartStore.addItem(mockProducts[1], { selectedDate: date2 })
      
      // Add same student to both camps
      cartStore.addStudent(cartStore.items[0].id, mockStudents[0])
      cartStore.addStudent(cartStore.items[1].id, mockStudents[0])
      
      const summary = cartStore.getSummary()
      expect(summary.itemCount).toBe(2)
      expect(summary.studentCount).toBe(2) // Same student counts twice
      
      // Should not show time conflict warning (different dates)
      const validation = cartStore.getValidation()
      expect(validation.warnings).toHaveLength(0)
    })

    it('should detect time conflicts for same student', async () => {
      const conflictDate = new Date('2024-07-15')
      const timeSlot = { startTime: '09:00', endTime: '15:00' }
      
      // Add two camps at same time
      cartStore.addItem(mockProducts[0], {
        selectedDate: conflictDate,
        selectedTimeSlot: timeSlot,
      })
      cartStore.addItem(mockProducts[1], {
        selectedDate: conflictDate,
        selectedTimeSlot: timeSlot,
      })
      
      // Add same student to both
      cartStore.addStudent(cartStore.items[0].id, mockStudents[0])
      cartStore.addStudent(cartStore.items[1].id, mockStudents[0])
      
      const validation = cartStore.getValidation()
      expect(validation.warnings.length).toBeGreaterThan(0)
      expect(validation.warnings[0].message).toContain('overlapping bookings')
    })
  })

  describe('Business Logic Validation', () => {
    it('should validate age requirements', async () => {
      // Add camp with age range 8-14
      cartStore.addItem(mockProducts[0])
      const itemId = cartStore.items[0].id
      
      // Try to add student too young (age 6)
      const youngStudent = {
        ...mockStudents[0],
        age: 6,
      }
      
      cartStore.addStudent(itemId, youngStudent)
      
      const validation = cartStore.getValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.message.includes('age must be between 8 and 14'))).toBe(true)
    })

    it('should validate capacity limits', async () => {
      // Add camp with maxCapacity 20
      cartStore.addItem(mockProducts[0], { quantity: 25 }) // Exceeds capacity
      
      const validation = cartStore.getValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.message.includes('exceeds maximum capacity'))).toBe(true)
    })

    it('should handle student data validation', async () => {
      cartStore.addItem(mockProducts[0])
      const itemId = cartStore.items[0].id
      
      // Add student with incomplete data
      const incompleteStudent = {
        id: 'incomplete',
        firstName: '',
        lastName: 'Doe',
        age: 10,
        parentName: '',
        parentEmail: 'invalid-email',
        parentPhone: '',
      }
      
      cartStore.addStudent(itemId, incompleteStudent)
      
      const validation = cartStore.getValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.message.includes('First name is required'))).toBe(true)
      expect(validation.errors.some(e => e.message.includes('Parent name is required'))).toBe(true)
      expect(validation.errors.some(e => e.message.includes('Parent phone is required'))).toBe(true)
    })
  })

  describe('Cart Persistence and Recovery', () => {
    it('should handle corrupted localStorage data', async () => {
      // Mock corrupted data
      localStorageMock.getItem.mockReturnValue('invalid json{')
      
      // Should not crash and start with empty cart
      const store = useEnhancedCartStore.getState()
      expect(store.items).toHaveLength(0)
    })

    it('should migrate from old cart format', async () => {
      // Mock old format data
      const oldFormatData = JSON.stringify({
        state: {
          items: [{
            id: 'old-item',
            productId: 'camp-1',
            quantity: 1,
            // Missing new fields
          }],
        },
        version: 0,
      })
      
      localStorageMock.getItem.mockReturnValue(oldFormatData)
      
      const store = useEnhancedCartStore.getState()
      
      // Should handle gracefully (either migrate or reset)
      expect(Array.isArray(store.items)).toBe(true)
    })

    it('should clear cart after successful payment', async () => {
      // Setup cart with items
      cartStore.addItem(mockProducts[0])
      cartStore.addStudent(cartStore.items[0].id, mockStudents[0])
      
      expect(cartStore.items).toHaveLength(1)
      
      // Mock successful API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      
      // Clear cart after successful payment
      await cartStore.clearCartAfterSuccess('order-123')
      
      expect(cartStore.items).toHaveLength(0)
      expect(fetch).toHaveBeenCalledWith('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-123' }),
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during cart operations', async () => {
      cartStore.addItem(mockProducts[0])
      
      // Mock network error
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
      
      // Should not throw but handle gracefully
      await expect(cartStore.clearCartAfterSuccess('order-123')).resolves.not.toThrow()
      
      // Cart should still be cleared locally
      expect(cartStore.items).toHaveLength(0)
    })

    it('should handle invalid product data', async () => {
      const invalidProduct = {
        ...mockProducts[0],
        price: -10, // Invalid price
      }
      
      // Should handle gracefully
      cartStore.addItem(invalidProduct)
      
      // Cart should handle it (maybe with price 0 or reject)
      expect(cartStore.items[0].totalPrice).toBeGreaterThanOrEqual(0)
    })

    it('should handle concurrent cart modifications', async () => {
      cartStore.addItem(mockProducts[0])
      const itemId = cartStore.items[0].id
      
      // Simulate concurrent modifications
      cartStore.updateQuantity(itemId, 5)
      cartStore.addStudent(itemId, mockStudents[0])
      cartStore.updateQuantity(itemId, 3)
      cartStore.addStudent(itemId, mockStudents[1])
      
      // Final state should be consistent
      expect(cartStore.items[0].quantity).toBe(3)
      expect(cartStore.items[0].students).toHaveLength(2)
      expect(cartStore.items[0].totalPrice).toBe(450) // 150 * 3
    })
  })
})

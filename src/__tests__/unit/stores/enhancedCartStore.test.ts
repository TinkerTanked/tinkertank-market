import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { Product, ProductCategory } from '@/types/products'
import { StudentDetails } from '@/types/enhancedCart'
import { act, renderHook } from '@testing-library/react'

// Mock product data
const mockProduct: Product = {
  id: 'test-product-1',
  name: 'Test Camp',
  description: 'A test camp product',
  price: 100,
  category: 'camps' as ProductCategory,
  ageRange: '5-12',
  maxCapacity: 10,
  duration: '1 day',
  images: [],
  features: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockStudent: StudentDetails = {
  id: 'student-1',
  firstName: 'John',
  lastName: 'Doe',
  age: 8,
  parentName: 'Jane Doe',
  parentEmail: 'jane@example.com',
  parentPhone: '+61-123-456-789',
}

describe('Enhanced Cart Store', () => {
  beforeEach(() => {
    // Clear cart before each test
    const { result } = renderHook(() => useEnhancedCartStore())
    act(() => {
      result.current.clearCart()
    })
  })

  describe('Basic Cart Operations', () => {
    it('should add item to empty cart', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe(mockProduct.id)
      expect(result.current.items[0].quantity).toBe(1)
      expect(result.current.items[0].totalPrice).toBe(100)
    })

    it('should increment quantity when adding same product', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
      expect(result.current.items[0].totalPrice).toBe(200)
    })

    it('should add separate item for different dates', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const date1 = new Date('2024-06-01')
      const date2 = new Date('2024-06-02')
      
      act(() => {
        result.current.addItem(mockProduct, { selectedDate: date1 })
        result.current.addItem(mockProduct, { selectedDate: date2 })
      })

      expect(result.current.items).toHaveLength(2)
    })

    it('should remove item by ID', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.removeItem(itemId)
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should update quantity', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.updateQuantity(itemId, 3)
      })

      expect(result.current.items[0].quantity).toBe(3)
      expect(result.current.items[0].totalPrice).toBe(300)
    })

    it('should remove item when quantity set to 0', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.updateQuantity(itemId, 0)
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should clear entire cart', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem({...mockProduct, id: 'different-product'})
      })

      expect(result.current.items).toHaveLength(2)
      
      act(() => {
        result.current.clearCart()
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('Multi-Student Support', () => {
    it('should add student to cart item', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })

      expect(result.current.items[0].students).toHaveLength(1)
      expect(result.current.items[0].students[0].firstName).toBe('John')
    })

    it('should remove student from cart item', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })
      
      const studentId = result.current.items[0].students[0].id
      
      act(() => {
        result.current.removeStudent(itemId, studentId)
      })

      expect(result.current.items[0].students).toHaveLength(0)
    })

    it('should update student details', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })
      
      const studentId = result.current.items[0].students[0].id
      
      act(() => {
        result.current.updateStudent(itemId, studentId, { firstName: 'Johnny' })
      })

      expect(result.current.items[0].students[0].firstName).toBe('Johnny')
    })

    it('should add multiple students to same item', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const student2 = { ...mockStudent, id: 'student-2', firstName: 'Jane' }
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, mockStudent)
        result.current.addStudent(itemId, student2)
      })

      expect(result.current.items[0].students).toHaveLength(2)
      expect(result.current.items[0].students[0].firstName).toBe('John')
      expect(result.current.items[0].students[1].firstName).toBe('Jane')
    })

    it('should check if item has specific student', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })
      
      const studentId = result.current.items[0].students[0].id

      expect(result.current.hasStudent(itemId, studentId)).toBe(true)
      expect(result.current.hasStudent(itemId, 'non-existent')).toBe(false)
    })
  })

  describe('Add-ons and Pricing', () => {
    const mockAddOn = {
      id: 'addon-1',
      name: 'Lunch',
      description: 'Daily lunch',
      price: 15,
      category: 'food',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should calculate price with add-ons', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct, {
          selectedAddOns: [{ addOn: mockAddOn, quantity: 1 }]
        })
      })

      expect(result.current.items[0].totalPrice).toBe(115) // 100 + 15
    })

    it('should calculate price with multiple add-ons', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct, {
          quantity: 2,
          selectedAddOns: [{ addOn: mockAddOn, quantity: 2 }]
        })
      })

      expect(result.current.items[0].totalPrice).toBe(230) // (100 * 2) + (15 * 2)
    })

    it('should recalculate price when updating item with add-ons', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.updateItemDetails(itemId, {
          selectedAddOns: [{ addOn: mockAddOn, quantity: 1 }]
        })
      })

      expect(result.current.items[0].totalPrice).toBe(115)
    })
  })

  describe('Cart Summary', () => {
    it('should calculate correct cart summary', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct, { quantity: 2 })
      })

      const summary = result.current.getSummary()
      
      expect(summary.subtotal).toBe(200)
      expect(summary.tax).toBe(20) // 10% GST
      expect(summary.total).toBe(220)
      expect(summary.itemCount).toBe(2)
      expect(summary.studentCount).toBe(0)
    })

    it('should count students in summary', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, mockStudent)
        result.current.addStudent(itemId, { ...mockStudent, id: 'student-2' })
      })

      const summary = result.current.getSummary()
      expect(summary.studentCount).toBe(2)
    })
  })

  describe('Validation', () => {
    it('should validate that camps require students', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct, { quantity: 2 })
      })

      const validation = result.current.getValidation()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0].field).toBe('students')
      expect(validation.errors[0].message).toContain('2 more student(s) required')
    })

    it('should validate student data completeness', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const incompleteStudent = { ...mockStudent, firstName: '', parentEmail: '' }
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, incompleteStudent)
      })

      const validation = result.current.getValidation()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.message.includes('First name is required'))).toBe(true)
      expect(validation.errors.some(e => e.message.includes('Parent email is required'))).toBe(true)
    })

    it('should validate age requirements', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const youngStudent = { ...mockStudent, age: 3 } // Outside 5-12 range
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, youngStudent)
      })

      const validation = result.current.getValidation()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.message.includes('age must be between 5 and 12'))).toBe(true)
    })

    it('should validate capacity limits', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct, { quantity: 15 }) // Exceeds maxCapacity of 10
      })

      const validation = result.current.getValidation()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.message.includes('exceeds maximum capacity'))).toBe(true)
    })

    it('should detect student time conflicts', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const date = new Date('2024-06-01')
      const timeSlot = { startTime: '09:00', endTime: '15:00' }
      
      act(() => {
        result.current.addItem(mockProduct, { selectedDate: date, selectedTimeSlot: timeSlot })
        result.current.addItem({...mockProduct, id: 'product-2'}, { selectedDate: date, selectedTimeSlot: timeSlot })
      })
      
      const itemId1 = result.current.items[0].id
      const itemId2 = result.current.items[1].id
      
      act(() => {
        result.current.addStudent(itemId1, mockStudent)
        result.current.addStudent(itemId2, mockStudent) // Same student in both
      })

      const validation = result.current.getValidation()
      
      expect(validation.warnings.some(w => w.message.includes('overlapping bookings'))).toBe(true)
    })

    it('should pass validation when all requirements met', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })

      const validation = result.current.getValidation()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('Persistence', () => {
    it('should clear cart after successful payment', async () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      
      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      
      await act(async () => {
        await result.current.clearCartAfterSuccess('order-123')
      })

      expect(result.current.items).toHaveLength(0)
      expect(fetch).toHaveBeenCalledWith('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-123' })
      })
    })
  })

  describe('Item Retrieval', () => {
    it('should get item by ID', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      const retrievedItem = result.current.getItem(itemId)
      
      expect(retrievedItem).toBeDefined()
      expect(retrievedItem!.product.id).toBe(mockProduct.id)
    })

    it('should return undefined for non-existent item', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      const retrievedItem = result.current.getItem('non-existent')
      
      expect(retrievedItem).toBeUndefined()
    })
  })

  describe('Date and Time Handling', () => {
    it('should handle date selection correctly', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const testDate = new Date('2024-06-15')
      
      act(() => {
        result.current.addItem(mockProduct, { selectedDate: testDate })
      })

      expect(result.current.items[0].selectedDate).toEqual(testDate)
    })

    it('should handle time slot selection', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const timeSlot = { startTime: '09:00', endTime: '15:00' }
      
      act(() => {
        result.current.addItem(mockProduct, { selectedTimeSlot: timeSlot })
      })

      expect(result.current.items[0].selectedTimeSlot).toEqual(timeSlot)
    })
  })

  describe('Edge Cases', () => {
    it('should handle adding item with zero quantity', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct, { quantity: 0 })
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should handle negative quantity updates', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.updateQuantity(itemId, -1)
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should handle updating non-existent item', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.updateQuantity('non-existent', 5)
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should handle removing non-existent student', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      
      act(() => {
        result.current.addItem(mockProduct)
      })
      
      const itemId = result.current.items[0].id
      
      act(() => {
        result.current.removeStudent(itemId, 'non-existent-student')
      })

      expect(result.current.items[0].students).toHaveLength(0)
    })
  })
})

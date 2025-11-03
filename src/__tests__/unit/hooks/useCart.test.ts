import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCart } from '@/hooks/useCart'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { Product } from '@/types/products'
import { StudentDetails } from '@/types/enhancedCart'

// Mock the enhanced cart store
vi.mock('@/stores/enhancedCartStore')

const mockProduct: Product = {
  id: 'test-product',
  name: 'Test Camp',
  description: 'Test description',
  price: 100,
  category: 'camps',
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

describe('useCart Hook', () => {
  const mockCartStore = {
    items: [],
    isLoading: false,
    error: null,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    addStudent: vi.fn(),
    removeStudent: vi.fn(),
    updateStudent: vi.fn(),
    updateItemDetails: vi.fn(),
    clearCartAfterSuccess: vi.fn(),
    getSummary: vi.fn(() => ({
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
      studentCount: 0,
    })),
    getValidation: vi.fn(() => ({
      isValid: true,
      errors: [],
      warnings: [],
    })),
    getItem: vi.fn(),
    hasStudent: vi.fn(),
    loadFromStorage: vi.fn(),
    saveToStorage: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useEnhancedCartStore as any).mockReturnValue(mockCartStore)
  })

  it('should expose cart state and actions', () => {
    const { result } = renderHook(() => useCart())

    expect(result.current.items).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(typeof result.current.addItem).toBe('function')
    expect(typeof result.current.removeItem).toBe('function')
    expect(typeof result.current.updateQuantity).toBe('function')
    expect(typeof result.current.clearCart).toBe('function')
  })

  it('should call addItem with correct parameters', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem(mockProduct, { quantity: 2 })
    })

    expect(mockCartStore.addItem).toHaveBeenCalledWith(mockProduct, { quantity: 2 })
  })

  it('should call removeItem with item ID', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.removeItem('item-123')
    })

    expect(mockCartStore.removeItem).toHaveBeenCalledWith('item-123')
  })

  it('should call updateQuantity with item ID and new quantity', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.updateQuantity('item-123', 5)
    })

    expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('item-123', 5)
  })

  it('should provide cart summary', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 200,
      tax: 20,
      total: 220,
      itemCount: 2,
      studentCount: 1,
    })

    const { result } = renderHook(() => useCart())

    expect(result.current.summary.subtotal).toBe(200)
    expect(result.current.summary.tax).toBe(20)
    expect(result.current.summary.total).toBe(220)
    expect(result.current.summary.itemCount).toBe(2)
    expect(result.current.summary.studentCount).toBe(1)
  })

  it('should provide validation state', () => {
    mockCartStore.getValidation.mockReturnValue({
      isValid: false,
      errors: [{ itemId: 'item-1', field: 'students', message: 'Student required' }],
      warnings: [{ itemId: 'item-1', message: 'Time conflict' }],
    })

    const { result } = renderHook(() => useCart())

    expect(result.current.validation.isValid).toBe(false)
    expect(result.current.validation.errors).toHaveLength(1)
    expect(result.current.validation.warnings).toHaveLength(1)
  })

  it('should handle student operations', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addStudent('item-123', mockStudent)
    })

    expect(mockCartStore.addStudent).toHaveBeenCalledWith('item-123', mockStudent)

    act(() => {
      result.current.removeStudent('item-123', 'student-1')
    })

    expect(mockCartStore.removeStudent).toHaveBeenCalledWith('item-123', 'student-1')

    act(() => {
      result.current.updateStudent('item-123', 'student-1', { age: 9 })
    })

    expect(mockCartStore.updateStudent).toHaveBeenCalledWith('item-123', 'student-1', { age: 9 })
  })

  it('should provide utility methods', () => {
    const { result } = renderHook(() => useCart())

    result.current.getItem('item-123')
    expect(mockCartStore.getItem).toHaveBeenCalledWith('item-123')

    result.current.hasStudent('item-123', 'student-1')
    expect(mockCartStore.hasStudent).toHaveBeenCalledWith('item-123', 'student-1')
  })

  it('should handle cart clearing with order ID', async () => {
    const { result } = renderHook(() => useCart())

    await act(async () => {
      await result.current.clearCartAfterSuccess('order-456')
    })

    expect(mockCartStore.clearCartAfterSuccess).toHaveBeenCalledWith('order-456')
  })

  it('should provide isEmpty computed property', () => {
    const { result } = renderHook(() => useCart())

    expect(result.current.isEmpty).toBe(true)

    mockCartStore.items = [
      {
        id: 'item-1',
        product: mockProduct,
        quantity: 1,
        students: [],
        pricePerItem: 100,
        totalPrice: 100,
        createdAt: new Date(),
      },
    ]

    const { result: newResult } = renderHook(() => useCart())
    expect(newResult.current.isEmpty).toBe(false)
  })

  it('should provide hasItems computed property', () => {
    const { result } = renderHook(() => useCart())

    expect(result.current.hasItems).toBe(false)

    mockCartStore.items = [
      {
        id: 'item-1',
        product: mockProduct,
        quantity: 1,
        students: [],
        pricePerItem: 100,
        totalPrice: 100,
        createdAt: new Date(),
      },
    ]

    const { result: newResult } = renderHook(() => useCart())
    expect(newResult.current.hasItems).toBe(true)
  })

  it('should provide itemCount computed property', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 300,
      tax: 30,
      total: 330,
      itemCount: 3,
      studentCount: 2,
    })

    const { result } = renderHook(() => useCart())

    expect(result.current.itemCount).toBe(3)
  })

  it('should provide studentCount computed property', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 200,
      tax: 20,
      total: 220,
      itemCount: 2,
      studentCount: 4,
    })

    const { result } = renderHook(() => useCart())

    expect(result.current.studentCount).toBe(4)
  })

  it('should provide isValid computed property', () => {
    mockCartStore.getValidation.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    })

    const { result } = renderHook(() => useCart())

    expect(result.current.isValid).toBe(true)

    mockCartStore.getValidation.mockReturnValue({
      isValid: false,
      errors: [{ itemId: 'item-1', field: 'students', message: 'Student required' }],
      warnings: [],
    })

    const { result: newResult } = renderHook(() => useCart())
    expect(newResult.current.isValid).toBe(false)
  })

  it('should provide hasErrors computed property', () => {
    mockCartStore.getValidation.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    })

    const { result } = renderHook(() => useCart())

    expect(result.current.hasErrors).toBe(false)

    mockCartStore.getValidation.mockReturnValue({
      isValid: false,
      errors: [{ itemId: 'item-1', field: 'students', message: 'Student required' }],
      warnings: [],
    })

    const { result: newResult } = renderHook(() => useCart())
    expect(newResult.current.hasErrors).toBe(true)
  })

  it('should provide hasWarnings computed property', () => {
    mockCartStore.getValidation.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    })

    const { result } = renderHook(() => useCart())

    expect(result.current.hasWarnings).toBe(false)

    mockCartStore.getValidation.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [{ itemId: 'item-1', message: 'Time conflict' }],
    })

    const { result: newResult } = renderHook(() => useCart())
    expect(newResult.current.hasWarnings).toBe(true)
  })

  it('should handle loading state', () => {
    mockCartStore.isLoading = true

    const { result } = renderHook(() => useCart())

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle error state', () => {
    mockCartStore.error = 'Failed to load cart'

    const { result } = renderHook(() => useCart())

    expect(result.current.error).toBe('Failed to load cart')
  })

  it('should provide item details update method', () => {
    const { result } = renderHook(() => useCart())

    const updates = {
      notes: 'Special instructions',
      selectedDate: new Date('2024-06-15'),
    }

    act(() => {
      result.current.updateItemDetails('item-123', updates)
    })

    expect(mockCartStore.updateItemDetails).toHaveBeenCalledWith('item-123', updates)
  })

  it('should handle multiple simultaneous operations', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem(mockProduct)
      result.current.updateQuantity('item-1', 2)
      result.current.addStudent('item-1', mockStudent)
    })

    expect(mockCartStore.addItem).toHaveBeenCalledWith(mockProduct)
    expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('item-1', 2)
    expect(mockCartStore.addStudent).toHaveBeenCalledWith('item-1', mockStudent)
  })

  it('should maintain referential stability for methods', () => {
    const { result, rerender } = renderHook(() => useCart())

    const initialAddItem = result.current.addItem
    const initialRemoveItem = result.current.removeItem

    rerender()

    expect(result.current.addItem).toBe(initialAddItem)
    expect(result.current.removeItem).toBe(initialRemoveItem)
  })
})

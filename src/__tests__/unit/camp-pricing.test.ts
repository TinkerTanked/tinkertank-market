import { describe, it, expect, beforeEach } from 'vitest'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { Product, ProductCategory } from '@/types/products'
import { act, renderHook } from '@testing-library/react'

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'test-product',
  name: 'Test Product',
  description: 'A test product',
  shortDescription: 'Test',
  price: 100,
  category: 'camps' as ProductCategory,
  ageRange: '6-16 years',
  duration: '6 hours',
  location: 'Neutral Bay',
  features: [],
  images: [],
  tags: [],
  availability: {
    type: 'weekdays',
    timeSlots: [{ start: '09:00', end: '15:00' }],
    weekDays: [1, 2, 3, 4, 5]
  },
  ...overrides
})

describe('Camp Pricing Logic', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useEnhancedCartStore())
    act(() => {
      result.current.clearCart()
    })
  })

  describe('Non-bundle products multiply by selectedDates count', () => {
    it('should multiply price by number of selected dates for day-camp', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const dayCamp = createMockProduct({
        id: 'day-camp',
        name: 'Day Camp',
        price: 109.99
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02'),
        new Date('2024-06-03')
      ]

      act(() => {
        result.current.addItem(dayCamp, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(109.99 * 3, 2) // 329.97
      expect(result.current.items[0].totalPrice).toBeCloseTo(329.97, 2)
    })

    it('should calculate price for single day correctly', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const dayCamp = createMockProduct({
        id: 'day-camp',
        name: 'Day Camp',
        price: 109.99
      })
      const selectedDates = [new Date('2024-06-01')]

      act(() => {
        result.current.addItem(dayCamp, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(109.99, 2)
    })

    it('should multiply price by dates for all-day-camp', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const allDayCamp = createMockProduct({
        id: 'all-day-camp',
        name: 'All Day Camp',
        price: 149.99
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02')
      ]

      act(() => {
        result.current.addItem(allDayCamp, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(149.99 * 2, 2) // 299.98
    })
  })

  describe('Bundle products do NOT multiply by selectedDates count', () => {
    it('should NOT multiply price by dates for day-camp-3day-bundle', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const dayCampBundle = createMockProduct({
        id: 'day-camp-3day-bundle',
        name: 'Day Camp 3-Day Bundle',
        price: 299.99
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02'),
        new Date('2024-06-03')
      ]

      act(() => {
        result.current.addItem(dayCampBundle, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(299.99, 2) // NOT multiplied by 3
    })

    it('should NOT multiply price by dates for all-day-camp-3day-bundle', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const allDayCampBundle = createMockProduct({
        id: 'all-day-camp-3day-bundle',
        name: 'All Day Camp 3-Day Bundle',
        price: 399.99
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02'),
        new Date('2024-06-03')
      ]

      act(() => {
        result.current.addItem(allDayCampBundle, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(399.99, 2)
    })

    it('should multiply bundle by quantity only, not by dates', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const dayCampBundle = createMockProduct({
        id: 'day-camp-3day-bundle',
        name: 'Day Camp 3-Day Bundle',
        price: 299.99
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02'),
        new Date('2024-06-03')
      ]

      act(() => {
        result.current.addItem(dayCampBundle, {
          quantity: 2,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(299.99 * 2, 2) // 599.98
    })
  })

  describe('Bundle detection by name', () => {
    it('should detect bundle by name containing "Bundle"', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const bundleProduct = createMockProduct({
        id: 'custom-product',
        name: 'Custom Week Bundle',
        price: 500
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02'),
        new Date('2024-06-03'),
        new Date('2024-06-04'),
        new Date('2024-06-05')
      ]

      act(() => {
        result.current.addItem(bundleProduct, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(500, 2) // NOT multiplied by 5
    })

    it('should detect bundle by lowercase "bundle" in name', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const bundleProduct = createMockProduct({
        id: 'custom-product',
        name: 'Summer bundle special',
        price: 250
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02')
      ]

      act(() => {
        result.current.addItem(bundleProduct, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(250, 2) // NOT multiplied by 2
    })

    it('should NOT treat regular product as bundle', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const regularProduct = createMockProduct({
        id: 'regular-camp',
        name: 'Regular Camp Day',
        price: 100
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02')
      ]

      act(() => {
        result.current.addItem(regularProduct, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(100 * 2, 2) // SHOULD be multiplied by 2
    })
  })

  describe('Non-bundle with quantity > 1', () => {
    it('should multiply non-bundle price by both quantity and dates', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const dayCamp = createMockProduct({
        id: 'day-camp',
        name: 'Day Camp',
        price: 109.99
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02'),
        new Date('2024-06-03')
      ]

      act(() => {
        result.current.addItem(dayCamp, {
          quantity: 2,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(109.99 * 2 * 3, 2) // 659.94
    })
  })

  describe('Edge cases', () => {
    it('should handle empty selectedDates array', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const dayCamp = createMockProduct({
        id: 'day-camp',
        name: 'Day Camp',
        price: 109.99
      })

      act(() => {
        result.current.addItem(dayCamp, {
          quantity: 1,
          selectedDates: []
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(109.99, 2)
    })

    it('should handle undefined selectedDates', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const dayCamp = createMockProduct({
        id: 'day-camp',
        name: 'Day Camp',
        price: 109.99
      })

      act(() => {
        result.current.addItem(dayCamp, {
          quantity: 1
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(109.99, 2)
    })

    it('should update price correctly when quantity is changed', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const dayCamp = createMockProduct({
        id: 'day-camp',
        name: 'Day Camp',
        price: 109.99
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02')
      ]

      act(() => {
        result.current.addItem(dayCamp, {
          quantity: 1,
          selectedDates
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.updateQuantity(itemId, 3)
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(109.99 * 3 * 2, 2) // 659.94
    })

    it('should update bundle price correctly when quantity is changed', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const bundleProduct = createMockProduct({
        id: 'day-camp-3day-bundle',
        name: 'Day Camp 3-Day Bundle',
        price: 299.99
      })
      const selectedDates = [
        new Date('2024-06-01'),
        new Date('2024-06-02'),
        new Date('2024-06-03')
      ]

      act(() => {
        result.current.addItem(bundleProduct, {
          quantity: 1,
          selectedDates
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.updateQuantity(itemId, 2)
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(299.99 * 2, 2) // 599.98 (not multiplied by dates)
    })
  })
})

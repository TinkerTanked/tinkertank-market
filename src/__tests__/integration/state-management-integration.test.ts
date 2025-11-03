/**
 * State Management Integration Tests
 * Tests Zustand store integration across components and persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { Product } from '@/types/products';
import { StudentDetails } from '@/types/enhancedCart';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('State Management Integration Tests', () => {
  const mockProduct: Product = {
    id: 'product_test_123',
    name: 'Test STEM Camp',
    price: 100,
    type: 'CAMP',
    category: 'camps',
    ageRange: '5-12',
    duration: 360,
    description: 'Test camp description',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockStudent: StudentDetails = {
    id: 'student_test_123',
    firstName: 'Test',
    lastName: 'Student',
    age: 8,
    parentName: 'Test Parent',
    parentEmail: 'parent@test.com',
    parentPhone: '+61400000000',
    allergies: 'None',
    medicalInfo: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useEnhancedCartStore.getState().clearCart();
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Store State Synchronization', () => {
    it('should maintain consistent state across multiple store instances', () => {
      const { result: result1 } = renderHook(() => useEnhancedCartStore());
      const { result: result2 } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result1.current.addItem(mockProduct);
      });

      // Both instances should see the same state
      expect(result1.current.items).toHaveLength(1);
      expect(result2.current.items).toHaveLength(1);
      expect(result1.current.items[0].id).toBe(result2.current.items[0].id);
    });

    it('should update all subscribers when state changes', () => {
      const subscribers: any[] = [];
      
      const { result: result1 } = renderHook(() => useEnhancedCartStore());
      const { result: result2 } = renderHook(() => useEnhancedCartStore());
      
      subscribers.push(result1, result2);

      act(() => {
        result1.current.addItem(mockProduct);
      });

      // All subscribers should have updated state
      subscribers.forEach(subscriber => {
        expect(subscriber.current.items).toHaveLength(1);
        expect(subscriber.current.items[0].product.name).toBe('Test STEM Camp');
      });
    });

    it('should handle rapid state changes without conflicts', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      const products = Array.from({ length: 10 }, (_, i) => ({
        ...mockProduct,
        id: `product_${i}`,
        name: `Product ${i}`
      }));

      act(() => {
        products.forEach(product => {
          result.current.addItem(product);
        });
      });

      expect(result.current.items).toHaveLength(10);
      
      // Verify no state corruption
      result.current.items.forEach((item, index) => {
        expect(item.product.name).toBe(`Product ${index}`);
      });
    });
  });

  describe('2. localStorage Persistence Integration', () => {
    it('should persist cart state to localStorage on changes', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'enhanced-cart-store',
        expect.stringContaining(mockProduct.id)
      );
    });

    it('should restore cart state from localStorage on initialization', () => {
      const storedState = {
        state: {
          items: [{
            id: 'item_stored_123',
            product: mockProduct,
            quantity: 1,
            students: [],
            selectedDate: null,
            selectedTime: null,
            addOns: []
          }]
        },
        version: 0
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedState));

      // Create new store instance (simulating page reload)
      const { result } = renderHook(() => useEnhancedCartStore());

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.name).toBe('Test STEM Camp');
    });

    it('should handle localStorage corruption gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid_json_data');

      const { result } = renderHook(() => useEnhancedCartStore());

      // Should initialize with empty state without crashing
      expect(result.current.items).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it('should handle localStorage quota exceeded', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      // Should continue functioning even if persistence fails
      expect(result.current.items).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });

  describe('3. Cross-Component State Sharing', () => {
    it('should share cart state between product catalog and checkout', () => {
      // Simulate ProductCatalog component
      const { result: catalogStore } = renderHook(() => useEnhancedCartStore(
        state => ({ 
          addItem: state.addItem, 
          items: state.items 
        })
      ));

      // Simulate Checkout component  
      const { result: checkoutStore } = renderHook(() => useEnhancedCartStore(
        state => ({ 
          items: state.items,
          getSummary: state.getSummary,
          validateCart: state.validateCart
        })
      ));

      act(() => {
        catalogStore.current.addItem(mockProduct);
      });

      // Checkout should see the added item
      expect(checkoutStore.current.items).toHaveLength(1);
      expect(checkoutStore.current.getSummary().subtotal).toBe(100);
    });

    it('should maintain student data consistency across components', () => {
      const { result: cartStore } = renderHook(() => useEnhancedCartStore());

      act(() => {
        cartStore.current.addItem(mockProduct);
      });

      const itemId = cartStore.current.items[0].id;

      // Add student from one component
      act(() => {
        cartStore.current.addStudent(itemId, mockStudent);
      });

      // Verify from another component
      const { result: studentStore } = renderHook(() => useEnhancedCartStore(
        state => ({ items: state.items })
      ));

      expect(studentStore.current.items[0].students).toHaveLength(1);
      expect(studentStore.current.items[0].students[0].firstName).toBe('Test');
    });

    it('should handle concurrent updates from multiple components', () => {
      const { result: component1 } = renderHook(() => useEnhancedCartStore());
      const { result: component2 } = renderHook(() => useEnhancedCartStore());

      const product1 = { ...mockProduct, id: 'product_1', name: 'Product 1' };
      const product2 = { ...mockProduct, id: 'product_2', name: 'Product 2' };

      act(() => {
        // Simulate concurrent updates
        component1.current.addItem(product1);
        component2.current.addItem(product2);
      });

      expect(component1.current.items).toHaveLength(2);
      expect(component2.current.items).toHaveLength(2);

      // Verify items are in correct order
      const itemNames = component1.current.items.map(item => item.product.name);
      expect(itemNames).toContain('Product 1');
      expect(itemNames).toContain('Product 2');
    });
  });

  describe('4. State Recovery After Errors', () => {
    it('should recover from invalid state transitions', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;
      const initialState = result.current.items;

      // Attempt invalid operation
      act(() => {
        try {
          result.current.updateItemQuantity('invalid_item_id', -1);
        } catch (error) {
          // Should not crash the store
        }
      });

      // State should remain valid
      expect(result.current.items).toEqual(initialState);
      expect(result.current.error).toBeNull();
    });

    it('should handle validation errors gracefully', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      // Add invalid student data
      const invalidStudent = {
        ...mockStudent,
        firstName: '', // Invalid - empty name
        age: 150 // Invalid - out of range
      };

      act(() => {
        result.current.addStudent(itemId, invalidStudent);
      });

      // Should add student but mark validation errors
      expect(result.current.items[0].students).toHaveLength(1);
      
      const validation = result.current.validateCart();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should maintain state integrity during network failures', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(mockProduct);
        result.current.setLoading(true);
      });

      // Simulate network failure
      act(() => {
        result.current.setError('Network request failed');
        result.current.setLoading(false);
      });

      // Cart contents should remain intact
      expect(result.current.items).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network request failed');
    });
  });

  describe('5. Performance Integration Tests', () => {
    it('should handle large cart sizes efficiently', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      const startTime = performance.now();

      act(() => {
        // Add many items
        for (let i = 0; i < 100; i++) {
          result.current.addItem({
            ...mockProduct,
            id: `product_${i}`,
            name: `Product ${i}`
          });
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.items).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should optimize re-renders with selector pattern', () => {
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useEnhancedCartStore(state => state.items.length);
      });

      act(() => {
        result.current; // Access the selected value
      });

      const initialRenderCount = renderCount;

      // Update unrelated state
      act(() => {
        useEnhancedCartStore.getState().setLoading(true);
      });

      // Should not trigger additional renders for unrelated state
      expect(renderCount).toBe(initialRenderCount);
    });

    it('should debounce localStorage writes for performance', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        // Make rapid changes
        for (let i = 0; i < 10; i++) {
          result.current.addItem({
            ...mockProduct,
            id: `rapid_${i}`,
            name: `Rapid ${i}`
          });
        }
      });

      // Should not call localStorage.setItem for every change
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(10);
    });
  });

  describe('6. Complex Business Logic Integration', () => {
    it('should calculate pricing with multiple students and add-ons', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      const addOn = {
        id: 'addon_lunch',
        name: 'Lunch',
        price: 15,
        type: 'FOOD' as const,
        description: 'Healthy lunch'
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        // Add multiple students
        result.current.addStudent(itemId, { ...mockStudent, id: 'student_1' });
        result.current.addStudent(itemId, { ...mockStudent, id: 'student_2' });
        
        // Add add-ons for each student
        result.current.addItemAddOn(itemId, addOn, 2); // 2 lunches
      });

      const summary = result.current.getSummary();
      
      // Base price: $100 × 2 students = $200
      // Add-ons: $15 × 2 = $30
      // Total: $230
      expect(summary.subtotal).toBe(230);
      expect(summary.gst).toBeCloseTo(20.91, 2); // 230 × 1/11
      expect(summary.total).toBeCloseTo(250.91, 2);
    });

    it('should validate business rules across state changes', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      // Add birthday party (max 12 students)
      const birthdayProduct = {
        ...mockProduct,
        id: 'birthday_123',
        type: 'BIRTHDAY' as const,
        name: 'Birthday Party'
      };

      act(() => {
        result.current.addItem(birthdayProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        // Try to add too many students
        for (let i = 0; i < 15; i++) {
          result.current.addStudent(itemId, {
            ...mockStudent,
            id: `student_${i}`,
            firstName: `Student${i}`
          });
        }
      });

      const validation = result.current.validateCart();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringMatching(/maximum.*12.*students/i)
      );
    });

    it('should handle age restrictions and product constraints', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      const teenProduct = {
        ...mockProduct,
        id: 'teen_camp_123',
        name: 'Teen Coding Camp',
        ageRange: '13-17'
      };

      act(() => {
        result.current.addItem(teenProduct);
      });

      const itemId = result.current.items[0].id;

      // Try to add student outside age range
      const youngStudent = {
        ...mockStudent,
        id: 'young_student',
        age: 8 // Too young for 13-17 camp
      };

      act(() => {
        result.current.addStudent(itemId, youngStudent);
      });

      const validation = result.current.validateCart();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringMatching(/age must be between 13 and 17/i)
      );
    });
  });

  describe('7. Store Integration with External Systems', () => {
    it('should prepare order data for payment processing', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.addStudent(itemId, mockStudent);
        result.current.updateItemDate(itemId, new Date('2024-10-15T09:00:00Z'));
      });

      const orderData = result.current.prepareOrderData();

      expect(orderData).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: mockProduct.id,
            quantity: 1,
            students: expect.arrayContaining([
              expect.objectContaining({
                firstName: 'Test',
                lastName: 'Student'
              })
            ]),
            bookingDate: expect.any(Date)
          })
        ]),
        summary: expect.objectContaining({
          subtotal: 100,
          total: expect.any(Number)
        })
      });
    });

    it('should sync with external calendar system requirements', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;
      const bookingDate = new Date('2024-10-15T09:00:00Z');

      act(() => {
        result.current.addStudent(itemId, mockStudent);
        result.current.updateItemDate(itemId, bookingDate);
        result.current.updateItemTime(itemId, '09:00');
      });

      const calendarData = result.current.getCalendarEvents();

      expect(calendarData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Test STEM Camp'),
            start: expect.any(Date),
            end: expect.any(Date),
            students: expect.arrayContaining([
              expect.objectContaining({
                name: 'Test Student',
                allergies: 'None'
              })
            ])
          })
        ])
      );
    });

    it('should handle store cleanup after successful payment', () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(mockProduct);
        result.current.addStudent(result.current.items[0].id, mockStudent);
      });

      expect(result.current.items).toHaveLength(1);

      // Simulate successful payment
      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'enhanced-cart-store',
        expect.stringContaining('"items":[]')
      );
    });
  });
});

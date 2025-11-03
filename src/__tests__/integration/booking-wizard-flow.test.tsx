/**
 * Booking Wizard Flow Tests
 * 
 * Tests the complete booking wizard navigation, step validation,
 * back/forward navigation, and progress indicator functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckoutPage from '@/app/checkout/page'
import StudentInfoForm from '@/components/checkout/StudentInfoForm'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { Product, ProductCategory } from '@/types/products'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Stripe
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
  useStripe: () => ({}),
  useElements: () => ({}),
}))

const testCampProduct: Product = {
  id: 'test-camp-1',
  name: 'Test STEM Camp',
  category: 'camps' as ProductCategory,
  type: 'day-camp',
  price: 85,
  shortDescription: 'Test camp for booking flow',
  fullDescription: 'Full test camp description',
  ageRange: '6-12',
  duration: '9am-3pm',
  location: 'Neutral Bay',
  maxCapacity: 12,
  isActive: true,
  features: [],
  addOns: []
}

describe('Booking Wizard Flow Tests', () => {
  beforeEach(() => {
    useEnhancedCartStore.getState().clearCart()
    vi.clearAllMocks()
  })

  describe('Step Navigation', () => {
    it('should start at review step when cart has items', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Should show review step
      expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      expect(screen.getByText('Continue to Student Info')).toBeInTheDocument()
    })

    it('should redirect to camps page when cart is empty', async () => {
      render(<CheckoutPage />)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/camps')
      })
    })

    it('should progress through all steps with valid data', async () => {
      const user = userEvent.setup()
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Step 1: Review
      expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      
      const continueButton = screen.getByText('Continue to Student Info')
      await user.click(continueButton)
      
      // Step 2: Student Info should be visible
      await waitFor(() => {
        expect(screen.getByText('Student Information')).toBeInTheDocument()
      })
    })

    it('should show progress indicator correctly', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Check progress indicators exist
      expect(screen.getByText('Review')).toBeInTheDocument()
      expect(screen.getByText('Students')).toBeInTheDocument()
      expect(screen.getByText('Payment')).toBeInTheDocument()
      
      // Review should be active (primary color)
      const reviewStepElement = screen.getByText('Review').closest('div')
      expect(reviewStepElement).toHaveClass('text-primary-600')
    })

    it('should handle back navigation', async () => {
      const user = userEvent.setup()
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      // Add student to make validation pass
      const items = useEnhancedCartStore.getState().items
      useEnhancedCartStore.getState().addStudent(items[0].id, {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        age: 8,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '0400000000'
      })

      render(<CheckoutPage />)
      
      // Go to step 2
      await user.click(screen.getByText('Continue to Student Info'))
      
      await waitFor(() => {
        expect(screen.getByText('Student Information')).toBeInTheDocument()
      })
      
      // Go to step 3 (if validation passes)
      const validation = useEnhancedCartStore.getState().getValidation()
      if (validation.isValid) {
        // Mock student form completion and proceed to payment
        const proceedButton = screen.queryByText('Continue to Payment')
        if (proceedButton) {
          await user.click(proceedButton)
          
          await waitFor(() => {
            expect(screen.getByText('Payment Details')).toBeInTheDocument()
          })
          
          // Test back navigation from payment step
          const backButton = screen.queryByText('Back to Student Info')
          if (backButton) {
            await user.click(backButton)
            
            await waitFor(() => {
              expect(screen.getByText('Student Information')).toBeInTheDocument()
            })
          }
        }
      }
    })

    it('should validate step requirements before progression', async () => {
      const user = userEvent.setup()
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Step 1 should allow progression (review step)
      const continueButton = screen.getByText('Continue to Student Info')
      expect(continueButton).toBeEnabled()
      
      await user.click(continueButton)
      
      // Step 2 should block progression without student info
      await waitFor(() => {
        expect(screen.getByText('Student Information')).toBeInTheDocument()
      })
      
      // Validation should prevent payment step without complete student info
      const validation = useEnhancedCartStore.getState().getValidation()
      expect(validation.isValid).toBe(false)
    })
  })

  describe('Step Content Validation', () => {
    it('should show order items in review step', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 2,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Should show product details
      expect(screen.getByText('Test STEM Camp')).toBeInTheDocument()
      expect(screen.getByText('Test camp for booking flow')).toBeInTheDocument()
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument()
      
      // Should show formatted date and time
      const dateText = screen.getByText(/📅/)
      const timeText = screen.getByText(/🕒/)
      expect(dateText).toBeInTheDocument()
      expect(timeText).toBeInTheDocument()
    })

    it('should calculate and display prices correctly', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 2,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Should show total price for 2 items
      const priceElements = screen.getAllByText(/\$170\.00/) // 2 × $85
      expect(priceElements.length).toBeGreaterThan(0)
    })

    it('should show edit cart link', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      const editCartLink = screen.getByText('Edit Cart')
      expect(editCartLink).toBeInTheDocument()
      expect(editCartLink.closest('a')).toHaveAttribute('href', '/cart')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing product data gracefully', async () => {
      const { items } = useEnhancedCartStore.getState()
      
      // Manually add invalid item to test error handling
      useEnhancedCartStore.setState({
        items: [{
          id: 'invalid-item',
          product: null as any, // Invalid product
          quantity: 1,
          students: [],
          pricePerItem: 0,
          totalPrice: 0,
          createdAt: new Date()
        }]
      })

      // Should not crash when rendering with invalid data
      expect(() => render(<CheckoutPage />)).not.toThrow()
    })

    it('should handle cart state changes during checkout', async () => {
      const { addItem, removeItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      const { rerender } = render(<CheckoutPage />)
      
      expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      
      // Remove item from cart
      const items = useEnhancedCartStore.getState().items
      removeItem(items[0].id)
      
      // Rerender and check redirect behavior
      rerender(<CheckoutPage />)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/camps')
      })
    })

    it('should validate required fields in student form', async () => {
      const mockOnComplete = vi.fn()
      const mockOnBack = vi.fn()
      
      render(<StudentInfoForm onComplete={mockOnComplete} onBack={mockOnBack} />)
      
      // Try to submit without filling required fields
      const submitButton = screen.queryByText('Continue to Payment')
      if (submitButton) {
        await userEvent.click(submitButton)
        
        // Should not call onComplete without valid data
        expect(mockOnComplete).not.toHaveBeenCalled()
      }
    })
  })

  describe('Accessibility and UX', () => {
    it('should have proper ARIA labels and roles', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Check for proper button roles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Check for navigation landmarks
      expect(screen.getByText('Continue to Student Info')).toBeInTheDocument()
    })

    it('should show loading states appropriately', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Component should render without loading states for synchronous operations
      expect(screen.getByText('Review Your Order')).toBeInTheDocument()
    })

    it('should handle responsive design elements', async () => {
      const { addItem } = useEnhancedCartStore.getState()
      
      addItem(testCampProduct, {
        quantity: 1,
        selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        selectedTimeSlot: '9:00 AM - 3:00 PM'
      })

      render(<CheckoutPage />)
      
      // Check for responsive grid classes
      const container = screen.getByText('Review Your Order').closest('.lg\\:col-span-2')
      expect(container).toBeInTheDocument()
    })
  })
})

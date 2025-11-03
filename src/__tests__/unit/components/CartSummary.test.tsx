import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import CartSummary from '@/components/cart/CartSummary'
import { Product } from '@/types/products'
import { EnhancedCartItem } from '@/types/enhancedCart'

// Mock the cart store
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

const mockCartItem: EnhancedCartItem = {
  id: 'item-1',
  product: mockProduct,
  quantity: 2,
  students: [],
  pricePerItem: 100,
  totalPrice: 200,
  createdAt: new Date(),
}

describe('CartSummary Component', () => {
  const mockCartStore = {
    items: [],
    getSummary: vi.fn(() => ({
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
      studentCount: 0,
    })),
    getValidation: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    updateQuantity: vi.fn(),
    addStudent: vi.fn(),
    removeStudent: vi.fn(),
    updateStudent: vi.fn(),
    updateItemDetails: vi.fn(),
    clearCartAfterSuccess: vi.fn(),
    getItem: vi.fn(),
    hasStudent: vi.fn(),
    loadFromStorage: vi.fn(),
    saveToStorage: vi.fn(),
    isLoading: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useEnhancedCartStore as any).mockReturnValue(mockCartStore)
  })

  it('should render empty cart summary', () => {
    render(<CartSummary />)
    
    expect(screen.getByText('Subtotal:')).toBeInTheDocument()
    expect(screen.getByText('GST (10%):')).toBeInTheDocument()
    expect(screen.getByText('Total:')).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('should display correct calculations for single item', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 1,
      studentCount: 0,
    })

    render(<CartSummary />)
    
    expect(screen.getByText('$100.00')).toBeInTheDocument() // Subtotal
    expect(screen.getByText('$10.00')).toBeInTheDocument() // Tax
    expect(screen.getByText('$110.00')).toBeInTheDocument() // Total
  })

  it('should display correct calculations for multiple items', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 250,
      tax: 25,
      total: 275,
      itemCount: 3,
      studentCount: 2,
    })

    render(<CartSummary />)
    
    expect(screen.getByText('$250.00')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('$275.00')).toBeInTheDocument()
  })

  it('should show item count when items present', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 200,
      tax: 20,
      total: 220,
      itemCount: 2,
      studentCount: 1,
    })

    render(<CartSummary showItemCount={true} />)
    
    expect(screen.getByText('Items (2):')).toBeInTheDocument()
  })

  it('should show student count when students enrolled', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 300,
      tax: 30,
      total: 330,
      itemCount: 2,
      studentCount: 3,
    })

    render(<CartSummary showStudentCount={true} />)
    
    expect(screen.getByText('Students enrolled: 3')).toBeInTheDocument()
  })

  it('should format currency correctly', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 999.99,
      tax: 100.00,
      total: 1099.99,
      itemCount: 1,
      studentCount: 1,
    })

    render(<CartSummary />)
    
    expect(screen.getByText('$999.99')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('$1,099.99')).toBeInTheDocument()
  })

  it('should handle zero values gracefully', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
      studentCount: 0,
    })

    render(<CartSummary showItemCount={true} showStudentCount={true} />)
    
    expect(screen.getByText('Items (0):')).toBeInTheDocument()
    expect(screen.getByText('Students enrolled: 0')).toBeInTheDocument()
    expect(screen.getAllByText('$0.00')).toHaveLength(3) // Subtotal, tax, total
  })

  it('should apply custom className', () => {
    render(<CartSummary className="custom-summary" />)
    
    const summaryElement = screen.getByRole('region')
    expect(summaryElement).toHaveClass('custom-summary')
  })

  it('should show discount line when discount applied', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 200,
      tax: 18, // Tax on discounted amount
      total: 198,
      itemCount: 2,
      studentCount: 1,
      discount: 20, // 10% discount
      originalSubtotal: 220,
    })

    render(<CartSummary />)
    
    expect(screen.getByText('Original subtotal:')).toBeInTheDocument()
    expect(screen.getByText('$220.00')).toBeInTheDocument()
    expect(screen.getByText('Discount:')).toBeInTheDocument()
    expect(screen.getByText('-$20.00')).toBeInTheDocument()
  })

  it('should highlight total amount', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 1,
      studentCount: 1,
    })

    render(<CartSummary />)
    
    const totalRow = screen.getByText('Total:').closest('div')
    expect(totalRow).toHaveClass('font-bold', 'text-lg')
  })

  it('should show savings when applicable', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 180,
      tax: 18,
      total: 198,
      itemCount: 2,
      studentCount: 2,
      savings: 22, // Multi-student discount
    })

    render(<CartSummary />)
    
    expect(screen.getByText('You save: $22.00')).toBeInTheDocument()
  })

  it('should show breakdown for complex pricing', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 315,
      tax: 31.50,
      total: 346.50,
      itemCount: 3,
      studentCount: 2,
      breakdown: {
        basePrice: 300,
        addOns: 30,
        fees: 5,
        discount: -20,
      },
    })

    render(<CartSummary showBreakdown={true} />)
    
    expect(screen.getByText('Base price:')).toBeInTheDocument()
    expect(screen.getByText('$300.00')).toBeInTheDocument()
    expect(screen.getByText('Add-ons:')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
    expect(screen.getByText('Processing fee:')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<CartSummary />)
    
    const summary = screen.getByRole('region')
    expect(summary).toHaveAttribute('aria-label', 'Cart summary')
  })

  it('should update reactively when cart changes', () => {
    const { rerender } = render(<CartSummary />)
    
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 1,
      studentCount: 1,
    })

    rerender(<CartSummary />)
    
    expect(screen.getByText('$110.00')).toBeInTheDocument()
  })

  it('should handle large numbers correctly', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 9999.99,
      tax: 999.999,
      total: 10999.989,
      itemCount: 50,
      studentCount: 25,
    })

    render(<CartSummary />)
    
    expect(screen.getByText('$9,999.99')).toBeInTheDocument()
    expect(screen.getByText('$1,000.00')).toBeInTheDocument() // Tax rounded
    expect(screen.getByText('$10,999.99')).toBeInTheDocument() // Total rounded
  })

  it('should show loading state when cart is loading', () => {
    mockCartStore.isLoading = true
    
    render(<CartSummary />)
    
    expect(screen.getByText('Calculating...')).toBeInTheDocument()
  })

  it('should show error state when cart has errors', () => {
    mockCartStore.error = 'Failed to calculate totals'
    
    render(<CartSummary />)
    
    expect(screen.getByText('Error calculating totals')).toBeInTheDocument()
  })
})

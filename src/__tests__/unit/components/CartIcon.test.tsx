import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import CartIcon from '@/components/cart/CartIcon'
import { Product } from '@/types/products'

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

describe('CartIcon Component', () => {
  const mockCartStore = {
    items: [],
    getSummary: vi.fn(() => ({
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
      studentCount: 0,
    })),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    updateQuantity: vi.fn(),
    addStudent: vi.fn(),
    removeStudent: vi.fn(),
    updateStudent: vi.fn(),
    updateItemDetails: vi.fn(),
    clearCartAfterSuccess: vi.fn(),
    getValidation: vi.fn(() => ({
      isValid: true,
      errors: [],
      warnings: [],
    })),
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

  it('should render cart icon with zero items', () => {
    render(<CartIcon />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument() // Badge should be hidden for 0 items
  })

  it('should show item count badge when cart has items', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 3,
      studentCount: 2,
    })

    render(<CartIcon />)
    
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should show correct count for multiple items', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 300,
      tax: 30,
      total: 330,
      itemCount: 5,
      studentCount: 3,
    })

    render(<CartIcon />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should trigger click handler when clicked', () => {
    const onClickMock = vi.fn()
    
    render(<CartIcon onClick={onClickMock} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onClickMock).toHaveBeenCalledOnce()
  })

  it('should be accessible', () => {
    render(<CartIcon />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Shopping cart')
  })

  it('should handle large item counts', () => {
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 9999,
      tax: 999.9,
      total: 10998.9,
      itemCount: 99,
      studentCount: 50,
    })

    render(<CartIcon />)
    
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('should update badge when cart changes', () => {
    const { rerender } = render(<CartIcon />)
    
    expect(screen.queryByText('1')).not.toBeInTheDocument()
    
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 1,
      studentCount: 1,
    })

    rerender(<CartIcon />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<CartIcon className="custom-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should be disabled when loading', () => {
    mockCartStore.isLoading = true
    
    render(<CartIcon disabled />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})

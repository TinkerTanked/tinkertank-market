import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import CartDrawer from '@/components/cart/CartDrawer'
import { Product } from '@/types/products'
import { EnhancedCartItem } from '@/types/enhancedCart'

// Mock the cart store
vi.mock('@/stores/enhancedCartStore')

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

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
  quantity: 1,
  students: [],
  pricePerItem: 100,
  totalPrice: 100,
  createdAt: new Date(),
}

describe('CartDrawer Component', () => {
  const mockCartStore = {
    items: [],
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

  it('should render drawer when open', () => {
    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument()
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
  })

  it('should not render drawer when closed', () => {
    render(<CartDrawer isOpen={false} onClose={vi.fn()} />)
    
    expect(screen.queryByText('Shopping Cart')).not.toBeInTheDocument()
  })

  it('should call onClose when close button clicked', async () => {
    const onCloseMock = vi.fn()
    const user = userEvent.setup()
    
    render(<CartDrawer isOpen={true} onClose={onCloseMock} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(onCloseMock).toHaveBeenCalledOnce()
  })

  it('should display cart items', () => {
    mockCartStore.items = [mockCartItem]
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 1,
      studentCount: 0,
    })

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Test Camp')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('should display cart summary', () => {
    mockCartStore.items = [mockCartItem]
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 1,
      studentCount: 0,
    })

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Subtotal:')).toBeInTheDocument()
    expect(screen.getByText('GST:')).toBeInTheDocument()
    expect(screen.getByText('Total:')).toBeInTheDocument()
    expect(screen.getByText('$110.00')).toBeInTheDocument()
  })

  it('should show checkout button when cart has items', () => {
    mockCartStore.items = [mockCartItem]
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 1,
      studentCount: 0,
    })

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument()
  })

  it('should disable checkout when validation fails', () => {
    mockCartStore.items = [mockCartItem]
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 100,
      tax: 10,
      total: 110,
      itemCount: 1,
      studentCount: 0,
    })
    mockCartStore.getValidation.mockReturnValue({
      isValid: false,
      errors: [{ itemId: 'item-1', field: 'students', message: '1 more student required' }],
      warnings: [],
    })

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    const checkoutButton = screen.getByText('Proceed to Checkout')
    expect(checkoutButton).toBeDisabled()
  })

  it('should display validation errors', () => {
    mockCartStore.items = [mockCartItem]
    mockCartStore.getValidation.mockReturnValue({
      isValid: false,
      errors: [{ itemId: 'item-1', field: 'students', message: '1 more student required' }],
      warnings: [],
    })

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('1 more student required')).toBeInTheDocument()
  })

  it('should display validation warnings', () => {
    mockCartStore.items = [mockCartItem]
    mockCartStore.getValidation.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [{ itemId: 'item-1', message: 'Student has overlapping bookings' }],
    })

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Student has overlapping bookings')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    const onCloseMock = vi.fn()
    const user = userEvent.setup()
    
    render(<CartDrawer isOpen={true} onClose={onCloseMock} />)
    
    await user.keyboard('{Escape}')
    
    expect(onCloseMock).toHaveBeenCalledOnce()
  })

  it('should trap focus within drawer when open', async () => {
    mockCartStore.items = [mockCartItem]
    const user = userEvent.setup()
    
    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    const checkoutButton = screen.getByText('Proceed to Checkout')
    
    // Focus should be trapped within the drawer
    await user.tab()
    expect(document.activeElement).toBe(closeButton)
    
    await user.tab()
    expect(document.activeElement).toBe(checkoutButton)
  })

  it('should handle empty cart state', () => {
    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument()
    expect(screen.queryByText('Proceed to Checkout')).not.toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockCartStore.isLoading = true
    
    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show error state', () => {
    mockCartStore.error = 'Failed to load cart'
    
    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Failed to load cart')).toBeInTheDocument()
  })

  it('should handle overlay click to close', async () => {
    const onCloseMock = vi.fn()
    const user = userEvent.setup()
    
    render(<CartDrawer isOpen={true} onClose={onCloseMock} />)
    
    const overlay = screen.getByTestId('cart-drawer-overlay')
    await user.click(overlay)
    
    expect(onCloseMock).toHaveBeenCalledOnce()
  })

  it('should not close when clicking inside drawer content', async () => {
    const onCloseMock = vi.fn()
    const user = userEvent.setup()
    
    render(<CartDrawer isOpen={true} onClose={onCloseMock} />)
    
    const drawerContent = screen.getByText('Shopping Cart')
    await user.click(drawerContent)
    
    expect(onCloseMock).not.toHaveBeenCalled()
  })

  it('should display item count in header', () => {
    mockCartStore.items = [mockCartItem, { ...mockCartItem, id: 'item-2' }]
    mockCartStore.getSummary.mockReturnValue({
      subtotal: 200,
      tax: 20,
      total: 220,
      itemCount: 2,
      studentCount: 0,
    })

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Shopping Cart (2 items)')).toBeInTheDocument()
  })

  it('should handle clear cart action', async () => {
    mockCartStore.items = [mockCartItem]
    const user = userEvent.setup()
    
    render(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    const clearButton = screen.getByText('Clear Cart')
    await user.click(clearButton)
    
    expect(mockCartStore.clearCart).toHaveBeenCalledOnce()
  })

  it('should animate drawer entrance and exit', () => {
    const { rerender } = render(<CartDrawer isOpen={false} onClose={vi.fn()} />)
    
    rerender(<CartDrawer isOpen={true} onClose={vi.fn()} />)
    
    const drawer = screen.getByRole('dialog')
    expect(drawer).toHaveClass('animate-slide-in')
  })
})

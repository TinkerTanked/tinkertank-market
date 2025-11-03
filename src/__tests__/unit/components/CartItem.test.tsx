import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import CartItem from '@/components/cart/CartItem'
import { Product } from '@/types/products'
import { EnhancedCartItem, StudentDetails } from '@/types/enhancedCart'

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
  images: ['https://example.com/image.jpg'],
  features: ['Feature 1', 'Feature 2'],
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

const mockCartItem: EnhancedCartItem = {
  id: 'item-1',
  product: mockProduct,
  quantity: 2,
  students: [mockStudent],
  pricePerItem: 100,
  totalPrice: 200,
  createdAt: new Date(),
  selectedDate: new Date('2024-06-15'),
  selectedTimeSlot: { startTime: '09:00', endTime: '15:00' },
}

describe('CartItem Component', () => {
  const mockCartStore = {
    items: [mockCartItem],
    getSummary: vi.fn(),
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

  it('should render cart item with product details', () => {
    render(<CartItem item={mockCartItem} />)
    
    expect(screen.getByText('Test Camp')).toBeInTheDocument()
    expect(screen.getByText('$200.00')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
  })

  it('should display product image', () => {
    render(<CartItem item={mockCartItem} />)
    
    const image = screen.getByRole('img', { name: /test camp/i })
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('should show selected date and time', () => {
    render(<CartItem item={mockCartItem} />)
    
    expect(screen.getByText('June 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('09:00 - 15:00')).toBeInTheDocument()
  })

  it('should update quantity when input changes', async () => {
    const user = userEvent.setup()
    render(<CartItem item={mockCartItem} />)
    
    const quantityInput = screen.getByDisplayValue('2')
    await user.clear(quantityInput)
    await user.type(quantityInput, '3')
    
    expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('item-1', 3)
  })

  it('should remove item when quantity becomes 0', async () => {
    const user = userEvent.setup()
    render(<CartItem item={mockCartItem} />)
    
    const quantityInput = screen.getByDisplayValue('2')
    await user.clear(quantityInput)
    await user.type(quantityInput, '0')
    
    expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('item-1', 0)
  })

  it('should call removeItem when delete button clicked', async () => {
    const user = userEvent.setup()
    render(<CartItem item={mockCartItem} />)
    
    const deleteButton = screen.getByRole('button', { name: /remove.*item/i })
    await user.click(deleteButton)
    
    expect(mockCartStore.removeItem).toHaveBeenCalledWith('item-1')
  })

  it('should display assigned students', () => {
    render(<CartItem item={mockCartItem} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Age: 8')).toBeInTheDocument()
  })

  it('should show add student button when students needed', () => {
    const itemWithoutEnoughStudents = {
      ...mockCartItem,
      quantity: 3,
      students: [mockStudent], // Only 1 student for 3 quantity
    }
    
    render(<CartItem item={itemWithoutEnoughStudents} />)
    
    expect(screen.getByText('Add Student (2 more needed)')).toBeInTheDocument()
  })

  it('should handle student form submission', async () => {
    const user = userEvent.setup()
    const itemWithoutStudents = {
      ...mockCartItem,
      students: [],
    }
    
    render(<CartItem item={itemWithoutStudents} />)
    
    const addStudentButton = screen.getByText('Add Student (2 needed)')
    await user.click(addStudentButton)
    
    // Fill in student form
    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/age/i), '7')
    await user.type(screen.getByLabelText(/parent name/i), 'John Smith')
    await user.type(screen.getByLabelText(/parent email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/parent phone/i), '+61-987-654-321')
    
    const submitButton = screen.getByText('Add Student')
    await user.click(submitButton)
    
    expect(mockCartStore.addStudent).toHaveBeenCalledWith('item-1', expect.objectContaining({
      firstName: 'Jane',
      lastName: 'Smith',
      age: 7,
      parentName: 'John Smith',
      parentEmail: 'john@example.com',
      parentPhone: '+61-987-654-321',
    }))
  })

  it('should validate student form data', async () => {
    const user = userEvent.setup()
    const itemWithoutStudents = {
      ...mockCartItem,
      students: [],
    }
    
    render(<CartItem item={itemWithoutStudents} />)
    
    const addStudentButton = screen.getByText('Add Student (2 needed)')
    await user.click(addStudentButton)
    
    // Submit form without required fields
    const submitButton = screen.getByText('Add Student')
    await user.click(submitButton)
    
    expect(screen.getByText('First name is required')).toBeInTheDocument()
    expect(screen.getByText('Last name is required')).toBeInTheDocument()
    expect(screen.getByText('Parent name is required')).toBeInTheDocument()
    expect(screen.getByText('Parent email is required')).toBeInTheDocument()
    expect(screen.getByText('Parent phone is required')).toBeInTheDocument()
  })

  it('should validate age requirements', async () => {
    const user = userEvent.setup()
    const itemWithoutStudents = {
      ...mockCartItem,
      students: [],
    }
    
    render(<CartItem item={itemWithoutStudents} />)
    
    const addStudentButton = screen.getByText('Add Student (2 needed)')
    await user.click(addStudentButton)
    
    // Enter age outside valid range (5-12)
    await user.type(screen.getByLabelText(/age/i), '3')
    
    const submitButton = screen.getByText('Add Student')
    await user.click(submitButton)
    
    expect(screen.getByText('Student age must be between 5 and 12')).toBeInTheDocument()
  })

  it('should allow editing existing student', async () => {
    const user = userEvent.setup()
    render(<CartItem item={mockCartItem} />)
    
    const editButton = screen.getByRole('button', { name: /edit.*john doe/i })
    await user.click(editButton)
    
    const firstNameInput = screen.getByDisplayValue('John')
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Johnny')
    
    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)
    
    expect(mockCartStore.updateStudent).toHaveBeenCalledWith('item-1', 'student-1', expect.objectContaining({
      firstName: 'Johnny',
    }))
  })

  it('should allow removing student', async () => {
    const user = userEvent.setup()
    render(<CartItem item={mockCartItem} />)
    
    const removeStudentButton = screen.getByRole('button', { name: /remove.*john doe/i })
    await user.click(removeStudentButton)
    
    expect(mockCartStore.removeStudent).toHaveBeenCalledWith('item-1', 'student-1')
  })

  it('should show add-ons if present', () => {
    const itemWithAddOns = {
      ...mockCartItem,
      selectedAddOns: [
        {
          addOn: {
            id: 'addon-1',
            name: 'Lunch',
            description: 'Daily lunch',
            price: 15,
            category: 'food',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          quantity: 2,
        },
      ],
    }
    
    render(<CartItem item={itemWithAddOns} />)
    
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('x2')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
  })

  it('should handle item notes', () => {
    const itemWithNotes = {
      ...mockCartItem,
      notes: 'Special dietary requirements',
    }
    
    render(<CartItem item={itemWithNotes} />)
    
    expect(screen.getByText('Special dietary requirements')).toBeInTheDocument()
  })

  it('should show fallback image when product image fails', () => {
    const itemWithBrokenImage = {
      ...mockCartItem,
      product: {
        ...mockProduct,
        images: [],
      },
    }
    
    render(<CartItem item={itemWithBrokenImage} />)
    
    const image = screen.getByRole('img', { name: /test camp/i })
    expect(image).toHaveAttribute('src', '/images/placeholder.jpg')
  })

  it('should prevent quantity below 1', async () => {
    const user = userEvent.setup()
    render(<CartItem item={mockCartItem} />)
    
    const quantityInput = screen.getByDisplayValue('2')
    await user.clear(quantityInput)
    await user.type(quantityInput, '-1')
    
    // Should default to 1 or call remove
    expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('item-1', 1)
  })

  it('should limit quantity to max capacity', async () => {
    const user = userEvent.setup()
    render(<CartItem item={mockCartItem} />)
    
    const quantityInput = screen.getByDisplayValue('2')
    await user.clear(quantityInput)
    await user.type(quantityInput, '15') // Exceeds maxCapacity of 10
    
    expect(screen.getByText('Maximum capacity is 10')).toBeInTheDocument()
  })

  it('should show collapse/expand for long content', async () => {
    const user = userEvent.setup()
    const itemWithLongDescription = {
      ...mockCartItem,
      product: {
        ...mockProduct,
        description: 'A very long description '.repeat(20),
      },
    }
    
    render(<CartItem item={itemWithLongDescription} />)
    
    const expandButton = screen.getByText('Show more')
    await user.click(expandButton)
    
    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('should display emergency contact info for students', () => {
    const studentWithEmergencyContact = {
      ...mockStudent,
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+61-000-000-000',
        relationship: 'Grandparent',
      },
    }
    
    const itemWithEmergencyContact = {
      ...mockCartItem,
      students: [studentWithEmergencyContact],
    }
    
    render(<CartItem item={itemWithEmergencyContact} />)
    
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument()
    expect(screen.getByText('Grandparent')).toBeInTheDocument()
  })

  it('should show medical notes if present', () => {
    const studentWithMedical = {
      ...mockStudent,
      allergies: ['Nuts', 'Dairy'],
      medicalNotes: 'Requires inhaler',
    }
    
    const itemWithMedicalInfo = {
      ...mockCartItem,
      students: [studentWithMedical],
    }
    
    render(<CartItem item={itemWithMedicalInfo} />)
    
    expect(screen.getByText('Allergies: Nuts, Dairy')).toBeInTheDocument()
    expect(screen.getByText('Medical Notes: Requires inhaler')).toBeInTheDocument()
  })
})

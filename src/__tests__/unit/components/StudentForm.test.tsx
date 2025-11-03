import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentForm from '@/components/cart/StudentForm'
import { StudentDetails } from '@/types/enhancedCart'
import { Product } from '@/types/products'

const mockProduct: Product = {
  id: 'test-product',
  name: 'Test Camp',
  description: 'Test description',
  price: 100,
  category: 'camps',
  ageRange: '8-14',
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
  age: 10,
  parentName: 'Jane Doe',
  parentEmail: 'jane@example.com',
  parentPhone: '+61-123-456-789',
}

describe('StudentForm Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render empty form for new student', () => {
    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByLabelText(/first name/i)).toHaveValue('')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('')
    expect(screen.getByLabelText(/age/i)).toHaveValue('')
    expect(screen.getByLabelText(/parent name/i)).toHaveValue('')
    expect(screen.getByLabelText(/parent email/i)).toHaveValue('')
    expect(screen.getByLabelText(/parent phone/i)).toHaveValue('')
  })

  it('should render form with existing student data', () => {
    render(
      <StudentForm
        product={mockProduct}
        student={mockStudent}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+61-123-456-789')).toBeInTheDocument()
  })

  it('should show correct button text for new vs existing student', () => {
    const { rerender } = render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByRole('button', { name: 'Add Student' })).toBeInTheDocument()

    rerender(
      <StudentForm
        product={mockProduct}
        student={mockStudent}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('should validate required fields on submit', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Add Student' })
    await user.click(submitButton)

    expect(screen.getByText('First name is required')).toBeInTheDocument()
    expect(screen.getByText('Last name is required')).toBeInTheDocument()
    expect(screen.getByText('Parent name is required')).toBeInTheDocument()
    expect(screen.getByText('Parent email is required')).toBeInTheDocument()
    expect(screen.getByText('Parent phone is required')).toBeInTheDocument()
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate age requirements', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Fill required fields but invalid age
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/age/i), '6') // Below minimum age of 8
    await user.type(screen.getByLabelText(/parent name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/parent email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/parent phone/i), '+61-123-456-789')

    const submitButton = screen.getByRole('button', { name: 'Add Student' })
    await user.click(submitButton)

    expect(screen.getByText('Student age must be between 8 and 14')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/age/i), '10')
    await user.type(screen.getByLabelText(/parent name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/parent email/i), 'invalid-email') // Invalid email
    await user.type(screen.getByLabelText(/parent phone/i), '+61-123-456-789')

    const submitButton = screen.getByRole('button', { name: 'Add Student' })
    await user.click(submitButton)

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate phone format', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/age/i), '10')
    await user.type(screen.getByLabelText(/parent name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/parent email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/parent phone/i), '123') // Invalid phone

    const submitButton = screen.getByRole('button', { name: 'Add Student' })
    await user.click(submitButton)

    expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should submit valid form data', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/age/i), '10')
    await user.type(screen.getByLabelText(/parent name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/parent email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/parent phone/i), '+61-123-456-789')

    const submitButton = screen.getByRole('button', { name: 'Add Student' })
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        age: 10,
        parentName: 'Jane Doe',
        parentEmail: 'jane@example.com',
        parentPhone: '+61-123-456-789',
      })
    )
  })

  it('should handle optional fields correctly', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Fill required fields
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/age/i), '10')
    await user.type(screen.getByLabelText(/parent name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/parent email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/parent phone/i), '+61-123-456-789')

    // Fill optional fields
    await user.type(screen.getByLabelText(/date of birth/i), '2014-01-15')
    await user.type(screen.getByLabelText(/allergies/i), 'Nuts, Dairy')
    await user.type(screen.getByLabelText(/medical notes/i), 'Has inhaler')

    // Emergency contact fields
    await user.type(screen.getByLabelText(/emergency contact name/i), 'Bob Smith')
    await user.type(screen.getByLabelText(/emergency contact phone/i), '+61-987-654-321')
    await user.type(screen.getByLabelText(/relationship/i), 'Uncle')

    const submitButton = screen.getByRole('button', { name: 'Add Student' })
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        age: 10,
        dateOfBirth: new Date('2014-01-15'),
        allergies: ['Nuts', 'Dairy'],
        medicalNotes: 'Has inhaler',
        emergencyContact: {
          name: 'Bob Smith',
          phone: '+61-987-654-321',
          relationship: 'Uncle',
        },
      })
    )
  })

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledOnce()
  })

  it('should clear form when reset', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        showReset={true}
      />
    )

    // Fill some fields
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/age/i), '10')

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()

    // Click reset
    const resetButton = screen.getByRole('button', { name: 'Reset' })
    await user.click(resetButton)

    expect(screen.getByLabelText(/first name/i)).toHaveValue('')
    expect(screen.getByLabelText(/age/i)).toHaveValue('')
  })

  it('should handle loading state', () => {
    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Adding...' })
    expect(submitButton).toBeDisabled()
  })

  it('should auto-calculate age from date of birth', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Enter date of birth for 10-year-old
    const tenYearsAgo = new Date()
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
    const dateString = tenYearsAgo.toISOString().split('T')[0]

    await user.type(screen.getByLabelText(/date of birth/i), dateString)

    // Age should be auto-calculated
    await waitFor(() => {
      expect(screen.getByLabelText(/age/i)).toHaveValue('10')
    })
  })

  it('should validate emergency contact completeness', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Fill required fields
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/age/i), '10')
    await user.type(screen.getByLabelText(/parent name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/parent email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/parent phone/i), '+61-123-456-789')

    // Partially fill emergency contact (should require all or none)
    await user.type(screen.getByLabelText(/emergency contact name/i), 'Bob Smith')
    // Missing phone and relationship

    const submitButton = screen.getByRole('button', { name: 'Add Student' })
    await user.click(submitButton)

    expect(screen.getByText('Emergency contact phone is required when contact name is provided')).toBeInTheDocument()
    expect(screen.getByText('Emergency contact relationship is required when contact name is provided')).toBeInTheDocument()
  })

  it('should format phone number automatically', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const phoneInput = screen.getByLabelText(/parent phone/i)
    await user.type(phoneInput, '0412345678')

    // Should format to +61-412-345-678
    expect(phoneInput).toHaveValue('+61-412-345-678')
  })

  it('should handle allergies as comma-separated list', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        student={{
          ...mockStudent,
          allergies: ['Nuts', 'Dairy', 'Gluten'],
        }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const allergiesInput = screen.getByLabelText(/allergies/i)
    expect(allergiesInput).toHaveValue('Nuts, Dairy, Gluten')

    // Change allergies
    await user.clear(allergiesInput)
    await user.type(allergiesInput, 'Shellfish, Eggs')

    // Fill other required fields and submit
    const submitButton = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        allergies: ['Shellfish', 'Eggs'],
      })
    )
  })

  it('should be accessible with proper labels and ARIA attributes', () => {
    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // All form fields should have proper labels
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/parent name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/parent email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/parent phone/i)).toBeInTheDocument()

    // Required fields should be marked
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute('required')
    expect(screen.getByLabelText(/last name/i)).toHaveAttribute('required')
  })

  it('should show field-specific error messages', async () => {
    const user = userEvent.setup()

    render(
      <StudentForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Submit empty form
    const submitButton = screen.getByRole('button', { name: 'Add Student' })
    await user.click(submitButton)

    // Each required field should show its specific error
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)

    expect(firstNameInput).toHaveAttribute('aria-describedby', expect.stringContaining('error'))
    expect(lastNameInput).toHaveAttribute('aria-describedby', expect.stringContaining('error'))
  })
})

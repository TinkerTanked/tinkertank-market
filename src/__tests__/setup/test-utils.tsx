import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock providers if needed
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>
}

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options })

// Test data factories
export const createMockProduct = (overrides = {}) => ({
  id: 'mock-product-id',
  name: 'Mock Product',
  description: 'Mock product description',
  price: 100,
  category: 'camps' as const,
  ageRange: '5-12',
  maxCapacity: 20,
  duration: '1 day',
  images: ['https://example.com/image.jpg'],
  features: ['Feature 1', 'Feature 2'],
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockStudent = (overrides = {}) => ({
  id: 'mock-student-id',
  firstName: 'John',
  lastName: 'Doe',
  age: 10,
  parentName: 'Jane Doe',
  parentEmail: 'jane@example.com',
  parentPhone: '+61-123-456-789',
  ...overrides,
})

export const createMockCartItem = (overrides = {}) => ({
  id: 'mock-item-id',
  product: createMockProduct(),
  quantity: 1,
  students: [],
  pricePerItem: 100,
  totalPrice: 100,
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockAddOn = (overrides = {}) => ({
  id: 'mock-addon-id',
  name: 'Mock Add-on',
  description: 'Mock add-on description',
  price: 15,
  category: 'food',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

// Mock cart store
export const createMockCartStore = (overrides = {}) => ({
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
  ...overrides,
})

// Utility functions for tests
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const simulateUser = async (actions: (() => Promise<void>)[]) => {
  for (const action of actions) {
    await action()
    await waitForNextTick()
  }
}

// Mock implementations
export const mockScrollIntoView = () => {
  Element.prototype.scrollIntoView = vi.fn()
}

export const mockGetBoundingClientRect = (rect = {}) => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
    ...rect,
  }))
}

// Test assertions helpers
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectToHaveValue = (element: HTMLElement | null, value: string) => {
  expect(element).toHaveValue(value)
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }

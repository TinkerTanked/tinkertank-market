import { vi } from 'vitest'

// Mock Stripe
export const mockStripe = {
  confirmPayment: vi.fn(),
  elements: vi.fn(() => ({
    create: vi.fn(),
    getElement: vi.fn(),
  })),
  createElement: vi.fn(),
  createToken: vi.fn(),
  createSource: vi.fn(),
  confirmCardPayment: vi.fn(),
}

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// Mock fetch
export const mockFetch = vi.fn()

// Mock date functions for consistent testing
export const mockDate = (date: string) => {
  const mockNow = new Date(date)
  vi.setSystemTime(mockNow)
}

// Mock window.matchMedia
export const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }))
}

// Mock ResizeObserver
export const mockResizeObserver = () => {
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

// Setup all mocks
export const setupMocks = () => {
  // Storage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
  })

  // Fetch
  global.fetch = mockFetch

  // Media queries
  mockMatchMedia()

  // Observers
  mockIntersectionObserver()
  mockResizeObserver()

  // Console methods for testing
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  }
}

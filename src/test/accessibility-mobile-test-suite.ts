/**
 * Accessibility and Mobile Test Suite Configuration
 * 
 * This file provides utilities and configuration for running comprehensive
 * accessibility and mobile usability tests across the TinkerTank Market application.
 */

import { beforeAll, afterAll, describe, expect } from 'vitest'
import { cleanup } from '@testing-library/react'

// Test suite configuration
export const TEST_CONFIG = {
  timeouts: {
    default: 5000,
    network: 10000,
    animation: 2000,
  },
  viewports: {
    mobile: { width: 375, height: 667, deviceScaleFactor: 2 },
    tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
    desktop: { width: 1280, height: 800, deviceScaleFactor: 1 },
  },
  devices: {
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    android: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/118.0.0.0',
    tablet: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  }
}

// Global test setup
beforeAll(() => {
  // Mock IntersectionObserver for lazy loading tests
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }
    
    callback: IntersectionObserverCallback
    observe = jest.fn()
    unobserve = jest.fn()
    disconnect = jest.fn()
  }

  // Mock ResizeObserver for responsive tests
  global.ResizeObserver = class ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    
    callback: ResizeObserverCallback
    observe = jest.fn()
    unobserve = jest.fn()
    disconnect = jest.fn()
  }

  // Mock touch events
  if (!('TouchEvent' in window)) {
    window.TouchEvent = class TouchEvent extends UIEvent {
      constructor(type: string, eventInitDict?: TouchEventInit) {
        super(type, eventInitDict)
        this.touches = eventInitDict?.touches || []
        this.targetTouches = eventInitDict?.targetTouches || []
        this.changedTouches = eventInitDict?.changedTouches || []
      }
      
      touches: TouchList
      targetTouches: TouchList
      changedTouches: TouchList
    } as any
  }

  // Mock service worker for PWA tests
  if (!('serviceWorker' in navigator)) {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue({}),
        ready: Promise.resolve({}),
        controller: null,
      }
    })
  }
})

afterAll(() => {
  cleanup()
})

// Utility functions for testing
export const testUtils = {
  /**
   * Set viewport size and trigger resize event
   */
  setViewport(size: keyof typeof TEST_CONFIG.viewports) {
    const viewport = TEST_CONFIG.viewports[size]
    Object.defineProperty(window, 'innerWidth', { 
      writable: true, 
      configurable: true, 
      value: viewport.width 
    })
    Object.defineProperty(window, 'innerHeight', { 
      writable: true, 
      configurable: true, 
      value: viewport.height 
    })
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: viewport.deviceScaleFactor
    })
    window.dispatchEvent(new Event('resize'))
  },

  /**
   * Mock user agent for device-specific testing
   */
  setUserAgent(device: keyof typeof TEST_CONFIG.devices) {
    Object.defineProperty(navigator, 'userAgent', {
      value: TEST_CONFIG.devices[device],
      writable: true
    })
  },

  /**
   * Mock touch capability
   */
  setTouchSupport(hasTouch: boolean) {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: hasTouch ? 5 : 0,
      writable: true
    })
  },

  /**
   * Mock network conditions
   */
  setNetworkCondition(condition: 'online' | 'offline' | 'slow') {
    Object.defineProperty(navigator, 'onLine', { 
      value: condition !== 'offline', 
      writable: true 
    })
    
    if (condition === 'slow') {
      // Mock slow network responses
      global.fetch = jest.fn().mockImplementation((url) => 
        new Promise(resolve => 
          setTimeout(() => resolve(new Response()), 2000)
        )
      )
    }
  },

  /**
   * Mock reduced motion preference
   */
  setReducedMotion(enabled: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: enabled && query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    })
  },

  /**
   * Create touch event helper
   */
  createTouchEvent(type: string, touches: Array<{ clientX: number; clientY: number }>) {
    return new TouchEvent(type, {
      touches: touches.map((touch, index) => ({
        identifier: index,
        target: document.body,
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.clientX,
        pageY: touch.clientY,
        screenX: touch.clientX,
        screenY: touch.clientY,
      })) as any,
      bubbles: true,
      cancelable: true,
    })
  },

  /**
   * Wait for animations to complete
   */
  async waitForAnimations() {
    return new Promise(resolve => 
      setTimeout(resolve, TEST_CONFIG.timeouts.animation)
    )
  }
}

// Test categories and their descriptions
export const TEST_CATEGORIES = {
  accessibility: {
    screenReader: 'Tests for screen reader compatibility and ARIA support',
    keyboardNav: 'Tests for keyboard navigation and focus management', 
    colorContrast: 'Tests for WCAG compliance and visual accessibility',
  },
  mobile: {
    touchInteraction: 'Tests for touch gestures and mobile interactions',
    responsiveDesign: 'Tests for responsive layouts and mobile UX',
    crossDevice: 'Tests for device compatibility and PWA features',
  }
}

// Custom matchers for accessibility testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R
      toHaveMinimumTouchTarget(): R
      toSupportKeyboardNavigation(): R
      toMeetContrastRequirements(): R
    }
  }
}

export const customMatchers = {
  toBeAccessible(received: HTMLElement) {
    const hasAriaLabel = received.hasAttribute('aria-label') || received.hasAttribute('aria-labelledby')
    const hasRole = received.hasAttribute('role')
    const isInteractive = ['button', 'link', 'input', 'select', 'textarea'].includes(received.tagName.toLowerCase())
    
    if (isInteractive && !hasAriaLabel && !hasRole) {
      return {
        message: () => `Expected element to have accessibility attributes`,
        pass: false,
      }
    }
    
    return {
      message: () => `Element meets accessibility requirements`,
      pass: true,
    }
  },

  toHaveMinimumTouchTarget(received: HTMLElement) {
    const rect = received.getBoundingClientRect()
    const minSize = 44 // 44px minimum touch target
    
    if (rect.width < minSize || rect.height < minSize) {
      return {
        message: () => `Expected touch target to be at least ${minSize}px, got ${rect.width}x${rect.height}px`,
        pass: false,
      }
    }
    
    return {
      message: () => `Touch target meets minimum size requirements`,
      pass: true,
    }
  },

  toSupportKeyboardNavigation(received: HTMLElement) {
    const tabIndex = received.getAttribute('tabindex')
    const isInteractive = ['button', 'link', 'input', 'select', 'textarea'].includes(received.tagName.toLowerCase())
    const hasKeydownHandler = received.getAttribute('onkeydown') !== null
    
    if (isInteractive && tabIndex === '-1' && !hasKeydownHandler) {
      return {
        message: () => `Expected interactive element to support keyboard navigation`,
        pass: false,
      }
    }
    
    return {
      message: () => `Element supports keyboard navigation`,
      pass: true,
    }
  },

  toMeetContrastRequirements(received: HTMLElement) {
    const styles = window.getComputedStyle(received)
    const color = styles.color
    const backgroundColor = styles.backgroundColor
    
    // Simplified contrast check - in real implementation would use color contrast algorithms
    if (color === backgroundColor) {
      return {
        message: () => `Expected element to have sufficient color contrast`,
        pass: false,
      }
    }
    
    return {
      message: () => `Element meets contrast requirements`,
      pass: true,
    }
  }
}

// Test runner configuration
export const runTestSuite = async (category?: keyof typeof TEST_CATEGORIES) => {
  const testFiles = [
    'accessibility/screen-reader.test.tsx',
    'accessibility/keyboard-navigation.test.tsx',
    'accessibility/color-contrast.test.tsx',
    'mobile/touch-interaction.test.tsx',
    'mobile/responsive-design.test.tsx',
    'mobile/cross-device.test.tsx',
  ]

  if (category === 'accessibility') {
    return testFiles.filter(file => file.startsWith('accessibility/'))
  } else if (category === 'mobile') {
    return testFiles.filter(file => file.startsWith('mobile/'))
  }

  return testFiles
}

export default {
  TEST_CONFIG,
  testUtils,
  TEST_CATEGORIES,
  customMatchers,
  runTestSuite,
}

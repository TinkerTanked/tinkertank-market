import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { performance } from 'perf_hooks'
import React from 'react'

// Mock components for testing
const CalendarWidget = ({ events = [] }: { events?: any[] }) => {
  return React.createElement('div', { 'data-testid': 'calendar' },
    events.map((event, i) => React.createElement('div', { key: i }, event.title))
  )
}

const ProductCatalog = ({ products = [] }: { products?: any[] }) => {
  return React.createElement('div', { 'data-testid': 'catalog' },
    products.map((product, i) => React.createElement('div', { key: i }, product.name))
  )
}

const Cart = ({ items = [] }: { items?: any[] }) => {
  return React.createElement('div', { 'data-testid': 'cart' },
    items.map((item, i) => React.createElement('div', { key: i }, `${item.name} - ${item.quantity}`))
  )
}

describe('Component Performance Tests', () => {
  beforeEach(() => {
    performance.clearMarks()
    performance.clearMeasures()
  })

  afterEach(() => {
    cleanup()
  })

  it('should render Calendar with 100 events under 100ms', () => {
    const events = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      title: `Event ${i}`,
      date: new Date(2024, 11, i + 1),
      type: 'camp'
    }))

    performance.mark('calendar-start')
    render(React.createElement(CalendarWidget, { events }))
    performance.mark('calendar-end')
    
    performance.measure('calendar-render', 'calendar-start', 'calendar-end')
    const measure = performance.getEntriesByName('calendar-render')[0]
    
    expect(measure.duration).toBeLessThan(100)
  })

  it('should render Product Catalog with 50 items under 50ms', () => {
    const products = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `Product ${i}`,
      price: 100 + i,
      type: 'camp'
    }))

    performance.mark('catalog-start')
    render(React.createElement(ProductCatalog, { products }))
    performance.mark('catalog-end')
    
    performance.measure('catalog-render', 'catalog-start', 'catalog-end')
    const measure = performance.getEntriesByName('catalog-render')[0]
    
    expect(measure.duration).toBeLessThan(50)
  })

  it('should update Cart with 20 items under 30ms', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      quantity: i + 1,
      price: 25
    }))

    performance.mark('cart-start')
    render(React.createElement(Cart, { items }))
    performance.mark('cart-end')
    
    performance.measure('cart-render', 'cart-start', 'cart-end')
    const measure = performance.getEntriesByName('cart-render')[0]
    
    expect(measure.duration).toBeLessThan(30)
  })

  it('should handle search filtering under 20ms', () => {
    const products = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      name: `Product ${i}`,
      tags: [`tag${i % 10}`, 'general']
    }))

    performance.mark('search-start')
    
    // Simulate search filtering
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes('product 1') ||
      p.tags.some(tag => tag.includes('tag1'))
    )
    
    performance.mark('search-end')
    performance.measure('search-filter', 'search-start', 'search-end')
    
    const measure = performance.getEntriesByName('search-filter')[0]
    expect(measure.duration).toBeLessThan(20)
    expect(filtered.length).toBeGreaterThan(0)
  })
})

// Memory usage monitoring
describe('Memory Performance Tests', () => {
  it('should not leak memory during cart operations', () => {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc()
    }
    
    const initialMemory = process.memoryUsage()
    
    // Simulate multiple cart operations
    for (let i = 0; i < 1000; i++) {
    const items = Array.from({ length: 10 }, (_, j) => ({ id: j, quantity: 1 }))
    render(React.createElement(Cart, { items }))
    cleanup()
    }
    
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc()
    }
    
    const finalMemory = process.memoryUsage()
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
    
    // Memory increase should be minimal (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
  })

  it('should handle localStorage efficiently', () => {
    const testData = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      data: `test-data-${i}`.repeat(100)
    }))

    performance.mark('storage-start')
    
    // Test localStorage performance
    testData.forEach(item => {
      localStorage.setItem(`test-${item.id}`, JSON.stringify(item))
    })
    
    performance.mark('storage-end')
    performance.measure('storage-write', 'storage-start', 'storage-end')
    
    const measure = performance.getEntriesByName('storage-write')[0]
    expect(measure.duration).toBeLessThan(100)
    
    // Cleanup
    testData.forEach(item => {
      localStorage.removeItem(`test-${item.id}`)
    })
  })
})

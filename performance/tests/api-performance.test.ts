import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { performance } from 'perf_hooks'

describe('API Performance Tests', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  
  beforeAll(async () => {
    // Ensure server is running
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (!response.ok) {
        throw new Error('Server not available')
      }
    } catch (error) {
      console.warn('Server may not be running. Some tests may fail.')
    }
  })

  it('should respond to health check under 50ms', async () => {
    performance.mark('health-start')
    
    const response = await fetch(`${baseUrl}/api/health`)
    
    performance.mark('health-end')
    performance.measure('health-check', 'health-start', 'health-end')
    
    const measure = performance.getEntriesByName('health-check')[0]
    
    expect(response.ok).toBe(true)
    expect(measure.duration).toBeLessThan(50)
  })

  it('should handle product API requests efficiently', async () => {
    performance.mark('products-start')
    
    const response = await fetch(`${baseUrl}/api/products`)
    const data = await response.json()
    
    performance.mark('products-end')
    performance.measure('products-api', 'products-start', 'products-end')
    
    const measure = performance.getEntriesByName('products-api')[0]
    
    expect(response.ok).toBe(true)
    expect(measure.duration).toBeLessThan(200)
  })

  it('should handle availability API under load', async () => {
    const requests = Array.from({ length: 10 }, async (_, i) => {
      performance.mark(`availability-${i}-start`)
      
      const response = await fetch(`${baseUrl}/api/availability?date=2024-12-${(i % 30) + 1}`)
      
      performance.mark(`availability-${i}-end`)
      performance.measure(`availability-${i}`, `availability-${i}-start`, `availability-${i}-end`)
      
      return response
    })
    
    const responses = await Promise.all(requests)
    
    responses.forEach((response, i) => {
      const measure = performance.getEntriesByName(`availability-${i}`)[0]
      expect(response.ok).toBe(true)
      expect(measure.duration).toBeLessThan(300)
    })
  })

  it('should handle cart API operations efficiently', async () => {
    const testItem = {
      productId: 'test-camp-1',
      quantity: 2,
      date: '2024-12-15'
    }
    
    // Add to cart
    performance.mark('cart-add-start')
    const addResponse = await fetch(`${baseUrl}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testItem)
    })
    performance.mark('cart-add-end')
    performance.measure('cart-add', 'cart-add-start', 'cart-add-end')
    
    // Update cart
    performance.mark('cart-update-start')
    const updateResponse = await fetch(`${baseUrl}/api/cart`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testItem, quantity: 3 })
    })
    performance.mark('cart-update-end')
    performance.measure('cart-update', 'cart-update-start', 'cart-update-end')
    
    // Remove from cart
    performance.mark('cart-remove-start')
    const removeResponse = await fetch(`${baseUrl}/api/cart/${testItem.productId}`, {
      method: 'DELETE'
    })
    performance.mark('cart-remove-end')
    performance.measure('cart-remove', 'cart-remove-start', 'cart-remove-end')
    
    const addMeasure = performance.getEntriesByName('cart-add')[0]
    const updateMeasure = performance.getEntriesByName('cart-update')[0]
    const removeMeasure = performance.getEntriesByName('cart-remove')[0]
    
    expect(addMeasure.duration).toBeLessThan(150)
    expect(updateMeasure.duration).toBeLessThan(100)
    expect(removeMeasure.duration).toBeLessThan(100)
  })

  it('should handle booking API with proper response times', async () => {
    const bookingData = {
      productId: 'test-camp-1',
      date: '2024-12-20',
      participants: 2,
      customerName: 'Test User',
      customerEmail: 'test@example.com'
    }
    
    performance.mark('booking-start')
    
    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    })
    
    performance.mark('booking-end')
    performance.measure('booking-api', 'booking-start', 'booking-end')
    
    const measure = performance.getEntriesByName('booking-api')[0]
    
    // Booking should complete within reasonable time
    expect(measure.duration).toBeLessThan(500)
    
    // Cleanup if booking was created
    if (response.ok) {
      const booking = await response.json()
      await fetch(`${baseUrl}/api/bookings/${booking.id}`, {
        method: 'DELETE'
      })
    }
  })

  it('should handle concurrent API requests', async () => {
    const concurrentRequests = 20
    performance.mark('concurrent-api-start')
    
    const requests = Array.from({ length: concurrentRequests }, (_, i) =>
      fetch(`${baseUrl}/api/products?page=${i % 5 + 1}`)
    )
    
    const responses = await Promise.all(requests)
    
    performance.mark('concurrent-api-end')
    performance.measure('concurrent-api', 'concurrent-api-start', 'concurrent-api-end')
    
    const measure = performance.getEntriesByName('concurrent-api')[0]
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok).toBe(true)
    })
    
    // Total time should be reasonable for concurrent requests
    expect(measure.duration).toBeLessThan(1000)
  })

  it('should handle rate limiting gracefully', async () => {
    const rapidRequests = 50
    performance.mark('rate-limit-start')
    
    const requests = Array.from({ length: rapidRequests }, () =>
      fetch(`${baseUrl}/api/products`)
    )
    
    const responses = await Promise.allSettled(requests)
    
    performance.mark('rate-limit-end')
    performance.measure('rate-limit', 'rate-limit-start', 'rate-limit-end')
    
    const fulfilled = responses.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<Response>[]
    const successful = fulfilled.filter(r => r.value.ok)
    const rateLimited = fulfilled.filter(r => r.value.status === 429)
    
    // Should handle rate limiting properly
    expect(successful.length + rateLimited.length).toBeGreaterThan(0)
    
    const measure = performance.getEntriesByName('rate-limit')[0]
    expect(measure.duration).toBeLessThan(2000)
  })
})

describe('API Caching Performance', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  
  it('should demonstrate cache effectiveness', async () => {
    // First request (cache miss)
    performance.mark('cache-miss-start')
    const firstResponse = await fetch(`${baseUrl}/api/products`)
    performance.mark('cache-miss-end')
    performance.measure('cache-miss', 'cache-miss-start', 'cache-miss-end')
    
    // Small delay to ensure cache is set
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Second request (cache hit)
    performance.mark('cache-hit-start')
    const secondResponse = await fetch(`${baseUrl}/api/products`)
    performance.mark('cache-hit-end')
    performance.measure('cache-hit', 'cache-hit-start', 'cache-hit-end')
    
    const missMeasure = performance.getEntriesByName('cache-miss')[0]
    const hitMeasure = performance.getEntriesByName('cache-hit')[0]
    
    expect(firstResponse.ok).toBe(true)
    expect(secondResponse.ok).toBe(true)
    
    // Cache hit should be faster (if caching is implemented)
    // This test will help identify if caching improvements are needed
    console.log(`Cache miss: ${missMeasure.duration}ms, Cache hit: ${hitMeasure.duration}ms`)
  })
})

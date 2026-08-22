import { afterEach, describe, expect, it, vi } from 'vitest'
import { cartItemsToAnalytics, trackEvent } from '@/lib/analytics'

describe('analytics', () => {
  afterEach(() => {
    delete window.gtag
    delete window.fbq
  })

  it('sends events through gtag when analytics is configured', () => {
    window.gtag = vi.fn()

    trackEvent('booking_start', { program: 'camp' })

    expect(window.gtag).toHaveBeenCalledWith('event', 'booking_start', { program: 'camp' })
  })

  it('does nothing before gtag has loaded', () => {
    expect(() => trackEvent('booking_start')).not.toThrow()
  })

  it('maps ecommerce events to Meta standard events', () => {
    window.fbq = vi.fn()

    trackEvent('add_to_cart', {
      currency: 'AUD',
      value: 119.99,
      items: [{ item_id: 'day-camp', item_name: 'Day Camp', item_category: 'camps', quantity: 1 }]
    })

    expect(window.fbq).toHaveBeenCalledWith('track', 'AddToCart', expect.objectContaining({
      currency: 'AUD',
      value: 119.99,
      content_ids: ['day-camp'],
      content_type: 'product',
      contents: [{ id: 'day-camp', quantity: 1 }]
    }))
  })

  it('adds a Meta event ID to browser purchases for Conversions API deduplication', () => {
    window.fbq = vi.fn()

    trackEvent('purchase', { currency: 'AUD', value: 119.99, items: [] }, { metaEventId: 'order_123' })

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({ currency: 'AUD', value: 119.99 }),
      { eventID: 'order_123' }
    )
  })

  it('maps cart data to GA4 ecommerce items without personal data', () => {
    const items = cartItemsToAnalytics([{
      product: {
        id: 'day-camp',
        name: 'Day Camp',
        category: 'camps',
        location: 'TinkerTank Neutral Bay'
      },
      selectedDates: [new Date('2026-09-29'), new Date('2026-09-30')],
      pricePerItem: 239.98,
      quantity: 1
    } as any])

    expect(items).toEqual([{
      item_id: 'day-camp',
      item_name: 'Day Camp',
      item_category: 'camps',
      item_variant: '2 days',
      location_id: 'TinkerTank Neutral Bay',
      price: 239.98,
      quantity: 1
    }])
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cartItemsToAnalytics, trackEvent } from '@/lib/analytics'

describe('analytics', () => {
  afterEach(() => {
    delete window.plausible
    delete window.fbq
  })

  it('sends privacy-friendly funnel events through Plausible', () => {
    window.plausible = vi.fn()

    trackEvent('booking_start', { program: 'camp', source: 'camps_hero' })

    expect(window.plausible).toHaveBeenCalledWith('Camp Booking Started', {
      props: { program: 'camp', source: 'camps_hero' },
    })
  })

  it('does nothing before analytics scripts have loaded', () => {
    expect(() => trackEvent('booking_start')).not.toThrow()
  })

  it('keeps detailed booking funnel events first-party only', () => {
    window.plausible = vi.fn()
    window.fbq = vi.fn()

    trackEvent(
      'booking_step_completed',
      {
        product_kind: 'camp',
        step_name: 'children',
        child_count: 2,
      },
      { meta: false }
    )

    expect(window.plausible).toHaveBeenCalledWith('Booking Step Completed', {
      props: { product_kind: 'camp', step_name: 'children', child_count: 2 },
    })
    expect(window.fbq).not.toHaveBeenCalled()
  })

  it('maps ecommerce events to Meta standard events', () => {
    window.fbq = vi.fn()

    trackEvent('add_to_cart', {
      currency: 'AUD',
      value: 119.99,
      items: [{ item_id: 'day-camp', item_name: 'Day Camp', item_category: 'camps', quantity: 1 }],
    })

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'AddToCart',
      expect.objectContaining({
        currency: 'AUD',
        value: 119.99,
        content_ids: ['day-camp'],
        content_type: 'product',
        contents: [{ id: 'day-camp', quantity: 1 }],
      })
    )
  })

  it('adds a Meta event ID to browser purchases for Conversions API deduplication', () => {
    window.fbq = vi.fn()

    trackEvent('purchase', { currency: 'AUD', value: 119.99, items: [] }, { metaEventId: 'order_123' })

    expect(window.fbq).toHaveBeenCalledWith('track', 'Purchase', expect.objectContaining({ currency: 'AUD', value: 119.99 }), {
      eventID: 'order_123',
    })
  })

  it('sends aggregate purchase revenue to Plausible without an order ID', () => {
    window.plausible = vi.fn()

    trackEvent('purchase', {
      transaction_id: 'private-order-id',
      currency: 'AUD',
      value: 239.98,
      items: [{ item_id: 'day-camp', item_name: 'Day Camp', item_category: 'camps', quantity: 2 }],
    })

    expect(window.plausible).toHaveBeenCalledWith('Purchase', {
      props: {
        currency: 'AUD',
        value: 239.98,
        product_ids: 'day-camp',
        product_categories: 'camps',
        item_count: 2,
      },
      revenue: { currency: 'AUD', amount: 239.98 },
    })
    expect(window.plausible).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ transaction_id: expect.anything() }))
  })

  it('maps cart data to analytics items without personal data', () => {
    const items = cartItemsToAnalytics([
      {
        product: {
          id: 'day-camp',
          name: 'Day Camp',
          category: 'camps',
          location: 'TinkerTank Neutral Bay',
        },
        selectedDates: [new Date('2026-09-29'), new Date('2026-09-30')],
        pricePerItem: 239.98,
        quantity: 1,
      } as any,
    ])

    expect(items).toEqual([
      {
        item_id: 'day-camp',
        item_name: 'Day Camp',
        item_category: 'camps',
        item_variant: '2 days',
        location_id: 'TinkerTank Neutral Bay',
        price: 239.98,
        quantity: 1,
      },
    ])
  })
})

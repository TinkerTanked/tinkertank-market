import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendMetaPurchase } from '@/lib/metaConversions'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')

const purchase = {
  orderId: 'order_123',
  value: 239.98,
  currency: 'AUD',
  email: ' Parent@Example.COM ',
  phone: '0400 123 456',
  customerName: 'Taylor Smith',
  items: [{ id: 'day-camp', quantity: 2, price: 119.99 }],
  eventTime: 1787385600,
  eventSourceUrl: 'https://tinkertank.rocks/checkout/success',
  clientIpAddress: '203.0.113.1',
  clientUserAgent: 'Test Browser',
  fbp: 'fb.1.123456789.123456789',
  fbc: 'fb.1.123456789.AbCdEf'
}

describe('sendMetaPurchase', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789'
    process.env.META_CONVERSIONS_API_ACCESS_TOKEN = 'test-access-token'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    delete process.env.META_CONVERSIONS_API_ACCESS_TOKEN
    vi.restoreAllMocks()
  })

  it('sends a hashed Purchase event with matching browser deduplication ID', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ events_received: 1 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ))

    await expect(sendMetaPurchase(purchase)).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, request] = fetchMock.mock.calls[0]
    expect(url).toBe('https://graph.facebook.com/v25.0/123456789/events')

    const payload = JSON.parse(request?.body as string)
    expect(payload.data[0]).toEqual(expect.objectContaining({
      event_name: 'Purchase',
      event_id: 'order_123',
      event_time: 1787385600,
      action_source: 'website',
      event_source_url: 'https://tinkertank.rocks/checkout/success'
    }))
    expect(payload.data[0].user_data).toEqual(expect.objectContaining({
      em: [hash('parent@example.com')],
      ph: [hash('61400123456')],
      fn: [hash('taylor')],
      ln: [hash('smith')],
      client_ip_address: '203.0.113.1',
      client_user_agent: 'Test Browser',
      fbp: purchase.fbp,
      fbc: purchase.fbc
    }))
    expect(payload.data[0].custom_data).toEqual(expect.objectContaining({
      currency: 'AUD',
      value: 239.98,
      order_id: 'order_123',
      content_ids: ['day-camp'],
      contents: [{ id: 'day-camp', quantity: 2, item_price: 119.99 }],
      num_items: 2
    }))
    expect(JSON.stringify(payload)).not.toContain('Parent@Example.COM')
    expect(JSON.stringify(payload)).not.toContain('0400 123 456')
  })

  it('does not send when server-side Meta credentials are absent', async () => {
    delete process.env.META_CONVERSIONS_API_ACCESS_TOKEN
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(sendMetaPurchase(purchase)).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws when Meta rejects the event so the caller can retry delivery', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Invalid event', { status: 400 }))

    await expect(sendMetaPurchase(purchase)).rejects.toThrow('Meta Conversions API rejected Purchase (400)')
  })
})

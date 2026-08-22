import { createHash } from 'node:crypto'

const META_GRAPH_API_VERSION = 'v25.0'

export class MetaConversionsApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MetaConversionsApiError'
  }
}

export interface MetaPurchaseItem {
  id: string
  quantity: number
  price: number
}

export interface MetaPurchaseInput {
  orderId: string
  value: number
  currency: string
  email: string
  phone?: string | null
  customerName?: string | null
  items: MetaPurchaseItem[]
  eventTime: number
  eventSourceUrl: string
  clientIpAddress?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return `61${digits.slice(1)}`
  if (digits.length === 9) return `61${digits}`
  return digits
}

function normalizeName(name: string) {
  return name.normalize('NFKD').toLowerCase().replace(/[^a-z]/g, '')
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''))
}

export async function sendMetaPurchase(input: MetaPurchaseInput): Promise<boolean> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN

  if (!pixelId || !accessToken) return false

  const nameParts = input.customerName?.trim().split(/\s+/).filter(Boolean) ?? []
  const firstName = nameParts.shift()
  const lastName = nameParts.join(' ')
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : ''

  const userData = compact({
    em: [hash(normalizeEmail(input.email))],
    ph: normalizedPhone ? [hash(normalizedPhone)] : undefined,
    fn: firstName ? [hash(normalizeName(firstName))] : undefined,
    ln: lastName ? [hash(normalizeName(lastName))] : undefined,
    client_ip_address: input.clientIpAddress,
    client_user_agent: input.clientUserAgent,
    fbp: input.fbp,
    fbc: input.fbc
  })

  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: input.eventTime,
      event_id: input.orderId,
      event_source_url: input.eventSourceUrl,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        currency: input.currency,
        value: input.value,
        order_id: input.orderId,
        content_ids: input.items.map(item => item.id),
        content_type: 'product',
        contents: input.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          item_price: item.price
        })),
        num_items: input.items.reduce((total, item) => total + item.quantity, 0)
      }
    }],
    access_token: accessToken
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      const errorBody = (await response.text()).slice(0, 500)
      throw new MetaConversionsApiError(`Meta Conversions API rejected Purchase (${response.status}): ${errorBody}`)
    }

    const result = await response.json() as { events_received?: number }
    if (result.events_received !== 1) {
      throw new MetaConversionsApiError(`Meta Conversions API did not accept Purchase for order ${input.orderId}`)
    }
  } catch (error) {
    if (error instanceof MetaConversionsApiError) throw error
    throw new MetaConversionsApiError(`Meta Conversions API request failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  return true
}

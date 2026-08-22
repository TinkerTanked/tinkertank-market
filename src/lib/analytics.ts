import type { EnhancedCartItem } from '@/types/enhancedCart'

export interface AnalyticsItem {
  item_id: string
  item_name: string
  item_category?: string
  item_variant?: string
  location_id?: string
  price?: number
  quantity?: number
}

type EventParameters = Record<string, unknown>
type EventOptions = { metaEventId?: string }
type PlausibleProperties = Record<string, string | number | boolean>

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    plausible?: ((eventName: string, options?: {
      props?: PlausibleProperties
      revenue?: { currency: string; amount: number }
    }) => void) & { q?: unknown[][] }
  }
}

export function trackEvent(name: string, parameters: EventParameters = {}, options: EventOptions = {}) {
  if (typeof window === 'undefined') return

  const plausibleEvent = PLAUSIBLE_EVENTS[name]
  if (plausibleEvent) {
    const value = typeof parameters.value === 'number' ? parameters.value : undefined
    const currency = typeof parameters.currency === 'string' ? parameters.currency : undefined
    window.plausible?.(plausibleEvent, {
      props: toPlausibleProperties(parameters),
      ...(name === 'purchase' && value !== undefined && currency
        ? { revenue: { currency, amount: value } }
        : {})
    })
  }

  const metaEvent = META_STANDARD_EVENTS[name]
  const metaParameters = toMetaParameters(parameters)
  if (metaEvent) {
    if (options.metaEventId) {
      window.fbq?.('track', metaEvent, metaParameters, { eventID: options.metaEventId })
    } else {
      window.fbq?.('track', metaEvent, metaParameters)
    }
  } else {
    window.fbq?.('trackCustom', toMetaCustomEventName(name), metaParameters)
  }
}

const META_STANDARD_EVENTS: Record<string, string> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase'
}

const PLAUSIBLE_EVENTS: Record<string, string> = {
  booking_start: 'Camp Booking Started',
  select_camp_location: 'Camp Location Selected',
  select_camp_dates: 'Camp Dates Selected',
  select_item: 'Camp Type Selected',
  add_to_cart: 'Camp Added to Cart',
  begin_checkout: 'Checkout Started',
  add_payment_info: 'Payment Started',
  purchase: 'Purchase'
}

const PLAUSIBLE_PROPERTY_KEYS = new Set([
  'program',
  'source',
  'location_id',
  'location_name',
  'date_count',
  'item_list_name',
  'payment_type',
  'currency',
  'value'
])

function toPlausibleProperties(parameters: EventParameters): PlausibleProperties {
  const properties: PlausibleProperties = {}

  for (const [key, value] of Object.entries(parameters)) {
    if (PLAUSIBLE_PROPERTY_KEYS.has(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
      properties[key] = value
    }
  }

  const items = Array.isArray(parameters.items) ? parameters.items as AnalyticsItem[] : []
  if (items.length > 0) {
    properties.product_ids = [...new Set(items.map(item => item.item_id))].join(',')
    properties.product_categories = [...new Set(items.map(item => item.item_category).filter(Boolean))].join(',')
    properties.item_count = items.reduce((total, item) => total + (item.quantity ?? 1), 0)
  }

  return properties
}

function toMetaCustomEventName(name: string) {
  return name.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
}

function toMetaParameters(parameters: EventParameters): EventParameters {
  const items = Array.isArray(parameters.items) ? parameters.items as AnalyticsItem[] : []

  return {
    ...parameters,
    content_ids: items.map(item => item.item_id),
    content_name: items.length === 1 ? items[0].item_name : parameters.item_list_name,
    content_category: items.length === 1 ? items[0].item_category : 'camps',
    content_type: 'product',
    contents: items.map(item => ({ id: item.item_id, quantity: item.quantity ?? 1 }))
  }
}

export function cartItemsToAnalytics(items: EnhancedCartItem[]): AnalyticsItem[] {
  return items.map(item => ({
    item_id: item.product.id,
    item_name: item.product.name,
    item_category: item.product.category,
    item_variant: item.selectedDates?.length ? `${item.selectedDates.length} days` : undefined,
    location_id: item.product.location,
    price: item.pricePerItem,
    quantity: item.quantity
  }))
}

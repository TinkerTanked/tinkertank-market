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

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, parameters: EventParameters = {}) {
  if (typeof window === 'undefined') return

  window.gtag?.('event', name, parameters)

  const metaEvent = META_STANDARD_EVENTS[name]
  const metaParameters = toMetaParameters(parameters)
  if (metaEvent) {
    window.fbq?.('track', metaEvent, metaParameters)
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

export function trackCampPurchaseConversion(value: number, transactionId: string) {
  const conversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  const conversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CAMP_CONVERSION_LABEL

  if (!conversionId || !conversionLabel) return

  trackEvent('conversion', {
    send_to: `${conversionId}/${conversionLabel}`,
    value,
    currency: 'AUD',
    transaction_id: transactionId
  })
}

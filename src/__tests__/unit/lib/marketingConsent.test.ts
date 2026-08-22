import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getMarketingConsent,
  MARKETING_CONSENT_COOKIE,
  MARKETING_CONSENT_EVENT,
  setMarketingConsent
} from '@/lib/marketingConsent'

describe('marketing consent', () => {
  afterEach(() => {
    window.localStorage.clear()
    delete window.fbq
    document.cookie = `${MARKETING_CONSENT_COOKIE}=; Max-Age=0; Path=/`
    document.cookie = '_fbp=; Max-Age=0; Path=/'
    document.cookie = '_fbc=; Max-Age=0; Path=/'
  })

  it('persists granted consent for the browser and checkout API', () => {
    const listener = vi.fn()
    window.addEventListener(MARKETING_CONSENT_EVENT, listener)

    setMarketingConsent('granted')

    expect(getMarketingConsent()).toBe('granted')
    expect(document.cookie).toContain(`${MARKETING_CONSENT_COOKIE}=granted`)
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener(MARKETING_CONSENT_EVENT, listener)
  })

  it('removes Meta attribution cookies when consent is declined', () => {
    document.cookie = '_fbp=fb.1.123.456; Path=/'
    document.cookie = '_fbc=fb.1.123.click; Path=/'

    setMarketingConsent('denied')

    expect(getMarketingConsent()).toBe('denied')
    expect(document.cookie).not.toContain('_fbp=')
    expect(document.cookie).not.toContain('_fbc=')
  })
})

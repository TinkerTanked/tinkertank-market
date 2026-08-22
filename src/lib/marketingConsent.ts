export type MarketingConsent = 'granted' | 'denied'

export const MARKETING_CONSENT_COOKIE = 'tinkertank_marketing_consent'
export const MARKETING_CONSENT_EVENT = 'tinkertank:marketing-consent'
export const OPEN_PRIVACY_CHOICES_EVENT = 'tinkertank:open-privacy-choices'

const MARKETING_CONSENT_STORAGE = 'tinkertank_marketing_consent'
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

function getCookieConsent(): MarketingConsent | null {
  if (typeof document === 'undefined') return null

  const value = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith(`${MARKETING_CONSENT_COOKIE}=`))
    ?.split('=')[1]

  return value === 'granted' || value === 'denied' ? value : null
}

export function getMarketingConsent(): MarketingConsent | null {
  if (typeof window === 'undefined') return null

  const stored = window.localStorage.getItem(MARKETING_CONSENT_STORAGE)
  if (stored === 'granted' || stored === 'denied') return stored
  return getCookieConsent()
}

function expireMetaCookies() {
  for (const name of ['_fbp', '_fbc']) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.tinkertank.rocks; SameSite=Lax`
  }
}

export function setMarketingConsent(consent: MarketingConsent) {
  const shouldReload = consent === 'denied' && (getMarketingConsent() === 'granted' || typeof window.fbq === 'function')
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''

  window.localStorage.setItem(MARKETING_CONSENT_STORAGE, consent)
  document.cookie = `${MARKETING_CONSENT_COOKIE}=${consent}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`

  if (consent === 'denied') expireMetaCookies()

  window.dispatchEvent(new CustomEvent<MarketingConsent>(MARKETING_CONSENT_EVENT, { detail: consent }))

  // Meta's script cannot be unloaded safely. Reload after revocation so no more
  // events leave the page during the current session.
  if (shouldReload) window.location.reload()
}

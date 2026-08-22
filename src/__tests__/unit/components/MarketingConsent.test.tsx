import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import MarketingConsentBanner from '@/components/analytics/MarketingConsent'
import { MARKETING_CONSENT_COOKIE, OPEN_PRIVACY_CHOICES_EVENT } from '@/lib/marketingConsent'

describe('MarketingConsentBanner', () => {
  afterEach(() => {
    window.localStorage.clear()
    document.cookie = `${MARKETING_CONSENT_COOKIE}=; Max-Age=0; Path=/`
  })

  it('asks on the first visit and remembers a rejection', async () => {
    render(<MarketingConsentBanner />)

    const reject = await screen.findByRole('button', { name: 'No thanks' })
    fireEvent.click(reject)

    await waitFor(() => expect(screen.queryByRole('button', { name: 'No thanks' })).not.toBeInTheDocument())
    expect(window.localStorage.getItem(MARKETING_CONSENT_COOKIE)).toBe('denied')
  })

  it('lets visitors reopen and change their privacy choice', async () => {
    window.localStorage.setItem(MARKETING_CONSENT_COOKIE, 'denied')
    render(<MarketingConsentBanner />)

    await waitFor(() => expect(screen.queryByRole('button', { name: 'No thanks' })).not.toBeInTheDocument())
    act(() => window.dispatchEvent(new Event(OPEN_PRIVACY_CHOICES_EVENT)))

    const allow = await screen.findByRole('button', { name: 'Allow Meta measurement' })
    fireEvent.click(allow)

    expect(window.localStorage.getItem(MARKETING_CONSENT_COOKIE)).toBe('granted')
  })
})

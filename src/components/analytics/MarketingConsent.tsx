'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getMarketingConsent,
  MarketingConsent,
  OPEN_PRIVACY_CHOICES_EVENT,
  setMarketingConsent
} from '@/lib/marketingConsent'

export default function MarketingConsentBanner() {
  const [consent, setConsent] = useState<MarketingConsent | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedConsent = getMarketingConsent()
    setConsent(savedConsent)
    setIsOpen(savedConsent === null)

    const openChoices = () => setIsOpen(true)
    window.addEventListener(OPEN_PRIVACY_CHOICES_EVENT, openChoices)
    return () => window.removeEventListener(OPEN_PRIVACY_CHOICES_EVENT, openChoices)
  }, [])

  const choose = (choice: MarketingConsent) => {
    setMarketingConsent(choice)
    setConsent(choice)
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <aside
      aria-labelledby='privacy-choices-title'
      className='fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6'
    >
      <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 id='privacy-choices-title' className='font-display text-lg font-bold text-slate-950'>Your privacy choices</h2>
          <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-600'>
            We use cookieless Plausible analytics to understand site performance. With your permission, Meta can also measure advertising and booking results. We never send children&apos;s information to Meta.
          </p>
          <Link href='/privacy' className='mt-2 inline-flex text-sm font-semibold text-primary-700 hover:text-primary-900'>Read our privacy policy</Link>
        </div>
        <div className='flex flex-col-reverse gap-2 sm:flex-row md:flex-col-reverse md:items-stretch'>
          <button type='button' onClick={() => choose('denied')} className='rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50'>No thanks</button>
          <button type='button' onClick={() => choose('granted')} className='rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700'>Allow Meta measurement</button>
        </div>
      </div>
      {consent !== null && <p className='sr-only'>Your current choice is {consent}.</p>}
    </aside>
  )
}

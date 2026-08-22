'use client'

import { OPEN_PRIVACY_CHOICES_EVENT } from '@/lib/marketingConsent'

export default function PrivacyChoicesButton() {
  return (
    <button
      type='button'
      onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_CHOICES_EVENT))}
      className='text-gray-300 transition-colors duration-200 hover:text-white'
    >
      Privacy choices
    </button>
  )
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import CampBookingFlow from '@/components/booking/CampBookingFlow'

export const metadata: Metadata = {
  title: 'Book a School Holiday Camp',
  description: 'Choose camp dates and securely book a TinkerTank school holiday camp.',
  robots: { index: false, follow: false },
}

export default function BookCampsPage() {
  return (
    <Suspense
      fallback={<div className='min-h-[60vh] bg-slate-50 py-24 text-center font-semibold text-slate-600'>Loading your booking…</div>}
    >
      <CampBookingFlow />
    </Suspense>
  )
}

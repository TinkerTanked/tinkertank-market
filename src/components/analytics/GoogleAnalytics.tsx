'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const scriptId = measurementId || googleAdsId

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isInitialPage = useRef(true)

  useEffect(() => {
    if (isInitialPage.current) {
      isInitialPage.current = false
      return
    }
    if (!measurementId || !window.gtag) return

    const query = searchParams.toString()
    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: query ? `${pathname}?${query}` : pathname,
      page_title: document.title
    })
  }, [pathname, searchParams])

  return null
}

export default function GoogleAnalytics() {
  if (!scriptId) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${scriptId}`} strategy='afterInteractive' />
      <Script id='google-analytics' strategy='afterInteractive'>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          ${measurementId ? `gtag('config', '${measurementId}');` : ''}
          ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}

'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

function MetaPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isInitialPage = useRef(true)

  useEffect(() => {
    if (isInitialPage.current) {
      isInitialPage.current = false
      return
    }
    window.fbq?.('track', 'PageView')
  }, [pathname, searchParams])

  return null
}

export default function MetaPixel() {
  if (!pixelId) return null

  return (
    <>
      <Script id='meta-pixel' strategy='afterInteractive'>
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <Suspense fallback={null}>
        <MetaPageViewTracker />
      </Suspense>
    </>
  )
}

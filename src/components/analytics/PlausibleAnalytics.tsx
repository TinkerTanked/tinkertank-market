import Script from 'next/script'

export default function PlausibleAnalytics() {
  return (
    <>
      <Script id='plausible-queue' strategy='afterInteractive'>
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
      </Script>
      <Script defer data-domain='tinkertank.rocks' src='https://plausible.io/js/script.js' strategy='afterInteractive' />
    </>
  )
}

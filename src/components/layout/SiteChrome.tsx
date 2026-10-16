'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Public header, footer, and marketing scripts. The admin area renders its own
 * shell, so none of the public website chrome or tracking runs there.
 */
export default function SiteChrome({ header, footer, scripts, children }: {
  header: ReactNode
  footer: ReactNode
  scripts: ReactNode
  children: ReactNode
}) {
  if (usePathname()?.startsWith('/admin')) return <>{children}</>

  return (
    <>
      {scripts}
      <div className='min-h-screen flex flex-col'>
        {header}
        <main className='flex-1'>{children}</main>
        {footer}
      </div>
    </>
  )
}

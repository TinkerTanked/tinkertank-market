import type { ReactNode } from 'react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function MobileActionBar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden'>
      <div className='mx-auto flex max-w-lg items-center gap-3'>
        <div className='min-w-0 flex-1'>
          <p className='flex items-center gap-1.5 text-xs font-semibold text-slate-500'>
            <ShieldCheckIcon className='h-4 w-4 text-primary-700' />
            Safe, supported learning
          </p>
          <p className='truncate text-sm font-bold text-slate-950'>{label}</p>
        </div>
        <div className='shrink-0'>{children}</div>
      </div>
    </div>
  )
}

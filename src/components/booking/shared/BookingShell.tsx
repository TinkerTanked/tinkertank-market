'use client'

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const STEPS = ['Choose', 'Children', 'Your details', 'Review']

interface BookingShellProps {
  currentStep: number
  children: React.ReactNode
  summary: React.ReactNode
  onBack?: () => void
  onContinue: () => void
  continueLabel: string
  isContinuing?: boolean
}

export default function BookingShell({
  currentStep,
  children,
  summary,
  onBack,
  onContinue,
  continueLabel,
  isContinuing = false,
}: BookingShellProps) {
  return (
    <div className='min-h-screen bg-slate-50 pb-24 lg:pb-12'>
      <div className='border-b border-slate-200 bg-white'>
        <div className='container-custom py-5 sm:py-7'>
          <p className='text-xs font-bold uppercase tracking-[0.18em] text-primary-700'>Book with TinkerTank</p>
          <div className='mt-3 flex items-center justify-between gap-5'>
            <div>
              <h1 className='font-display text-2xl font-bold text-slate-950 sm:text-3xl'>Camp booking</h1>
              <p className='mt-1 text-sm text-slate-500'>
                Step {currentStep} of {STEPS.length} · {STEPS[currentStep - 1]}
              </p>
            </div>
            <div className='hidden items-center gap-2 lg:flex' aria-label={`Step ${currentStep} of ${STEPS.length}`}>
              {STEPS.map((step, index) => {
                const number = index + 1
                const complete = number < currentStep
                const active = number === currentStep
                return (
                  <div key={step} className='flex items-center'>
                    <div
                      className={`flex items-center gap-2 ${active ? 'text-primary-800' : complete ? 'text-emerald-700' : 'text-slate-400'}`}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                          active ? 'bg-primary-700 text-white' : complete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {complete ? <CheckIcon className='h-4 w-4' /> : number}
                      </span>
                      <span className='text-sm font-semibold'>{step}</span>
                    </div>
                    {number < STEPS.length && <span className={`mx-3 h-0.5 w-8 ${complete ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                  </div>
                )
              })}
            </div>
          </div>
          <div className='mt-4 flex gap-1.5 lg:hidden' aria-hidden='true'>
            {STEPS.map((step, index) => (
              <span key={step} className={`h-1.5 flex-1 rounded-full ${index + 1 <= currentStep ? 'bg-primary-700' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className='container-custom py-5 sm:py-8'>
        {currentStep < STEPS.length && (
          <details className='mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden'>
            <summary className='cursor-pointer px-5 py-4 text-sm font-bold text-slate-900'>Your booking summary</summary>
            <div className='border-t border-slate-200 p-5'>{summary}</div>
          </details>
        )}

        <div className='grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]'>
          <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8'>{children}</section>

          <aside className='sticky top-32 hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:block'>
            <h2 className='font-display text-lg font-bold text-slate-950'>Your booking</h2>
            <div className='mt-5'>{summary}</div>
            <div className='mt-6 rounded-2xl bg-primary-950 p-4 text-white'>
              <ShieldCheckIcon className='h-6 w-6 text-cyan-300' />
              <p className='mt-3 text-sm font-bold'>Book with confidence</p>
              <p className='mt-1 text-xs leading-5 text-primary-100'>No account required. Secure payment through Stripe.</p>
            </div>
          </aside>
        </div>
      </div>

      <div className='fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:py-0 lg:shadow-none'>
        <div className='container-custom flex items-center gap-3 lg:justify-end'>
          {onBack && (
            <button
              type='button'
              onClick={onBack}
              className='inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-4 font-bold text-slate-700 hover:bg-slate-50'
            >
              <ArrowLeftIcon className='mr-2 h-4 w-4' />
              Back
            </button>
          )}
          <button
            type='button'
            onClick={onContinue}
            disabled={isContinuing}
            className='inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl bg-primary-700 px-5 font-bold text-white shadow-sm hover:bg-primary-800 disabled:cursor-wait disabled:opacity-60 sm:max-w-sm'
          >
            <span className='truncate'>{isContinuing ? 'Please wait…' : continueLabel}</span>
            {!isContinuing && <ArrowRightIcon className='ml-2 h-4 w-4 flex-none' />}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bars3Icon, ChevronDownIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon, XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { learningTopics } from '@/data/learningTopics'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { items, getSummary } = useEnhancedCartStore()
  const { itemCount } = getSummary()

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigation = [
    { name: 'Ignite Program', href: '/ignite' },
    { name: 'Camps', href: '/camps' },
    { name: 'Birthday Parties', href: '/birthdays' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header className='sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur'>
      <div className='bg-slate-950 text-slate-200'>
        <div className='container-custom flex h-9 items-center justify-between text-xs font-medium sm:text-sm'>
          <Link href='/locations/neutral-bay#studio-map' className='flex items-center gap-1.5 hover:text-white'>
            <MapPinIcon className='h-4 w-4 text-blue-300' />
            <span>50 Yeo St, Neutral Bay</span>
          </Link>
          <div className='flex items-center gap-5'>
            <Link href='/child-safety' className='hidden items-center gap-1.5 hover:text-white sm:flex'>
              <ShieldCheckIcon className='h-4 w-4 text-blue-300' />
              Child safety comes first
            </Link>
            <a href='tel:1300670104' className='flex items-center gap-1.5 hover:text-white'>
              <PhoneIcon className='h-4 w-4 text-blue-300' />
              1300 670 104
            </a>
          </div>
        </div>
      </div>
      <div className='container-custom'>
        <div className='flex h-[4.5rem] items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center space-x-2.5'>
            <Image
              src='/images/logo-black.png'
              alt='TinkerTank Logo'
              width={38}
              height={38}
              className='h-[38px] w-[38px]'
            />
            <span className='font-display text-xl font-bold tracking-tight text-slate-950'>TinkerTank®</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden xl:flex items-center space-x-6'>
            {navigation.slice(0, 3).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className='text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-primary-700'
              >
                {item.name}
              </Link>
            ))}
            <div className='relative group'>
              <Link
                href='/what-kids-learn'
                className='flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-primary-700'
              >
                What Kids Learn
                <ChevronDownIcon className='w-4 h-4' />
              </Link>
              <div className='absolute top-full left-1/2 -translate-x-1/2 pt-3 w-72 invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-200'>
                <div className='rounded-2xl border border-slate-200 bg-white p-2 shadow-xl'>
                  {learningTopics.map(topic => (
                    <Link
                      key={topic.slug}
                      href={`/${topic.slug}`}
                      className='block rounded-xl px-4 py-3 transition-colors hover:bg-primary-50'
                    >
                      <span className='block text-sm font-semibold text-gray-900'>{topic.navLabel}</span>
                      <span className='block text-xs text-gray-500 mt-0.5'>{topic.shortDescription}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {navigation.slice(3).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className='text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-primary-700'
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className='hidden xl:flex items-center space-x-3'>
            <Link
              href='/cart'
              aria-label='View cart'
              className='relative rounded-lg p-2 text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-primary-700'
            >
              <ShoppingCartIcon className='w-6 h-6' />
              {mounted && itemCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium'>
                  {itemCount}
                </span>
              )}
            </Link>
            <Link href='/catalog' className='btn-primary px-5 py-2.5 text-sm'>
              Find a program
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className='xl:hidden flex items-center space-x-2'>
            <Link
              href='/cart'
              aria-label='View cart'
              className='relative rounded-lg p-2 text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-primary-700'
            >
              <ShoppingCartIcon className='w-6 h-6' />
              {mounted && itemCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium'>
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls='mobile-navigation'
              className='rounded-lg p-2 text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-primary-700'
            >
              {isMenuOpen ? <XMarkIcon className='w-6 h-6' /> : <Bars3Icon className='w-6 h-6' />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div id='mobile-navigation' className='border-t border-slate-200 py-5 xl:hidden'>
            <div className='flex flex-col space-y-3'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className='rounded-lg px-2 py-2 font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-primary-700'
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className='border-l-2 border-primary-100 pl-4 space-y-3'>
                <Link
                  href='/what-kids-learn'
                  className='block text-gray-900 font-semibold'
                  onClick={() => setIsMenuOpen(false)}
                >
                  What Kids Learn
                </Link>
                {learningTopics.map(topic => (
                  <Link
                    key={topic.slug}
                    href={`/${topic.slug}`}
                    className='block text-sm text-gray-600 hover:text-primary-600'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {topic.navLabel}
                  </Link>
                ))}
              </div>
              <Link href='/catalog' className='btn-primary mt-2 w-full' onClick={() => setIsMenuOpen(false)}>
                Find a program
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bars3Icon, XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { items, getSummary } = useEnhancedCartStore()
  const { itemCount } = getSummary()

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Camps', href: '/camps' },
    { name: 'Birthday Parties', href: '/birthdays' },
    { name: 'Ignite Program', href: '/ignite' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header className='bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50'>
      <div className='container-custom'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link href='/' className='flex items-center'>
            <span className='font-display font-bold text-xl text-gray-900'>TinkerTank®</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center space-x-8'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className='text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200'
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className='hidden md:flex items-center space-x-4'>
            <Link
              href='/cart'
              className='relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200'
            >
              <ShoppingCartIcon className='w-6 h-6' />
              {mounted && itemCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium'>
                  {itemCount}
                </span>
              )}
            </Link>
            <Link href='/camps' className='btn-primary'>
              Book Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden flex items-center space-x-2'>
            <Link
              href='/cart'
              className='relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200'
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
              className='p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200'
            >
              {isMenuOpen ? <XMarkIcon className='w-6 h-6' /> : <Bars3Icon className='w-6 h-6' />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className='md:hidden border-t border-gray-100 py-4'>
            <div className='flex flex-col space-y-4'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className='text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 px-2 py-1'
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href='/camps'
                className='btn-primary mt-4 text-center'
                onClick={() => setIsMenuOpen(false)}
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

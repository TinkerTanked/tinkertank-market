import Link from 'next/link'
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'

export default function Footer() {
  return (
    <footer className='bg-gray-900 text-white'>
      <div className='container-custom py-16'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Company Info */}
          <div className='space-y-4'>
            <Link href='/' className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>T</span>
              </div>
              <span className='font-display font-bold text-xl'>TinkerTank</span>
            </Link>
            <p className='text-gray-300 leading-relaxed'>
              Inspiring the next generation of innovators through hands-on STEM learning experiences.
            </p>
            <div className='flex space-x-4'>
              <a href='#' className='text-gray-400 hover:text-white transition-colors duration-200'>
                <span className='sr-only'>Facebook</span>
                <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/>
                </svg>
              </a>
              <a href='#' className='text-gray-400 hover:text-white transition-colors duration-200'>
                <span className='sr-only'>Instagram</span>
                <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.948 4.615c.83 0 1.5.671 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.671-1.5-1.5.67-1.5 1.5-1.5zm2.931 13.104c-2.293-.529-4.428-1.949-5.957-4.142-.898-1.286-.898-2.824 0-4.11C7.451 6.165 9.648 4.79 12.017 4.79s4.566 1.375 6.095 3.677c.898 1.286.898 2.824 0 4.11-1.529 2.193-3.664 3.613-5.957 4.142z'/>
                </svg>
              </a>
            </div>
          </div>

          {/* Programs */}
          <div className='space-y-4'>
            <h3 className='font-display font-semibold text-lg'>Programs</h3>
            <div className='space-y-2'>
              <Link href='/camps' className='block text-gray-300 hover:text-white transition-colors duration-200'>
                STEM Camps
              </Link>
              <Link href='/birthdays' className='block text-gray-300 hover:text-white transition-colors duration-200'>
                Birthday Parties
              </Link>
              <Link href='/ignite' className='block text-gray-300 hover:text-white transition-colors duration-200'>
                Ignite Program
              </Link>
              <Link href='/about' className='block text-gray-300 hover:text-white transition-colors duration-200'>
                About Us
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className='space-y-4'>
            <h3 className='font-display font-semibold text-lg'>Support</h3>
            <div className='space-y-2'>
              <Link href='/contact' className='block text-gray-300 hover:text-white transition-colors duration-200'>
                Contact Us
              </Link>
              <Link href='/faq' className='block text-gray-300 hover:text-white transition-colors duration-200'>
                FAQ
              </Link>
              <Link href='/policies' className='block text-gray-300 hover:text-white transition-colors duration-200'>
                Policies
              </Link>
              <Link href='/privacy' className='block text-gray-300 hover:text-white transition-colors duration-200'>
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className='space-y-4'>
            <h3 className='font-display font-semibold text-lg'>Get in Touch</h3>
            <div className='space-y-3'>
              <div className='flex items-start space-x-3'>
                <MapPinIcon className='w-5 h-5 text-primary-400 mt-0.5' />
                <div className='text-gray-300'>
                  <p>Neutral Bay</p>
                  <p>Sydney, NSW</p>
                </div>
              </div>
              <div className='flex items-center space-x-3'>
                <PhoneIcon className='w-5 h-5 text-primary-400' />
                <a 
                  href='tel:+61404123456' 
                  className='text-gray-300 hover:text-white transition-colors duration-200'
                >
                  0404 123 456
                </a>
              </div>
              <div className='flex items-center space-x-3'>
                <EnvelopeIcon className='w-5 h-5 text-primary-400' />
                <a 
                  href='mailto:hello@tinkertank.com.au' 
                  className='text-gray-300 hover:text-white transition-colors duration-200'
                >
                  hello@tinkertank.com.au
                </a>
              </div>
              <div className='flex items-start space-x-3'>
                <ClockIcon className='w-5 h-5 text-primary-400 mt-0.5' />
                <div className='text-gray-300'>
                  <p>Mon-Fri: 8:00 AM - 6:00 PM</p>
                  <p>Weekends: 9:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='border-t border-gray-800 mt-12 pt-8'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            <div className='text-gray-400 text-sm'>
              © 2024 TinkerTank. All rights reserved.
            </div>
            <div className='flex items-center space-x-6 text-sm text-gray-400'>
              <Link href='/terms' className='hover:text-white transition-colors duration-200'>
                Terms of Service
              </Link>
              <Link href='/privacy' className='hover:text-white transition-colors duration-200'>
                Privacy Policy
              </Link>
              <Link href='/refunds' className='hover:text-white transition-colors duration-200'>
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

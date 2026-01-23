'use client'

import Link from 'next/link'
import { getProductsByCategory } from '@/data/products'
import ProductCard from '@/components/ui/ProductCard'
import { GiftIcon, CakeIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function BirthdaysClient() {
  const birthdayProducts = getProductsByCategory('birthdays')

  return (
    <div>
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-purple-500 via-pink-500 to-accent-500 text-white py-16 lg:py-24'>
        <div className='container-custom'>
          <div className='text-center space-y-6'>
            <h1 className='text-4xl md:text-5xl font-display font-bold leading-tight text-shadow-sm'>
              Unforgettable <span className='text-yellow-300'>Birthday</span> Parties
            </h1>
            <p className='text-xl md:text-2xl font-light text-purple-100 max-w-3xl mx-auto'>
              Turn your child's special day into an epic STEAM adventure they'll remember forever
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-4'>
              <div className='flex items-center space-x-2 text-purple-100'>
                <GiftIcon className='w-5 h-5' />
                <span>All-Inclusive Packages</span>
              </div>
              <div className='flex items-center space-x-2 text-purple-100'>
                <UsersIcon className='w-5 h-5' />
                <span>Up to 12 Kids</span>
              </div>
              <div className='flex items-center space-x-2 text-purple-100'>
                <SparklesIcon className='w-5 h-5' />
                <span>Hassle-Free Setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Special */}
      <section className='py-16 bg-gray-50'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              Why Choose TinkerTank for Your Party?
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              We handle everything so you can focus on celebrating your special one
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            <div className='bg-white rounded-xl p-6 text-center shadow-lg'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🎉</span>
              </div>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                Complete Setup
              </h3>
              <p className='text-gray-600 text-sm'>
                We arrive early to set up everything and clean up afterward
              </p>
            </div>

            <div className='bg-white rounded-xl p-6 text-center shadow-lg'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🎂</span>
              </div>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                Themed Activities
              </h3>
              <p className='text-gray-600 text-sm'>
                Age-appropriate STEAM activities tailored to your theme
              </p>
            </div>

            <div className='bg-white rounded-xl p-6 text-center shadow-lg'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>👨‍🔬</span>
              </div>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                Expert Hosts
              </h3>
              <p className='text-gray-600 text-sm'>
                Experienced facilitators who keep kids engaged and entertained
              </p>
            </div>

            <div className='bg-white rounded-xl p-6 text-center shadow-lg'>
              <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🏆</span>
              </div>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                Take-Home Gifts
              </h3>
              <p className='text-gray-600 text-sm'>
                Every guest creates something special to take home
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Party Packages */}
      <section className='py-20'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>
              Choose Your Party Theme
            </h2>
            <p className='text-xl text-gray-600'>
              Each package includes everything you need for an amazing celebration
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {birthdayProducts.map((product) => (
              <ProductCard key={product.id} product={product} showCategory={false} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-20 bg-gradient-to-br from-purple-50 to-pink-50'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              How It Works
            </h2>
            <p className='text-lg text-gray-600'>
              Simple steps to the perfect party
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl'>
                1
              </div>
              <h3 className='font-display font-semibold text-lg'>Choose Package</h3>
              <p className='text-gray-600 text-sm'>
                Select your favorite theme and party package
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl'>
                2
              </div>
              <h3 className='font-display font-semibold text-lg'>Pick Date</h3>
              <p className='text-gray-600 text-sm'>
                Choose your preferred date and time slot
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl'>
                3
              </div>
              <h3 className='font-display font-semibold text-lg'>We Setup</h3>
              <p className='text-gray-600 text-sm'>
                Our team arrives early to set up everything
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl'>
                4
              </div>
              <h3 className='font-display font-semibold text-lg'>Celebrate!</h3>
              <p className='text-gray-600 text-sm'>
                Relax and enjoy watching your child's special day unfold
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className='py-20 bg-white'>
        <div className='container-custom max-w-4xl'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              Frequently Asked Questions
            </h2>
          </div>

          <div className='space-y-6'>
            <div className='bg-gray-50 rounded-xl p-6'>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                How many children can attend?
              </h3>
              <p className='text-gray-600'>
                Our birthday parties accommodate up to 12 children. This ensures everyone gets personalized attention and has a great time.
              </p>
            </div>

            <div className='bg-gray-50 rounded-xl p-6'>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                Do you provide decorations and cake?
              </h3>
              <p className='text-gray-600'>
                We provide themed decorations that match your selected package. You're welcome to bring your own cake, or we can arrange one for an additional fee.
              </p>
            </div>

            <div className='bg-gray-50 rounded-xl p-6'>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                What ages are suitable for birthday parties?
              </h3>
              <p className='text-gray-600'>
                Our parties are designed for ages 5-16, with activities adapted to the birthday child's age group and interests.
              </p>
            </div>

            <div className='bg-gray-50 rounded-xl p-6'>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                How long does the party last?
              </h3>
              <p className='text-gray-600'>
                Standard parties run for 2 hours, which includes 1.5 hours of activities plus time for cake and presents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='py-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
        <div className='container-custom text-center'>
          <div className='space-y-6'>
            <h2 className='text-3xl md:text-4xl font-display font-bold'>
              Ready to Plan the Perfect Party?
            </h2>
            <p className='text-xl text-purple-100 max-w-2xl mx-auto'>
              Let us create magical memories for your child's special day
            </p>
            <Link href='/contact' className='btn-secondary text-lg px-8 py-4 shadow-lg'>
              <CakeIcon className='w-5 h-5 mr-2' />
              Plan My Party
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

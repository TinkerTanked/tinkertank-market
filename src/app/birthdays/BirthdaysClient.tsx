'use client'

import Link from 'next/link'
import { getProductsByCategory } from '@/data/products'
import ProductCard from '@/components/ui/ProductCard'
import { GiftIcon, CakeIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline'
import MobileActionBar from '@/components/ui/MobileActionBar'
import TrustProofSection from '@/components/trust/TrustProofSection'

export default function BirthdaysClient() {
  const birthdayProducts = getProductsByCategory('birthdays')

  return (
    <div className='pb-20 md:pb-0'>
      {/* Hero Section */}
      <section className='program-hero'>
        <div className='container-custom'>
          <div className='text-center space-y-6'>
            <h1 className='text-4xl md:text-5xl font-display font-bold leading-tight text-shadow-sm'>
              Robotics, Coding &amp; <span className='text-orange-300'>STEAM Birthday Parties</span>
            </h1>
            <p className='text-xl md:text-2xl font-light text-blue-100 max-w-3xl mx-auto'>
              Hands-on kids&apos; parties at our Neutral Bay studio or your venue across Northern Sydney
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-4'>
              <div className='flex items-center space-x-2 text-blue-100'>
                <GiftIcon className='w-5 h-5' />
                <span>All-Inclusive Packages</span>
              </div>
              <div className='flex items-center space-x-2 text-blue-100'>
                <UsersIcon className='w-5 h-5' />
                <span>10 Students Included</span>
              </div>
              <div className='flex items-center space-x-2 text-blue-100'>
                <SparklesIcon className='w-5 h-5' />
                <span>Our Studio or Your Venue</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustProofSection />

      {/* What Makes Us Special */}
      <section className='bg-slate-50 py-20'>
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
            <div className='feature-card text-center'>
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

            <div className='feature-card text-center'>
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

            <div className='feature-card text-center'>
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

            <div className='feature-card text-center'>
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
      <section id='party-packages' className='scroll-mt-32 bg-white py-20'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>
              Choose Your Party Theme
            </h2>
            <p className='text-xl text-gray-600'>
              Each package includes everything you need for an amazing celebration
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto'>
            {birthdayProducts.map((product) => (
              <ProductCard key={product.id} product={product} showCategory={false} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='border-y border-slate-200 bg-slate-50 py-20'>
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
                Each party includes 10 students (including the birthday child). Additional students can be added for an extra fee.
              </p>
            </div>

            <div className='bg-gray-50 rounded-xl p-6'>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                Where do the parties take place?
              </h3>
              <p className='text-gray-600'>
                You can host your party at our fully-equipped <Link href='/locations/neutral-bay' className='text-primary-600 font-semibold hover:underline'>TinkerTank Neutral Bay studio</Link>, or pick &ldquo;Your Venue&rdquo; and we&apos;ll bring the party to your home or venue. Mobile parties are available across the Lower North Shore and <Link href='/areas/northern-beaches' className='text-primary-600 font-semibold hover:underline'>Northern Beaches</Link>, subject to availability.
              </p>
            </div>

            <div className='bg-gray-50 rounded-xl p-6'>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                What ages are suitable for birthday parties?
              </h3>
              <p className='text-gray-600'>
                Both our Robotics and Coding parties are designed for ages 6 and up, with activities adapted to the birthday child's age group.
              </p>
            </div>

            <div className='bg-gray-50 rounded-xl p-6'>
              <h3 className='font-display font-semibold text-lg text-gray-900 mb-2'>
                How long does the party last?
              </h3>
              <p className='text-gray-600'>
                Parties run for 2 hours, which includes hands-on activities plus time for cake and presents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='bg-primary-700 py-20 text-white'>
        <div className='container-custom text-center'>
          <div className='space-y-6'>
            <h2 className='text-3xl md:text-4xl font-display font-bold'>
              Ready to Plan the Perfect Party?
            </h2>
            <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
              Let us create magical memories for your child's special day
            </p>
            <Link href='/contact' className='btn-secondary text-lg px-8 py-4 shadow-lg'>
              <CakeIcon className='w-5 h-5 mr-2' />
              Plan My Party
            </Link>
          </div>
        </div>
      </section>

      <MobileActionBar label='STEAM birthday parties'>
        <Link href='#party-packages' className='btn-primary px-4 py-2 text-sm'>View parties</Link>
      </MobileActionBar>
    </div>
  )
}

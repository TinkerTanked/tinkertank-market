import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy - TinkerTank',
  description:
    'TinkerTank Refund and Cancellation Policy for camps, birthday parties, and Ignite subscriptions.',
  alternates: {
    canonical: `${baseUrl}/refunds`
  },
  openGraph: {
    title: 'Refund & Cancellation Policy | TinkerTank',
    description: 'Refund and cancellation policies for TinkerTank STEAM programs.',
    url: `${baseUrl}/refunds`,
    type: 'website'
  }
}

export default function RefundsPage() {
  return (
    <div className='py-16'>
      <div className='container-custom max-w-4xl'>
        <Link href='/' className='inline-flex items-center text-primary-600 hover:text-primary-700 mb-8'>
          <ArrowLeftIcon className='w-4 h-4 mr-2' />
          Back to Home
        </Link>

        <div className='space-y-4 mb-12'>
          <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900'>Refund & Cancellation Policy</h1>
          <p className='text-gray-500'>Last updated: 14 February 2025</p>
        </div>

        <div className='bg-primary-50 border border-primary-200 rounded-xl p-6 mb-12'>
          <p className='text-primary-800 font-medium'>
            We understand that plans can change. This policy outlines our approach to cancellations and refunds 
            while ensuring we can continue to deliver quality programs for all families.
          </p>
        </div>

        <div className='prose prose-lg max-w-none text-gray-700 space-y-8'>
          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>1. Day Camps & All Day Camps</h2>
            
            <div className='overflow-x-auto'>
              <table className='min-w-full border-collapse border border-gray-200 rounded-lg overflow-hidden'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900'>Cancellation Timing</th>
                    <th className='border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900'>Refund</th>
                    <th className='border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900'>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='border border-gray-200 px-4 py-3'>7+ days before camp starts</td>
                    <td className='border border-gray-200 px-4 py-3 text-green-600 font-medium'>100% refund</td>
                    <td className='border border-gray-200 px-4 py-3'>Or 100% credit</td>
                  </tr>
                  <tr className='bg-gray-50'>
                    <td className='border border-gray-200 px-4 py-3'>3-6 days before camp starts</td>
                    <td className='border border-gray-200 px-4 py-3 text-yellow-600 font-medium'>50% refund</td>
                    <td className='border border-gray-200 px-4 py-3'>Or 100% credit</td>
                  </tr>
                  <tr>
                    <td className='border border-gray-200 px-4 py-3'>Less than 3 days before</td>
                    <td className='border border-gray-200 px-4 py-3 text-red-600 font-medium'>No refund</td>
                    <td className='border border-gray-200 px-4 py-3'>100% credit</td>
                  </tr>
                  <tr className='bg-gray-50'>
                    <td className='border border-gray-200 px-4 py-3'>No-show (no cancellation)</td>
                    <td className='border border-gray-200 px-4 py-3 text-red-600 font-medium'>No refund</td>
                    <td className='border border-gray-200 px-4 py-3 text-red-600 font-medium'>No credit</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>Multi-Day Camp Bookings</h3>
            <p>
              For bookings that include multiple consecutive days (e.g., a full week of camp):
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>The above policy applies to the entire booking, not individual days</li>
              <li>Partial attendance does not entitle you to a partial refund</li>
              <li>If you need to miss individual days, please contact us to discuss options</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>2. Birthday Parties</h2>
            
            <div className='overflow-x-auto'>
              <table className='min-w-full border-collapse border border-gray-200 rounded-lg overflow-hidden'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900'>Cancellation Timing</th>
                    <th className='border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900'>Deposit</th>
                    <th className='border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900'>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='border border-gray-200 px-4 py-3'>14+ days before party</td>
                    <td className='border border-gray-200 px-4 py-3 text-yellow-600 font-medium'>Non-refundable</td>
                    <td className='border border-gray-200 px-4 py-3 text-green-600 font-medium'>100% refund (if paid)</td>
                  </tr>
                  <tr className='bg-gray-50'>
                    <td className='border border-gray-200 px-4 py-3'>7-13 days before party</td>
                    <td className='border border-gray-200 px-4 py-3 text-yellow-600 font-medium'>Non-refundable</td>
                    <td className='border border-gray-200 px-4 py-3 text-yellow-600 font-medium'>50% refund or full credit</td>
                  </tr>
                  <tr>
                    <td className='border border-gray-200 px-4 py-3'>Less than 7 days before</td>
                    <td className='border border-gray-200 px-4 py-3 text-red-600 font-medium'>Non-refundable</td>
                    <td className='border border-gray-200 px-4 py-3 text-red-600 font-medium'>No refund, credit only</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>Rescheduling</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Parties may be rescheduled at no charge with 14+ days notice (subject to availability)</li>
              <li>Rescheduling with 7-13 days notice incurs a $50 rescheduling fee</li>
              <li>Rescheduling with less than 7 days notice may not be possible</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>Guest Count Changes</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Final guest count must be confirmed 7 days before the party</li>
              <li>Guest count increases are subject to availability and additional charges</li>
              <li>Guest count decreases after the 7-day deadline are not refundable</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>3. Ignite Subscriptions</h2>
            
            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>Cancellation</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>You may cancel your Ignite subscription at any time</li>
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>You will continue to have access until the end of the paid period</li>
              <li>No refunds for partial billing periods</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>Pausing</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>You may pause your subscription for up to 2 months per year</li>
              <li>Pausing must be requested at least 7 days before your next billing date</li>
              <li>Billing will automatically resume after the pause period</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>Missed Sessions</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Missed subscription sessions cannot be refunded or carried over</li>
              <li>Where possible, we may offer make-up sessions (subject to availability)</li>
              <li>Contact us at least 24 hours in advance if you cannot attend</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>4. Cancellations by TinkerTank</h2>
            <p>
              If we need to cancel a program due to circumstances within our control (e.g., staff illness, 
              minimum numbers not met), you will receive:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>A full refund to your original payment method; or</li>
              <li>A full credit to use on future programs (at your choice)</li>
            </ul>
            <p className='mt-4'>
              We will notify you as soon as possible and work with you to find alternative options.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>5. Weather and Unforeseen Events</h2>
            <p>
              In the event of severe weather, natural disasters, or government-mandated closures:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>We will attempt to reschedule programs where possible</li>
              <li>Full credits will be issued for cancelled sessions</li>
              <li>Refunds may be issued at our discretion for extended closures</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>6. How to Request a Cancellation or Refund</h2>
            <p>
              To request a cancellation or refund:
            </p>
            <ol className='list-decimal pl-6 space-y-2'>
              <li>Email us at <a href='mailto:bookings@tinkertank.rocks' className='text-primary-600 hover:underline'>bookings@tinkertank.rocks</a></li>
              <li>Include your booking reference number</li>
              <li>Specify whether you prefer a refund or credit (where applicable)</li>
            </ol>
            <p className='mt-4'>
              We aim to process refund requests within 5-7 business days. Refunds will be credited to your 
              original payment method and may take an additional 5-10 business days to appear in your account.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>7. Credits</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Credits are valid for 12 months from the date of issue</li>
              <li>Credits can be applied to any TinkerTank program</li>
              <li>Credits are non-transferable and cannot be redeemed for cash</li>
              <li>Credits cannot be combined with other promotions unless specified</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>8. Australian Consumer Law</h2>
            <p>
              This policy does not limit your rights under Australian Consumer Law. If services are not 
              delivered as promised, are defective, or do not match their description, you may be entitled 
              to additional remedies including:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>A full refund</li>
              <li>Compensation for any loss or damage</li>
            </ul>
            <p className='mt-4'>
              For more information about your consumer rights, visit the 
              <a href='https://www.accc.gov.au/consumers' target='_blank' rel='noopener noreferrer' className='text-primary-600 hover:underline'> ACCC website</a>.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>9. Contact Us</h2>
            <p>
              If you have questions about our refund policy or need assistance with a cancellation:
            </p>
            <div className='bg-gray-50 rounded-xl p-6 mt-4'>
              <p className='font-semibold'>TinkerTank Pty Ltd</p>
              <p>Neutral Bay, NSW 2089, Australia</p>
              <p>Email: <a href='mailto:bookings@tinkertank.rocks' className='text-primary-600 hover:underline'>bookings@tinkertank.rocks</a></p>
              <p>Website: <a href='https://tinkertank.rocks' className='text-primary-600 hover:underline'>tinkertank.rocks</a></p>
            </div>
          </section>
        </div>

        <div className='mt-16 pt-8 border-t border-gray-200'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Link href='/privacy' className='text-primary-600 hover:text-primary-700 hover:underline'>
              Privacy Policy →
            </Link>
            <Link href='/terms' className='text-primary-600 hover:text-primary-700 hover:underline'>
              Terms and Conditions →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

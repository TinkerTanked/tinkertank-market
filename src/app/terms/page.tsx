import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Terms and Conditions - TinkerTank',
  description:
    'TinkerTank Terms and Conditions. Read our terms of service for camps, birthday parties, and Ignite subscription programs.',
  alternates: {
    canonical: `${baseUrl}/terms`
  },
  openGraph: {
    title: 'Terms and Conditions | TinkerTank',
    description: 'Terms of service for TinkerTank STEAM education programs.',
    url: `${baseUrl}/terms`,
    type: 'website'
  }
}

export default function TermsPage() {
  return (
    <div className='py-16'>
      <div className='container-custom max-w-4xl'>
        <Link href='/' className='inline-flex items-center text-primary-600 hover:text-primary-700 mb-8'>
          <ArrowLeftIcon className='w-4 h-4 mr-2' />
          Back to Home
        </Link>

        <div className='space-y-4 mb-12'>
          <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900'>Terms and Conditions</h1>
          <p className='text-gray-500'>Last updated: 14 February 2025</p>
        </div>

        <div className='prose prose-lg max-w-none text-gray-700 space-y-8'>
          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>1. Agreement to Terms</h2>
            <p>
              These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Parent&quot;, &quot;Guardian&quot;, 
              or &quot;Customer&quot;) and TinkerTank Pty Ltd (&quot;TinkerTank&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) regarding your use of our 
              website (tinkertank.rocks, tinkertank.com.au) and services, including but not limited to STEAM camps, 
              birthday parties, and Ignite subscription programs.
            </p>
            <p>
              By making a booking or using our services, you agree to be bound by these Terms. If you do not agree 
              to these Terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>2. Definitions</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li><strong>&quot;Services&quot;</strong> means all programs offered by TinkerTank, including Day Camps, All Day Camps, Birthday Parties, and Ignite subscription programs.</li>
              <li><strong>&quot;Child&quot; or &quot;Student&quot;</strong> means any minor enrolled in our programs.</li>
              <li><strong>&quot;Parent&quot;</strong> means any parent, guardian, or authorised adult responsible for a Child.</li>
              <li><strong>&quot;Booking&quot;</strong> means a confirmed reservation for any of our Services.</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>3. Bookings and Payment</h2>
            
            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>3.1 Making a Booking</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>All bookings must be made online through our website</li>
              <li>A booking is only confirmed upon successful payment</li>
              <li>You will receive a confirmation email with booking details</li>
              <li>Places are limited and allocated on a first-come, first-served basis</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>3.2 Payment</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>All prices are in Australian Dollars (AUD) and include GST where applicable</li>
              <li>Payment is processed securely through Stripe</li>
              <li>Full payment is required at the time of booking unless otherwise specified</li>
              <li>We accept major credit and debit cards</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>3.3 Subscriptions (Ignite Program)</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Ignite subscriptions are billed on a recurring basis as specified at signup</li>
              <li>You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period</li>
              <li>No refunds are provided for partial billing periods</li>
              <li>We may change subscription pricing with 30 days&apos; notice</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>4. Cancellations and Refunds</h2>
            <p>
              Please refer to our <Link href='/refunds' className='text-primary-600 hover:underline'>Refund Policy</Link> for 
              detailed information on cancellations, refunds, and credits. Key points include:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Cancellations 7+ days before: Full refund or credit</li>
              <li>Cancellations 3-6 days before: 50% refund or full credit</li>
              <li>Cancellations less than 3 days before: Credit only (no refunds)</li>
              <li>No-shows: No refund or credit</li>
            </ul>
            <p className='mt-4'>
              Our refund policy complies with Australian Consumer Law. Your statutory rights are not affected.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>5. Program Participation</h2>
            
            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>5.1 Age Requirements</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Programs are designed for specific age groups as indicated on each program listing</li>
              <li>Children must meet the age requirements at the time of the program</li>
              <li>We reserve the right to refuse participation if age requirements are not met</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>5.2 Health and Medical Information</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Parents must provide accurate health, allergy, and medical information at time of booking</li>
              <li>Parents must inform us of any changes to medical conditions before the program</li>
              <li>We reserve the right to refuse participation if we cannot safely accommodate a child&apos;s needs</li>
              <li>Children must be well enough to participate; unwell children may be sent home</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>5.3 Drop-off and Pick-up</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Children must be dropped off and picked up at the designated times</li>
              <li>Only authorised persons listed on the booking may collect children</li>
              <li>Photo ID may be required for verification</li>
              <li>Late pick-up fees may apply (see section 8)</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>6. Supervision and Safety</h2>
            
            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>6.1 Our Responsibilities</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>We provide appropriate supervision during program hours</li>
              <li>All staff have Working With Children Checks (WWCC)</li>
              <li>We maintain appropriate staff-to-child ratios</li>
              <li>We have first aid trained staff on site</li>
              <li>We maintain a safe learning environment</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>6.2 Emergency Procedures</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>In case of medical emergency, we will contact emergency services (000) first, then notify parents</li>
              <li>By booking, you consent to emergency medical treatment if parents cannot be reached</li>
              <li>Emergency contacts provided must be reachable during program hours</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>7. Code of Conduct</h2>
            
            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>7.1 Expected Behaviour</h3>
            <p>Children are expected to:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Treat staff, other children, and equipment with respect</li>
              <li>Follow instructions from staff</li>
              <li>Participate safely in activities</li>
              <li>Not engage in bullying, violence, or disruptive behaviour</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>7.2 Consequences</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li>We reserve the right to remove a child from a program if their behaviour endangers themselves or others</li>
              <li>Parents will be contacted to collect their child immediately</li>
              <li>No refund will be provided for removal due to behavioural issues</li>
              <li>We may refuse future bookings for repeated issues</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>8. Additional Fees</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li><strong>Late Pick-up:</strong> $1 per minute after the first 10 minutes past the scheduled pick-up time</li>
              <li><strong>Extended supervision</strong> may be charged at $15 per 30-minute block if arrangements are made in advance</li>
              <li><strong>Damaged Equipment:</strong> Parents may be liable for costs of equipment intentionally damaged by their child</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>9. Photography and Media</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>We may photograph or video children during programs for marketing and promotional purposes</li>
              <li>Parents will be asked for consent during the booking process</li>
              <li>Parents may opt out of photography at any time by notifying us in writing</li>
              <li>Images will only be used in TinkerTank marketing materials (website, social media, brochures)</li>
              <li>Children&apos;s names will not be published alongside images without explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>10. Birthday Party Terms</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Birthday party bookings require a non-refundable deposit as specified at booking</li>
              <li>Final guest count must be confirmed 7 days before the party</li>
              <li>We do not provide catering; parents are responsible for food and cake</li>
              <li>Party duration is as specified in the package; extensions may incur additional charges</li>
              <li>Parents must supervise their own guests for the party portion</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>TinkerTank is not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount paid for the relevant service</li>
              <li>We are not liable for loss or damage to personal belongings brought to our premises</li>
              <li>Parents acknowledge that STEAM activities involve inherent risks and participate voluntarily</li>
            </ul>
            <p className='mt-4'>
              Nothing in these Terms excludes or limits liability that cannot be excluded under Australian Consumer Law, 
              including liability for death or personal injury caused by negligence.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>12. Intellectual Property</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>All content on our website (text, images, logos, designs) is owned by TinkerTank or our licensors</li>
              <li>You may not copy, reproduce, or distribute our content without permission</li>
              <li>Projects created by children during programs remain the property of the child</li>
              <li>We may photograph completed projects for marketing purposes</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>13. Changes to Programs</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>We reserve the right to modify program content, schedules, or activities</li>
              <li>We will notify you of significant changes as soon as practicable</li>
              <li>If we cancel a program, you will receive a full refund or credit</li>
              <li>We are not liable for costs incurred due to program changes beyond our control</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>14. Force Majeure</h2>
            <p>
              We are not liable for failure to perform our obligations due to circumstances beyond our reasonable control, 
              including but not limited to natural disasters, pandemics, government orders, or infrastructure failures. 
              In such cases, we will offer credits or rescheduling where possible.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>15. Governing Law</h2>
            <p>
              These Terms are governed by the laws of New South Wales, Australia. Any disputes will be subject to 
              the exclusive jurisdiction of the courts of New South Wales.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>16. Australian Consumer Law</h2>
            <p>
              Our services come with guarantees that cannot be excluded under the Australian Consumer Law. 
              For major failures with the service, you are entitled to:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Cancel your booking and receive a refund; or</li>
              <li>Receive compensation for the drop in value of the services provided</li>
            </ul>
            <p className='mt-4'>
              You are also entitled to choose a refund or replacement for major failures with goods, and compensation 
              for any other reasonably foreseeable loss or damage.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>17. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Changes will be posted on this page with an updated 
              &quot;Last updated&quot; date. Continued use of our services after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>18. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us:
            </p>
            <div className='bg-gray-50 rounded-xl p-6 mt-4'>
              <p className='font-semibold'>TinkerTank Pty Ltd</p>
              <p>Neutral Bay, NSW 2089, Australia</p>
              <p>Email: <a href='mailto:hello@tinkertank.rocks' className='text-primary-600 hover:underline'>hello@tinkertank.rocks</a></p>
              <p>Website: <a href='https://tinkertank.rocks' className='text-primary-600 hover:underline'>tinkertank.rocks</a></p>
            </div>
          </section>
        </div>

        <div className='mt-16 pt-8 border-t border-gray-200'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Link href='/privacy' className='text-primary-600 hover:text-primary-700 hover:underline'>
              Privacy Policy →
            </Link>
            <Link href='/refunds' className='text-primary-600 hover:text-primary-700 hover:underline'>
              Refund Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

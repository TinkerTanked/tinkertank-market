import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Privacy Policy - TinkerTank',
  description:
    'TinkerTank Privacy Policy. Learn how we collect, use, and protect your personal information and your children\'s data.',
  alternates: {
    canonical: `${baseUrl}/privacy`
  },
  openGraph: {
    title: 'Privacy Policy | TinkerTank',
    description: 'Learn how TinkerTank collects, uses, and protects your personal information.',
    url: `${baseUrl}/privacy`,
    type: 'website'
  }
}

export default function PrivacyPolicyPage() {
  return (
    <div className='py-16'>
      <div className='container-custom max-w-4xl'>
        <Link href='/' className='inline-flex items-center text-primary-600 hover:text-primary-700 mb-8'>
          <ArrowLeftIcon className='w-4 h-4 mr-2' />
          Back to Home
        </Link>

        <div className='space-y-4 mb-12'>
          <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900'>Privacy Policy</h1>
          <p className='text-gray-500'>Last updated: 14 February 2025</p>
        </div>

        <div className='prose prose-lg max-w-none text-gray-700 space-y-8'>
          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>1. Introduction</h2>
            <p>
              TinkerTank Pty Ltd (ABN to be provided) (&quot;TinkerTank&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting the privacy 
              of our customers, including children who participate in our programs. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website (tinkertank.rocks, tinkertank.com.au) 
              or use our services.
            </p>
            <p>
              We comply with the Australian Privacy Principles (APPs) contained in the Privacy Act 1988 (Cth) and are committed 
              to handling personal information responsibly. For international visitors, we also consider GDPR principles where applicable.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>2. Information We Collect</h2>
            
            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>2.1 Parent/Guardian Information</h3>
            <p>When you book a program or create an account, we collect:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Billing address</li>
              <li>Payment information (processed securely via Stripe)</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>2.2 Child/Student Information</h3>
            <p>To provide appropriate care and education, we collect:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Child&apos;s name</li>
              <li>Date of birth / Age</li>
              <li>Allergies and dietary requirements</li>
              <li>Medical conditions and special needs</li>
              <li>Emergency contact details</li>
              <li>School grade/year level</li>
            </ul>

            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>2.3 Automatically Collected Information</h3>
            <p>When you visit our website, we may automatically collect:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Pages visited and time spent</li>
              <li>Referring website</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Process bookings and payments for camps, birthday parties, and Ignite subscriptions</li>
              <li>Provide safe and appropriate care for children during programs</li>
              <li>Communicate about bookings, schedules, and program updates</li>
              <li>Respond to medical emergencies appropriately</li>
              <li>Send newsletters and promotional materials (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
              <li>Maintain records as required by law</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>4. Children&apos;s Privacy</h2>
            <p>
              We take children&apos;s privacy very seriously. We only collect children&apos;s information that is necessary 
              for their participation in our programs and their health and safety.
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>We only collect children&apos;s information from parents or legal guardians</li>
              <li>We do not knowingly allow children to make purchases or share personal information online</li>
              <li>Children&apos;s medical and allergy information is treated as sensitive information with restricted access</li>
              <li>We do not sell or share children&apos;s information for marketing purposes</li>
              <li>Parents may request access to or deletion of their child&apos;s information at any time</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>5. Disclosure of Information</h2>
            <p>We may share your information with:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li><strong>Payment Processors:</strong> Stripe processes all payments. We do not store complete credit card details.</li>
              <li><strong>Emergency Services:</strong> Medical and emergency contact information may be shared with emergency services if required.</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate (email, hosting, analytics) under strict confidentiality agreements.</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority.</li>
            </ul>
            <p className='mt-4'>
              We do not sell, trade, or rent personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>6. Data Storage and Security</h2>
            <p>
              We take reasonable steps to protect your personal information from misuse, interference, loss, 
              unauthorised access, modification, or disclosure.
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>All data is encrypted in transit using SSL/TLS</li>
              <li>Payment data is processed by Stripe, a PCI DSS compliant payment processor</li>
              <li>Access to personal information is restricted to authorised personnel only</li>
              <li>We maintain regular security updates and monitoring</li>
              <li>Data is stored on secure servers in Australia where possible</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your browsing experience and analyze website usage.
            </p>
            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>Types of Cookies We Use:</h3>
            <ul className='list-disc pl-6 space-y-2'>
              <li><strong>Essential Cookies:</strong> Required for the website to function (e.g., shopping cart, login sessions)</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (only with consent)</li>
            </ul>
            <p className='mt-4'>
              You can control cookies through your browser settings. Disabling essential cookies may affect website functionality.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>8. Your Rights</h2>
            <p>Under Australian Privacy law, you have the right to:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you or your child</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of personal information (subject to legal retention requirements)</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
              <li><strong>Complaint:</strong> Lodge a complaint if you believe we have breached your privacy</li>
            </ul>
            <h3 className='text-xl font-display font-semibold text-gray-900 mt-8 mb-3'>For International Visitors (GDPR)</h3>
            <p>If you are located in the European Economic Area, you may also have rights to:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Data portability</li>
              <li>Restriction of processing</li>
              <li>Object to processing</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>9. Data Retention</h2>
            <p>We retain personal information for as long as necessary to:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Provide our services and maintain booking records</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Resolve disputes and enforce agreements</li>
            </ul>
            <p className='mt-4'>
              Typically, booking and customer records are retained for 7 years in accordance with Australian tax law requirements. 
              You may request deletion of non-essential data at any time.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>10. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the privacy practices 
              of these external sites. We encourage you to read the privacy policies of any linked websites.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by 
              posting a notice on our website or sending you an email. The &quot;Last updated&quot; date at the top of this 
              policy indicates when it was last revised.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, wish to exercise your privacy rights, or have a complaint, 
              please contact us:
            </p>
            <div className='bg-gray-50 rounded-xl p-6 mt-4'>
              <p className='font-semibold'>TinkerTank Pty Ltd</p>
              <p>Neutral Bay, NSW 2089, Australia</p>
              <p>Email: <a href='mailto:privacy@tinkertank.rocks' className='text-primary-600 hover:underline'>privacy@tinkertank.rocks</a></p>
              <p>Phone: <a href='tel:+61XXXXXXXXXX' className='text-primary-600 hover:underline'>Contact via website</a></p>
            </div>
            <p className='mt-4'>
              If you are not satisfied with our response, you may lodge a complaint with the 
              <a href='https://www.oaic.gov.au/' target='_blank' rel='noopener noreferrer' className='text-primary-600 hover:underline'> Office of the Australian Information Commissioner (OAIC)</a>.
            </p>
          </section>
        </div>

        <div className='mt-16 pt-8 border-t border-gray-200'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Link href='/terms' className='text-primary-600 hover:text-primary-700 hover:underline'>
              Terms and Conditions →
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

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Child Safety - TinkerTank',
  description:
    'TinkerTank is committed to creating safe, respectful, and inclusive environments for all children and young people, in line with the NSW Child Safe Standards.',
  alternates: {
    canonical: `${baseUrl}/child-safety`
  },
  openGraph: {
    title: 'Child Safety | TinkerTank',
    description:
      'TinkerTank is committed to creating safe, respectful, and inclusive environments for all children and young people.',
    url: `${baseUrl}/child-safety`,
    type: 'website'
  }
}

export default function ChildSafetyPage() {
  return (
    <div className='py-16'>
      <div className='container-custom max-w-4xl'>
        <Link href='/' className='inline-flex items-center text-primary-600 hover:text-primary-700 mb-8'>
          <ArrowLeftIcon className='w-4 h-4 mr-2' />
          Back to Home
        </Link>

        <div className='space-y-4 mb-12'>
          <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900'>Child Safety at TinkerTank</h1>
        </div>

        <div className='prose prose-lg max-w-none text-gray-700 space-y-6'>
          <p>
            At TinkerTank, the safety, wellbeing, and inclusion of every child is our highest priority.
          </p>
          <p>
            We are committed to providing safe, respectful, and supportive learning environments where children feel
            valued, heard, and empowered to participate.
          </p>

          <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>
            We believe every child has the right to:
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>Feel safe and respected</li>
            <li>Be listened to and taken seriously</li>
            <li>Learn in an inclusive environment</li>
            <li>Speak up if they feel uncomfortable or concerned</li>
          </ul>

          <h2 className='text-2xl font-display font-bold text-gray-900 mt-12 mb-4'>
            TinkerTank actively promotes child safety through:
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>Child Safe Policies and procedures</li>
            <li>Staff screening and Working With Children Checks</li>
            <li>Child safety training and supervision</li>
            <li>Clear reporting and complaints processes</li>
          </ul>

          <p>
            We encourage children, families, staff, and community members to raise any concerns relating to safety,
            wellbeing, behaviour, or conduct.
          </p>
          <p>
            Concerns can be raised with any TinkerTank staff member or directly with our Child Safe Officer.
          </p>
          <p>
            All concerns are taken seriously and managed respectfully, confidentially, and in accordance with NSW Child
            Safe Standards.
          </p>
        </div>

        <div className='mt-16 pt-8 border-t border-gray-200'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Link href='/contact' className='text-primary-600 hover:text-primary-700 hover:underline'>
              Contact Us →
            </Link>
            <Link href='/privacy' className='text-primary-600 hover:text-primary-700 hover:underline'>
              Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

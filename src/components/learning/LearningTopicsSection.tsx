import Link from 'next/link'
import { learningTopics } from '@/data/learningTopics'

interface LearningTopicsSectionProps {
  heading?: string
  description?: string
  className?: string
}

export default function LearningTopicsSection({
  heading = 'What Kids Learn at TinkerTank',
  description = 'Every TinkerTank experience connects technology, creativity and practical problem-solving.',
  className = 'bg-gray-50'
}: LearningTopicsSectionProps) {
  return (
    <section className={`py-16 ${className}`}>
      <div className='container-custom'>
        <div className='max-w-3xl mx-auto text-center space-y-4 mb-10'>
          <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>{heading}</h2>
          <p className='text-lg text-gray-600'>{description}</p>
        </div>
        <div className='grid sm:grid-cols-2 lg:grid-cols-5 gap-4'>
          {learningTopics.map(topic => (
            <Link
              key={topic.slug}
              href={`/${topic.slug}`}
              className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition-all'
            >
              <h3 className='font-display font-semibold text-gray-900'>{topic.navLabel}</h3>
              <p className='text-sm text-gray-600 mt-2'>{topic.shortDescription}</p>
              <span className='inline-block text-primary-600 font-semibold text-sm mt-4'>Learn more →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

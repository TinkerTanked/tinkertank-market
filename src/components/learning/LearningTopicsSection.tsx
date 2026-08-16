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
    <section className={`py-20 lg:py-24 ${className}`}>
      <div className='container-custom'>
        <div className='mb-12 max-w-3xl space-y-4'>
          <p className='section-kicker'>Skills for a changing world</p>
          <h2 className='font-display text-3xl font-bold tracking-tight text-slate-950 md:text-4xl'>{heading}</h2>
          <p className='text-lg leading-relaxed text-slate-600'>{description}</p>
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
          {learningTopics.map((topic, index) => (
            <Link
              key={topic.slug}
              href={`/${topic.slug}`}
              className='group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md'
            >
              <span className='font-display text-3xl font-bold text-primary-500 transition-colors group-hover:text-primary-700'>0{index + 1}</span>
              <h3 className='mt-6 font-display text-lg font-semibold text-slate-950'>{topic.navLabel}</h3>
              <p className='mt-3 flex-1 text-sm leading-relaxed text-slate-600'>{topic.shortDescription}</p>
              <span className='mt-5 inline-block text-sm font-semibold text-primary-700'>Explore topic →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

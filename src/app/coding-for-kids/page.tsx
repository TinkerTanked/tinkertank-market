import { Metadata } from 'next'
import TopicLandingPage from '@/components/learning/TopicLandingPage'
import { getLearningTopic } from '@/data/learningTopics'
import { createLearningTopicMetadata } from '@/lib/learning-topic-seo'

const topic = getLearningTopic('coding-for-kids')

export const metadata: Metadata = createLearningTopicMetadata(topic)

export default function CodingForKidsPage() {
  return (
    <TopicLandingPage topic={topic}>
      <section className='border-y border-slate-200 bg-white py-20'>
        <div className='container-custom'>
          <div className='mx-auto max-w-3xl text-center'>
            <p className='font-semibold uppercase tracking-wide text-primary-700'>Creative coding pathways</p>
            <h2 className='mt-3 font-display text-3xl font-bold text-gray-900 md:text-4xl'>Minecraft, Scratch & AI Coding for Kids</h2>
            <p className='mt-5 text-lg leading-8 text-gray-600'>
              Children use familiar creative environments to understand how games, stories and interactive worlds are built. Activities are
              adapted to their age and experience, so beginners can start confidently while returning coders take on deeper challenges.
            </p>
          </div>

          <div className='mt-12 grid gap-6 md:grid-cols-3'>
            <CodingPathway
              title='Minecraft projects'
              description='Use planning, logic and coding concepts to create interactive challenges inspired by a world children already understand.'
            />
            <CodingPathway
              title='Scratch game creation'
              description='Build playable games and animated stories while learning sequences, events, variables and debugging through experimentation.'
            />
            <CodingPathway
              title='Age-appropriate AI'
              description='Explore how creative AI tools work, where they are useful and why thoughtful instructions, testing and responsible use matter.'
            />
          </div>

          <p className='mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-gray-500'>
            Platforms and projects vary by program, session and age group. Contact us if your child is looking for a particular coding
            experience.
          </p>
        </div>
      </section>
    </TopicLandingPage>
  )
}

function CodingPathway({ title, description }: { title: string; description: string }) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-slate-50 p-6'>
      <h3 className='font-display text-xl font-semibold text-gray-900'>{title}</h3>
      <p className='mt-3 leading-7 text-gray-600'>{description}</p>
    </div>
  )
}

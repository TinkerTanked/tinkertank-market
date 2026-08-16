import type { Metadata } from 'next'
import type { LearningTopic } from '@/data/learningTopics'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export function createLearningTopicMetadata(topic: LearningTopic): Metadata {
  const url = `${baseUrl}/${topic.slug}`
  const description = `${topic.shortDescription} Explore TinkerTank camps, weekly classes, parties and school programs for ages 5-16.`

  return {
    title: topic.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: topic.title,
      description: topic.shortDescription,
      url,
      type: 'website',
      images: [{ url: `${baseUrl}${topic.image}`, alt: topic.imageAlt }]
    }
  }
}

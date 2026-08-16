import { Metadata } from 'next'
import TopicLandingPage from '@/components/learning/TopicLandingPage'
import { getLearningTopic } from '@/data/learningTopics'
import { createLearningTopicMetadata } from '@/lib/learning-topic-seo'

const topic = getLearningTopic('3d-design-printing-for-kids')

export const metadata: Metadata = createLearningTopicMetadata(topic)

export default function ThreeDimensionalDesignPrintingPage() {
  return <TopicLandingPage topic={topic} />
}

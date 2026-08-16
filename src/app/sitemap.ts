import { MetadataRoute } from 'next'
import { products } from '@/data/products'
import { learningTopics } from '@/data/learningTopics'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1.0
    },
    {
      url: `${baseUrl}/camps`,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/birthdays`,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/schools`,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/what-kids-learn`,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/ignite`,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/calendar`,
      changeFrequency: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/locations/neutral-bay`,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/areas/northern-beaches`,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/catalog`,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/faq`,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/child-safety`,
      changeFrequency: 'yearly',
      priority: 0.5
    }
  ]

  const campPages: MetadataRoute.Sitemap = products
    .filter(p => p.category === 'camps')
    .map(product => ({
      url: `${baseUrl}/camps/${product.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))

  const birthdayPages: MetadataRoute.Sitemap = products
    .filter(p => p.category === 'birthdays')
    .map(product => ({
      url: `${baseUrl}/birthdays/${product.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))

  const ignitePages: MetadataRoute.Sitemap = products
    .filter(p => p.category === 'subscriptions')
    .map(product => ({
      url: `${baseUrl}/ignite/${product.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))

  const topicPages: MetadataRoute.Sitemap = learningTopics.map(topic => ({
    url: `${baseUrl}/${topic.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8
  }))

  return [...staticPages, ...topicPages, ...campPages, ...birthdayPages, ...ignitePages]
}

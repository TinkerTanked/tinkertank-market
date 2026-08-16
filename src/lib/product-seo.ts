import type { Metadata } from 'next'
import type { Product } from '@/types/products'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

const categoryDetails = {
  camps: {
    segment: 'camps',
    titleSuffix: 'School Holiday STEAM Camp',
    label: 'Camp'
  },
  birthdays: {
    segment: 'birthdays',
    titleSuffix: 'Kids Birthday Party in Sydney',
    label: 'Birthday Parties'
  },
  subscriptions: {
    segment: 'ignite',
    titleSuffix: 'Weekly Coding & Robotics Program',
    label: 'Ignite Programs'
  }
} as const

export type SeoProductCategory = keyof typeof categoryDetails

export function getProductLandingDetails(product: Product, category: SeoProductCategory) {
  if (product.category !== category) return null

  const details = categoryDetails[category]
  const url = `${baseUrl}/${details.segment}/${product.id}`
  const image = product.images[0] ? `${baseUrl}${product.images[0]}` : `${baseUrl}/images/home-hero.jpg`

  return { ...details, url, image }
}

export function createProductMetadata(product: Product, category: SeoProductCategory): Metadata {
  const details = getProductLandingDetails(product, category)
  if (!details) return {}

  const title = `${product.name} - ${details.titleSuffix}`
  const description = `${product.shortDescription}. For ages ${product.ageRange} in ${product.location}. View program details and book with TinkerTank.`

  return {
    title,
    description,
    alternates: {
      canonical: details.url
    },
    openGraph: {
      type: 'website',
      title: `${title} | TinkerTank`,
      description,
      url: details.url,
      images: [
        {
          url: details.image,
          alt: product.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | TinkerTank`,
      description,
      images: [details.image]
    }
  }
}

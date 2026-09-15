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

const productMetadataOverrides: Record<string, { title: string; description: string }> = {
  'coding-party': {
    title: 'Kids Coding Party Sydney - Minecraft & Scratch',
    description:
      'Book a hands-on coding birthday party with Minecraft, Scratch and age-appropriate AI activities. Two hours for ages 6+ at Neutral Bay or your Sydney venue.'
  },
  'in-school-ignite': {
    title: 'Coding & Robotics Programs for Sydney Schools',
    description:
      'Bring weekly coding, robotics and STEAM learning to your Sydney school. TinkerTank supplies experienced facilitators, equipment and age-appropriate projects.'
  },
  'drop-off-ignite': {
    title: 'After-School Coding & Robotics Neutral Bay',
    description:
      'Weekly after-school coding, robotics and STEAM classes for ages 5-16 at the TinkerTank Neutral Bay studio, with equipment and project support included.'
  },
  'school-pickup-ignite': {
    title: 'School Pickup & STEAM Program Neutral Bay',
    description:
      'Combine selected school pickup with weekly coding, robotics and STEAM learning at TinkerTank Neutral Bay. Explore current schools, sessions and availability.'
  }
}

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

  const metadataOverride = productMetadataOverrides[product.id]
  const title = metadataOverride?.title || `${product.name} - ${details.titleSuffix}`
  const description =
    metadataOverride?.description ||
    `${product.shortDescription}. For ages ${product.ageRange} in ${product.location}. View program details and book with TinkerTank.`

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

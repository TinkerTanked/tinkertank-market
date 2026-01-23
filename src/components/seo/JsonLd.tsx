import { Product } from '@/types/product'

interface OrganizationJsonLdProps {
  name?: string
  url?: string
  logo?: string
}

export function OrganizationJsonLd({
  name = 'TinkerTank',
  url = 'https://tinkertank.rocks',
  logo = 'https://tinkertank.rocks/logo.png'
}: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name,
    url,
    logo,
    description: 'STEAM education programs for kids including camps, birthday parties, and weekly programs',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Neutral Bay',
      addressRegion: 'NSW',
      addressCountry: 'AU'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@tinkertank.rocks'
    },
    sameAs: ['https://www.facebook.com/tinkertank', 'https://www.instagram.com/tinkertank']
  }

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

interface EventJsonLdProps {
  name: string
  description: string
  startDate?: string
  endDate?: string
  location?: string
  price: number
  currency?: string
  url: string
  image?: string
}

export function EventJsonLd({
  name,
  description,
  startDate,
  endDate,
  location = 'TinkerTank, Neutral Bay, NSW',
  price,
  currency = 'AUD',
  url,
  image
}: EventJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    location: {
      '@type': 'Place',
      name: 'TinkerTank',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Neutral Bay',
        addressRegion: 'NSW',
        addressCountry: 'AU'
      }
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url
    },
    organizer: {
      '@type': 'Organization',
      name: 'TinkerTank',
      url: 'https://tinkertank.rocks'
    },
    ...(image && { image })
  }

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

interface ProductJsonLdProps {
  product: Product
  url: string
}

export function ProductJsonLd({ product, url }: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    ...(product.imageUrl && { image: product.imageUrl }),
    offers: {
      '@type': 'Offer',
      price: product.pricing.basePrice,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      url
    },
    brand: {
      '@type': 'Organization',
      name: 'TinkerTank'
    },
    category: product.type
  }

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

interface FAQJsonLdProps {
  questions: Array<{ question: string; answer: string }>
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer
      }
    }))
  }

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

interface LocalBusinessJsonLdProps {
  name?: string
  url?: string
}

export function LocalBusinessJsonLd({ name = 'TinkerTank', url = 'https://tinkertank.rocks' }: LocalBusinessJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name,
    url,
    description: 'STEAM education programs for kids aged 5-16',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Neutral Bay',
      addressLocality: 'Sydney',
      addressRegion: 'NSW',
      postalCode: '2089',
      addressCountry: 'AU'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -33.8347,
      longitude: 151.2167
    },
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00'
      }
    ]
  }

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

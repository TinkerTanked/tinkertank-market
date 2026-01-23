import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/', '/cart', '/debug/', '/demo/']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  }
}

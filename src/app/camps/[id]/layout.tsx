import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductById } from '@/data/products'
import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/seo/JsonLd'
import { createProductMetadata, getProductLandingDetails } from '@/lib/product-seo'

interface CampLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CampLayoutProps): Promise<Metadata> {
  const { id } = await params
  const product = getProductById(id)

  return product ? createProductMetadata(product, 'camps') : {}
}

export default async function CampLayout({ children, params }: CampLayoutProps) {
  const { id } = await params
  const product = getProductById(id)
  const details = product && getProductLandingDetails(product, 'camps')

  if (!product || !details) notFound()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://tinkertank.rocks' },
          { name: 'Camps', url: 'https://tinkertank.rocks/camps' },
          { name: product.name, url: details.url }
        ]}
      />
      <ProductJsonLd product={product} url={details.url} />
      {children}
    </>
  )
}

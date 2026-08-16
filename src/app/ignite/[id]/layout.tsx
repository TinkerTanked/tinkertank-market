import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductById } from '@/data/products'
import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/seo/JsonLd'
import { createProductMetadata, getProductLandingDetails } from '@/lib/product-seo'

interface IgniteLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: IgniteLayoutProps): Promise<Metadata> {
  const { id } = await params
  const product = getProductById(id)

  return product ? createProductMetadata(product, 'subscriptions') : {}
}

export default async function IgniteLayout({ children, params }: IgniteLayoutProps) {
  const { id } = await params
  const product = getProductById(id)
  const details = product && getProductLandingDetails(product, 'subscriptions')

  if (!product || !details) notFound()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://tinkertank.rocks' },
          { name: 'Ignite Programs', url: 'https://tinkertank.rocks/ignite' },
          { name: product.name, url: details.url }
        ]}
      />
      <ProductJsonLd product={product} url={details.url} />
      {children}
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductById } from '@/data/products'
import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/seo/JsonLd'
import { createProductMetadata, getProductLandingDetails } from '@/lib/product-seo'

interface BirthdayLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: BirthdayLayoutProps): Promise<Metadata> {
  const { id } = await params
  const product = getProductById(id)

  return product ? createProductMetadata(product, 'birthdays') : {}
}

export default async function BirthdayLayout({ children, params }: BirthdayLayoutProps) {
  const { id } = await params
  const product = getProductById(id)
  const details = product && getProductLandingDetails(product, 'birthdays')

  if (!product || !details) notFound()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://tinkertank.rocks' },
          { name: 'Birthday Parties', url: 'https://tinkertank.rocks/birthdays' },
          { name: product.name, url: details.url }
        ]}
      />
      <ProductJsonLd product={product} url={details.url} />
      {children}
    </>
  )
}

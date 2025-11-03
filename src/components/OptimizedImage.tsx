import { memo } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
}: OptimizedImageProps) {
  const imageProps = {
    src,
    alt,
    className,
    priority,
    ...(fill ? { fill } : { width, height }),
    ...(sizes && { sizes }),
  }

  return <Image {...imageProps} />
})

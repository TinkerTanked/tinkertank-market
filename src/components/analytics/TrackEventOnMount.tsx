'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

export default function TrackEventOnMount({ name, parameters }: { name: string; parameters: Record<string, unknown> }) {
  const initialEvent = useRef({ name, parameters })

  useEffect(() => {
    trackEvent(initialEvent.current.name, initialEvent.current.parameters)
  }, [])

  return null
}

'use client'

import { useEffect, useRef, useState } from 'react'
import type { CircleMarker, Map, Polyline } from 'leaflet'
import { MapPinIcon } from '@heroicons/react/24/outline'
import 'leaflet/dist/leaflet.css'

const destination = { latitude: -33.8322377, longitude: 151.2229526 }

type RouteResponse = {
  code: string
  routes: Array<{
    distance: number
    duration: number
    geometry: { coordinates: [number, number][] }
  }>
}

export default function LocationMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const routeRef = useRef<Polyline | null>(null)
  const originRef = useRef<CircleMarker | null>(null)
  const [status, setStatus] = useState<'idle' | 'locating' | 'route' | 'location-error' | 'route-error'>('idle')
  const [routeSummary, setRouteSummary] = useState('')
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    let disposed = false

    const createMap = async () => {
      const L = await import('leaflet')
      if (disposed || !mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [destination.latitude, destination.longitude],
        zoom: 16,
        zoomControl: false
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19
      }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.circleMarker([destination.latitude, destination.longitude], {
        radius: 10,
        color: '#ffffff',
        weight: 3,
        fillColor: '#0066cc',
        fillOpacity: 1
      })
        .bindTooltip('TinkerTank', { permanent: true, direction: 'top', offset: [0, -12] })
        .addTo(map)

      mapRef.current = map
      setIsMapReady(true)
    }

    void createMap()
    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  const showDirections = () => {
    if (!navigator.geolocation) {
      setStatus('location-error')
      return
    }

    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const origin = { latitude: position.coords.latitude, longitude: position.coords.longitude }
          const routeUrl = new URL(
            `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
          )
          routeUrl.searchParams.set('overview', 'full')
          routeUrl.searchParams.set('geometries', 'geojson')

          const response = await fetch(routeUrl)
          if (!response.ok) throw new Error('Route request failed')
          const data = (await response.json()) as RouteResponse
          const route = data.routes[0]
          const map = mapRef.current
          if (data.code !== 'Ok' || !route || !map) throw new Error('Route unavailable')

          const L = await import('leaflet')
          routeRef.current?.remove()
          originRef.current?.remove()

          routeRef.current = L.polyline(
            route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
            { color: '#0066cc', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }
          ).addTo(map)
          originRef.current = L.circleMarker([origin.latitude, origin.longitude], {
            radius: 8,
            color: '#ffffff',
            weight: 3,
            fillColor: '#f97316',
            fillOpacity: 1
          })
            .bindTooltip('You are here', { direction: 'top', offset: [0, -10] })
            .addTo(map)

          map.fitBounds(routeRef.current.getBounds(), { padding: [32, 32] })
          setRouteSummary(`About ${Math.max(1, Math.round(route.duration / 60))} min by car · ${(route.distance / 1000).toFixed(1)} km`)
          setStatus('route')
        } catch {
          setStatus('route-error')
        }
      },
      () => setStatus('location-error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  return (
    <div className='card grid overflow-hidden lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]'>
      <div className='flex flex-col justify-center p-6 sm:p-10'>
        <MapPinIcon className='mb-5 h-10 w-10 text-primary-600' />
        <p className='section-kicker'>Visit the studio</p>
        <h2 className='mt-2 text-3xl font-display font-bold text-gray-900'>Find us in Neutral Bay</h2>
        <address className='mt-5 text-lg not-italic text-gray-700'>
          50 Yeo Street<br />
          Neutral Bay NSW 2089
        </address>
        <p className='mt-3 text-gray-600'>Our purpose-built studio is on Yeo Street, north of the Sydney Harbour Bridge.</p>
        <div className='mt-7'>
          <button type='button' onClick={showDirections} disabled={!isMapReady || status === 'locating'} className='btn-primary w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto'>
            {!isMapReady ? 'Loading map…' : status === 'locating' ? 'Finding your location…' : status === 'route' ? 'Refresh route from my location' : 'Show directions from my location'}
          </button>
          <p className='mt-2 text-sm text-gray-500'>Your browser will ask permission. Your location is used only to calculate the route and is not stored by TinkerTank.</p>
          {status === 'route' && <p role='status' className='mt-3 text-sm font-semibold text-green-700'>{routeSummary}</p>}
          {status === 'location-error' && (
            <p role='status' className='mt-2 text-sm font-medium text-red-700'>
              We couldn&apos;t access your location. You can still explore the studio location on the map.
            </p>
          )}
          {status === 'route-error' && (
            <p role='status' className='mt-2 text-sm font-medium text-red-700'>
              We found your location but couldn&apos;t calculate a route. Please try again.
            </p>
          )}
        </div>
      </div>
      <div
        ref={mapContainerRef}
        role='region'
        aria-label={status === 'route' ? 'Driving route from your location to TinkerTank Neutral Bay' : 'Map showing TinkerTank at 50 Yeo Street, Neutral Bay'}
        className='h-[360px] w-full bg-slate-200 lg:h-full lg:min-h-[480px]'
      />
    </div>
  )
}

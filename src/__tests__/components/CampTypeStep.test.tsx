/**
 * CampTypeStep Component Tests
 *
 * Tests location-specific camp type availability:
 * - Neutral Bay: regular camps only (Day Camp, All Day Camp)
 * - Reddam House: regular camps for 1-2 dates, bundles only for 3 dates
 * - Manly Library: regular camps only
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CampTypeStep from '@/components/booking/CampTypeStep'

vi.mock('@/data/locationAvailability', () => ({
  getAvailableCampTypes: vi.fn((locationName: string) => {
    return ['day', 'allday']
  })
}))

const mockOnCampTypeSelect = vi.fn()

const neutralBayLocation = { id: 'neutral-bay', name: 'TinkerTank Neutral Bay', address: '123 Main St' }
const reddamHouseLocation = { id: 'reddam-house', name: 'Reddam House', address: '456 School Rd' }
const manlyLibraryLocation = { id: 'manly-library', name: 'Manly Library', address: '789 Beach Ave' }

describe('CampTypeStep Component', () => {
  describe('Neutral Bay Location', () => {
    it('shows only regular camps with 1 date selected', () => {
      render(
        <CampTypeStep
          selectedCampType={null}
          onCampTypeSelect={mockOnCampTypeSelect}
          date={new Date('2026-04-15')}
          location={neutralBayLocation}
          selectedDateCount={1}
        />
      )

      expect(screen.getByRole('heading', { name: 'Day Camp' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'All Day Camp' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'All Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
    })

    it('shows only regular camps with 3 dates selected (no bundles)', () => {
      render(
        <CampTypeStep
          selectedCampType={null}
          onCampTypeSelect={mockOnCampTypeSelect}
          date={new Date('2026-04-15')}
          location={neutralBayLocation}
          selectedDateCount={3}
        />
      )

      expect(screen.getByRole('heading', { name: 'Day Camp' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'All Day Camp' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'All Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
    })
  })

  describe('Reddam House Location', () => {
    it('shows regular camps with 1 date selected', () => {
      render(
        <CampTypeStep
          selectedCampType={null}
          onCampTypeSelect={mockOnCampTypeSelect}
          date={new Date('2026-04-20')}
          location={reddamHouseLocation}
          selectedDateCount={1}
        />
      )

      expect(screen.getByRole('heading', { name: 'Day Camp' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'All Day Camp' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'All Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
    })

    it('shows regular camps with 2 dates selected', () => {
      render(
        <CampTypeStep
          selectedCampType={null}
          onCampTypeSelect={mockOnCampTypeSelect}
          date={new Date('2026-04-20')}
          location={reddamHouseLocation}
          selectedDateCount={2}
        />
      )

      expect(screen.getByRole('heading', { name: 'Day Camp' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'All Day Camp' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'All Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
    })

    it('shows ONLY bundles with 3 dates selected (no regular camps)', () => {
      render(
        <CampTypeStep
          selectedCampType={null}
          onCampTypeSelect={mockOnCampTypeSelect}
          date={new Date('2026-04-20')}
          location={reddamHouseLocation}
          selectedDateCount={3}
        />
      )

      expect(screen.getByRole('heading', { name: 'Day Camp 3-Day Bundle' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'All Day Camp 3-Day Bundle' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Day Camp' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'All Day Camp' })).not.toBeInTheDocument()
    })
  })

  describe('Bundle Pricing and Badges', () => {
    it('shows correct bundle prices', () => {
      render(
        <CampTypeStep
          selectedCampType={null}
          onCampTypeSelect={mockOnCampTypeSelect}
          date={new Date('2026-04-20')}
          location={reddamHouseLocation}
          selectedDateCount={3}
        />
      )

      expect(screen.getByText('$299.99')).toBeInTheDocument()
      expect(screen.getByText('$399.99')).toBeInTheDocument()
    })

    it('shows BEST VALUE badge on bundle cards', () => {
      render(
        <CampTypeStep
          selectedCampType={null}
          onCampTypeSelect={mockOnCampTypeSelect}
          date={new Date('2026-04-20')}
          location={reddamHouseLocation}
          selectedDateCount={3}
        />
      )

      const bestValueBadges = screen.getAllByText('BEST VALUE')
      expect(bestValueBadges).toHaveLength(2)
    })
  })

  describe('Manly Library Location', () => {
    it('shows only regular camps with any date count', () => {
      render(
        <CampTypeStep
          selectedCampType={null}
          onCampTypeSelect={mockOnCampTypeSelect}
          date={new Date('2026-04-14')}
          location={manlyLibraryLocation}
          selectedDateCount={3}
        />
      )

      expect(screen.getByRole('heading', { name: 'Day Camp' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'All Day Camp' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'All Day Camp 3-Day Bundle' })).not.toBeInTheDocument()
    })
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BookCampButton from '@/components/ui/BookCampButton'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

describe('BookCampButton', () => {
  beforeEach(() => {
    push.mockClear()
    window.history.replaceState(
      {},
      '',
      '/camps?utm_source=meta&utm_medium=paid_social&utm_campaign=spring_camps_2026&utm_content=wk8_robotics_feed'
    )
  })

  it('preserves paid campaign attribution when booking starts', () => {
    render(<BookCampButton initialLocationId='manly-library' trackingSource='camps_location_card' />)

    fireEvent.click(screen.getByRole('button', { name: 'Book Camp' }))

    expect(push).toHaveBeenCalledWith(
      '/book/camps?source=camps_location_card&location=manly-library&utm_source=meta&utm_medium=paid_social&utm_campaign=spring_camps_2026&utm_content=wk8_robotics_feed'
    )
  })
})

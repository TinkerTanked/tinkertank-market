import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BirthdayTimeStep from '@/components/booking/BirthdayTimeStep'

describe('BirthdayTimeStep', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('disables birthday slots already booked at any location', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ unavailableStartTimes: ['15:30'] })
    }))
    const onTimeSlotSelect = vi.fn()

    render(
      <BirthdayTimeStep
        selectedDate={new Date(2026, 8, 19)}
        selectedTimeSlot={null}
        onTimeSlotSelect={onTimeSlotSelect}
      />
    )

    expect(await screen.findByText('Booked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Late Afternoon/ })).toBeDisabled()
    expect(fetch).toHaveBeenCalledWith('/api/birthday-availability?date=2026-09-19', expect.objectContaining({ cache: 'no-store' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Early Afternoon/ })).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button', { name: /Early Afternoon/ }))
    expect(onTimeSlotSelect).toHaveBeenCalledWith('1:00 PM - 3:00 PM')
  })
})

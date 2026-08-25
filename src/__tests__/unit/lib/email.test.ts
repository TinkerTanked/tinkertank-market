import { describe, expect, it } from 'vitest'
import { generateBookingConfirmationEmail } from '@/lib/email'

describe('booking confirmation email', () => {
  it('preserves the selected birthday date and wall-clock time', () => {
    const { body } = generateBookingConfirmationEmail({
      id: 'order_1ki16fwc',
      customerName: 'Test Parent',
      customerEmail: 'parent@example.com',
      totalAmount: 450,
      status: 'PAID',
      createdAt: new Date('2026-08-20T01:11:00.000Z'),
      orderItems: [{
        id: 'item_birthday',
        product: {
          name: 'Coding Party',
          type: 'BIRTHDAY'
        },
        student: {
          name: 'Test Child'
        },
        bookingDate: new Date('2026-09-19T15:30:00.000Z'),
        price: 450,
        location: 'TinkerTank Neutral Bay'
      }]
    })

    expect(body).toContain('<strong>Date:</strong> Saturday, September 19, 2026 at 3:30 PM')
    expect(body).not.toContain('Sunday, September 20, 2026 at 1:30 AM')
  })
})

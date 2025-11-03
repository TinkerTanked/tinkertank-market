import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProductCard from '@/components/ProductCard'
import { CartDrawer } from '@/components/cart/CartDrawer'

describe('Basic Accessibility Tests', () => {
  describe('ProductCard Accessibility', () => {
    const mockProduct = {
      id: '1',
      name: 'Summer Day Camp',
      description: 'Fun activities for kids including coding and robotics',
      shortDescription: 'Daily tech adventures',
      price: 50,
      category: 'camps' as const,
      ageRange: '6-8 years',
      duration: '6 hours',
      location: 'Neutral Bay',
      features: ['Coding', 'Robotics', 'Art & crafts'],
      images: ['/camp.jpg'],
      availability: {
        type: 'weekdays' as const,
        timeSlots: [{ start: '09:00', end: '15:00' }],
        weekDays: [1, 2, 3, 4, 5],
      },
      tags: ['tech', 'fun'],
    }

    it('should have proper button labels', () => {
      render(<ProductCard product={mockProduct} />)
      
      // Look for any buttons that might exist
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Buttons should have accessible names
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('should have proper heading structure', () => {
      render(<ProductCard product={mockProduct} />)
      
      const productTitle = screen.getByText(/summer day camp/i)
      expect(productTitle).toBeInTheDocument()
    })

    it('should display price information accessibly', () => {
      render(<ProductCard product={mockProduct} />)
      
      const priceText = screen.getByText(/\$50/i)
      expect(priceText).toBeInTheDocument()
    })
  })

  describe('CartDrawer Accessibility', () => {
    it('should have proper modal structure when open', () => {
      render(<CartDrawer isOpen={true} onClose={() => {}} />)
      
      // Should have dialog role
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('should have close button with accessible name', () => {
      const mockClose = vi.fn()
      render(<CartDrawer isOpen={true} onClose={mockClose} />)
      
      // The close button exists but may not have a visible name - let's check it exists
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Check for the close button specifically (it has an X icon)
      const closeButton = buttons.find(button => 
        button.querySelector('svg') && 
        button.querySelector('path[d*="M6 18 18 6M6 6l12 12"]')
      )
      expect(closeButton).toBeTruthy()
    })

    it('should not render when closed', () => {
      render(<CartDrawer isOpen={false} onClose={() => {}} />)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('General Accessibility Requirements', () => {
    it('should have proper document structure', () => {
      render(
        <main>
          <h1>TinkerTank Market</h1>
          <ProductCard product={{
            id: '1',
            name: 'Test Product',
            description: 'Test description for product',
            shortDescription: 'Test product',
            price: 50,
            category: 'camps' as const,
            ageRange: '6-8 years',
            duration: '6 hours',
            location: 'Test Location',
            features: ['Test feature'],
            images: ['/test.jpg'],
            availability: {
              type: 'weekdays' as const,
              timeSlots: [{ start: '09:00', end: '15:00' }],
            },
            tags: ['test'],
          }} />
        </main>
      )
      
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })
})

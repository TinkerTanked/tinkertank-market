import { test, expect, Page } from '@playwright/test'

class CartPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  async addProductToCart(productName: string) {
    await this.page.getByText(productName).click()
    await this.page.getByRole('button', { name: 'Add to Cart' }).click()
  }

  async openCart() {
    await this.page.getByRole('button', { name: 'Shopping cart' }).click()
  }

  async closeCart() {
    await this.page.getByRole('button', { name: /close/i }).click()
  }

  async getCartItemCount() {
    const badge = this.page.locator('[data-testid="cart-badge"]')
    return await badge.textContent()
  }

  async addStudentToItem(studentData: {
    firstName: string
    lastName: string
    age: string
    parentName: string
    parentEmail: string
    parentPhone: string
  }) {
    await this.page.getByText('Add Student').click()
    await this.page.getByLabel('First Name').fill(studentData.firstName)
    await this.page.getByLabel('Last Name').fill(studentData.lastName)
    await this.page.getByLabel('Age').fill(studentData.age)
    await this.page.getByLabel('Parent Name').fill(studentData.parentName)
    await this.page.getByLabel('Parent Email').fill(studentData.parentEmail)
    await this.page.getByLabel('Parent Phone').fill(studentData.parentPhone)
    await this.page.getByRole('button', { name: 'Add Student' }).click()
  }

  async updateQuantity(itemName: string, quantity: string) {
    const itemRow = this.page.locator(`[data-testid="cart-item-${itemName}"]`)
    await itemRow.getByLabel('Quantity').fill(quantity)
  }

  async removeItem(itemName: string) {
    const itemRow = this.page.locator(`[data-testid="cart-item-${itemName}"]`)
    await itemRow.getByRole('button', { name: /remove/i }).click()
  }

  async proceedToCheckout() {
    await this.page.getByRole('button', { name: 'Proceed to Checkout' }).click()
  }
}

test.describe('Cart UI Integration Tests', () => {
  let cartPage: CartPage

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page)
    await cartPage.goto()
  })

  test('should show empty cart initially', async ({ page }) => {
    await cartPage.openCart()
    
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await expect(page.getByText('Continue Shopping')).toBeVisible()
    await expect(page.getByText('Proceed to Checkout')).not.toBeVisible()
  })

  test('should add item to cart and show badge', async ({ page }) => {
    // Add product to cart
    await cartPage.addProductToCart('Summer Tech Camp')
    
    // Cart badge should appear with count
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1')
    
    // Open cart and verify item is there
    await cartPage.openCart()
    await expect(page.getByText('Summer Tech Camp')).toBeVisible()
    await expect(page.getByText('$150.00')).toBeVisible()
  })

  test('should update cart badge when adding multiple items', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.addProductToCart('Art & Craft Camp')
    
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('2')
  })

  test('should increment quantity when adding same product', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.addProductToCart('Summer Tech Camp')
    
    await cartPage.openCart()
    
    // Should show quantity 2 for the same product
    const quantityInput = page.getByLabel('Quantity')
    await expect(quantityInput).toHaveValue('2')
    await expect(page.getByText('$300.00')).toBeVisible() // 2 * $150
  })

  test('should update quantity manually', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    // Update quantity to 3
    await cartPage.updateQuantity('Summer Tech Camp', '3')
    
    // Verify price updates
    await expect(page.getByText('$450.00')).toBeVisible() // 3 * $150
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('3')
  })

  test('should remove item from cart', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    await cartPage.removeItem('Summer Tech Camp')
    
    // Cart should be empty
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await expect(page.locator('[data-testid="cart-badge"]')).not.toBeVisible()
  })

  test('should show cart summary with GST', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    // Check cart summary
    await expect(page.getByText('Subtotal:')).toBeVisible()
    await expect(page.getByText('$150.00')).toBeVisible()
    await expect(page.getByText('GST (10%):')).toBeVisible()
    await expect(page.getByText('$15.00')).toBeVisible()
    await expect(page.getByText('Total:')).toBeVisible()
    await expect(page.getByText('$165.00')).toBeVisible()
  })

  test('should require students for camp products', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    // Checkout button should be disabled
    const checkoutButton = page.getByRole('button', { name: 'Proceed to Checkout' })
    await expect(checkoutButton).toBeDisabled()
    
    // Should show error message
    await expect(page.getByText('1 more student(s) required')).toBeVisible()
  })

  test('should add student and enable checkout', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    // Add student
    await cartPage.addStudentToItem({
      firstName: 'Alice',
      lastName: 'Johnson',
      age: '10',
      parentName: 'Sarah Johnson',
      parentEmail: 'sarah@example.com',
      parentPhone: '+61-123-456-789',
    })
    
    // Student should appear in cart
    await expect(page.getByText('Alice Johnson')).toBeVisible()
    await expect(page.getByText('Age: 10')).toBeVisible()
    
    // Checkout button should be enabled
    const checkoutButton = page.getByRole('button', { name: 'Proceed to Checkout' })
    await expect(checkoutButton).toBeEnabled()
  })

  test('should validate student form', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    // Try to add student without required fields
    await page.getByText('Add Student').click()
    await page.getByRole('button', { name: 'Add Student' }).click()
    
    // Should show validation errors
    await expect(page.getByText('First name is required')).toBeVisible()
    await expect(page.getByText('Last name is required')).toBeVisible()
    await expect(page.getByText('Parent name is required')).toBeVisible()
    await expect(page.getByText('Parent email is required')).toBeVisible()
    await expect(page.getByText('Parent phone is required')).toBeVisible()
  })

  test('should validate age requirements', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp') // Age range 8-14
    await cartPage.openCart()
    
    // Try to add student too young
    await cartPage.addStudentToItem({
      firstName: 'Young',
      lastName: 'Kid',
      age: '6', // Below minimum age
      parentName: 'Parent Name',
      parentEmail: 'parent@example.com',
      parentPhone: '+61-123-456-789',
    })
    
    // Should show age validation error
    await expect(page.getByText('Student age must be between 8 and 14')).toBeVisible()
  })

  test('should handle multiple students for same item', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    // Update quantity to 2
    await cartPage.updateQuantity('Summer Tech Camp', '2')
    
    // Add first student
    await cartPage.addStudentToItem({
      firstName: 'Alice',
      lastName: 'Johnson',
      age: '10',
      parentName: 'Sarah Johnson',
      parentEmail: 'sarah@example.com',
      parentPhone: '+61-123-456-789',
    })
    
    // Should still show 1 more student required
    await expect(page.getByText('1 more student(s) required')).toBeVisible()
    
    // Add second student
    await cartPage.addStudentToItem({
      firstName: 'Bob',
      lastName: 'Smith',
      age: '12',
      parentName: 'Mike Smith',
      parentEmail: 'mike@example.com',
      parentPhone: '+61-987-654-321',
    })
    
    // Both students should be visible
    await expect(page.getByText('Alice Johnson')).toBeVisible()
    await expect(page.getByText('Bob Smith')).toBeVisible()
    
    // Checkout should be enabled
    const checkoutButton = page.getByRole('button', { name: 'Proceed to Checkout' })
    await expect(checkoutButton).toBeEnabled()
  })

  test('should persist cart across page reloads', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    await cartPage.addStudentToItem({
      firstName: 'Alice',
      lastName: 'Johnson',
      age: '10',
      parentName: 'Sarah Johnson',
      parentEmail: 'sarah@example.com',
      parentPhone: '+61-123-456-789',
    })
    
    // Reload page
    await page.reload()
    
    // Cart should still have items
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1')
    
    await cartPage.openCart()
    await expect(page.getByText('Summer Tech Camp')).toBeVisible()
    await expect(page.getByText('Alice Johnson')).toBeVisible()
  })

  test('should show warning for time conflicts', async ({ page }) => {
    // Add two camps for same date/time
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.addProductToCart('Art & Craft Camp')
    
    await cartPage.openCart()
    
    // Set same date and time for both items (if date/time selectors exist)
    // This would require additional UI elements in the cart
    
    // Add same student to both items
    await cartPage.addStudentToItem({
      firstName: 'Alice',
      lastName: 'Johnson',
      age: '10',
      parentName: 'Sarah Johnson',
      parentEmail: 'sarah@example.com',
      parentPhone: '+61-123-456-789',
    })
    
    // Switch to second item and add same student
    const secondItem = page.locator('[data-testid="cart-item-Art & Craft Camp"]')
    await secondItem.getByText('Add Student').click()
    
    await cartPage.addStudentToItem({
      firstName: 'Alice',
      lastName: 'Johnson',
      age: '10',
      parentName: 'Sarah Johnson',
      parentEmail: 'sarah@example.com',
      parentPhone: '+61-123-456-789',
    })
    
    // Should show warning about overlapping bookings
    await expect(page.getByText('overlapping bookings')).toBeVisible()
  })

  test('should handle cart drawer accessibility', async ({ page }) => {
    await cartPage.openCart()
    
    // Drawer should trap focus
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Should be able to navigate with keyboard
    await page.keyboard.press('Tab')
    await page.keyboard.press('Escape')
    
    // Drawer should close
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should clear entire cart', async ({ page }) => {
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.addProductToCart('Art & Craft Camp')
    
    await cartPage.openCart()
    
    // Click clear cart button
    await page.getByText('Clear Cart').click()
    
    // Confirm in dialog
    await page.getByRole('button', { name: 'Clear Cart' }).click()
    
    // Cart should be empty
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await expect(page.locator('[data-testid="cart-badge"]')).not.toBeVisible()
  })

  test('should show loading states', async ({ page }) => {
    // Mock slow network response
    await page.route('/api/cart/**', async (route) => {
      await page.waitForTimeout(1000) // Simulate slow response
      await route.fulfill({ status: 200, body: '{}' })
    })
    
    await cartPage.addProductToCart('Summer Tech Camp')
    
    // Should show loading indicator during operations
    await expect(page.getByText('Loading...')).toBeVisible()
  })

  test('should handle mobile responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    // Cart drawer should work on mobile
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Summer Tech Camp')).toBeVisible()
    
    // Should be able to interact with all elements
    const quantityInput = page.getByLabel('Quantity')
    await expect(quantityInput).toBeVisible()
    await expect(quantityInput).toBeEditable()
  })
})

test.describe('Cart Error Scenarios', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/cart/clear', async (route) => {
      await route.fulfill({ status: 500, body: 'Server Error' })
    })
    
    const cartPage = new CartPage(page)
    await cartPage.goto()
    
    await cartPage.addProductToCart('Summer Tech Camp')
    
    // Error should be handled gracefully without crashing
    await expect(page.getByText('Summer Tech Camp')).toBeVisible()
  })

  test('should handle network connectivity issues', async ({ page }) => {
    // Simulate offline
    await page.setOfflineMode(true)
    
    const cartPage = new CartPage(page)
    await cartPage.goto()
    
    // Cart should still work with cached data
    await cartPage.addProductToCart('Summer Tech Camp')
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1')
  })

  test('should validate quantity limits', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    
    await cartPage.addProductToCart('Summer Tech Camp')
    await cartPage.openCart()
    
    // Try to set quantity beyond capacity
    await cartPage.updateQuantity('Summer Tech Camp', '25') // Exceeds maxCapacity of 20
    
    // Should show error message
    await expect(page.getByText('exceeds maximum capacity')).toBeVisible()
    
    // Quantity should be capped or reset
    const quantityInput = page.getByLabel('Quantity')
    await expect(quantityInput).not.toHaveValue('25')
  })
})

import { test, expect, Page } from '@playwright/test'

// All 12 Ignite products with their Stripe price IDs
const IGNITE_PRODUCTS = {
  // In-School (green)
  'ignite-balgowlah-wed': {
    name: 'Balgowlah Heights Public',
    programType: 'in-school',
    day: 'Wednesday',
    time: '12:45pm - 1:45pm',
    price: 25.99,
    stripePriceId: 'price_1StKP9DqupgKyrhoQxEg01ua'
  },
  'ignite-balgowlah-thu': {
    name: 'Balgowlah Heights Public',
    programType: 'in-school',
    day: 'Thursday',
    time: '3:45pm - 5:15pm',
    price: 29.99,
    stripePriceId: 'price_1StKPADqupgKyrhoUmdMDcHc'
  },
  'ignite-ics-tue': {
    name: 'International Chinese School',
    programType: 'in-school',
    day: 'Tuesday',
    time: '4pm - 5:30pm',
    price: 30.99,
    stripePriceId: 'price_1StKPBDqupgKyrhoFBdlmoKk'
  },
  // Drop-Off (blue)
  'ignite-nb-monfri': {
    name: 'Neutral Bay Studio',
    programType: 'drop-off',
    day: 'Monday-Friday',
    time: '3:30pm - 5:30pm',
    price: 39.99,
    stripePriceId: 'price_1StKPCDqupgKyrho8MVv42fB'
  },
  'ignite-nb-sat': {
    name: 'Neutral Bay Studio',
    programType: 'drop-off',
    day: 'Saturday',
    time: '10am - 12pm',
    price: 39.99,
    stripePriceId: 'price_1StKPEDqupgKyrhomgKCSdXu'
  },
  'ignite-brookvale-cc': {
    name: 'Brookvale Community Centre',
    programType: 'drop-off',
    day: 'Monday',
    time: '3:30pm - 5:30pm',
    price: 39.99,
    stripePriceId: 'price_1StKPFDqupgKyrhoqs9xI4mj'
  },
  'ignite-manly-library': {
    name: 'Manly Creative Library',
    programType: 'drop-off',
    day: 'Wednesday',
    time: '3:30pm - 5:30pm',
    price: 39.99,
    stripePriceId: 'price_1StKPGDqupgKyrhoqKltUzlP'
  },
  // School Pickup (orange)
  'ignite-brookvale-ps': {
    name: 'Brookvale Public School',
    programType: 'school-pickup',
    day: 'Monday',
    time: '3pm - 5:30pm',
    price: 44.99,
    stripePriceId: 'price_1StKPHDqupgKyrhoDoXly8g2'
  },
  'ignite-manly-village': {
    name: 'Manly Village Public School',
    programType: 'school-pickup',
    day: 'Wednesday',
    time: '3pm - 5:30pm',
    price: 54.99,
    stripePriceId: 'price_1StKPIDqupgKyrhoYd0u5j2S'
  },
  'ignite-nb-ps': {
    name: 'Neutral Bay Public School',
    programType: 'school-pickup',
    day: 'Monday-Friday',
    time: '3pm - 5:30pm',
    price: 54.99,
    stripePriceId: 'price_1StKPKDqupgKyrho5L0t4yPu'
  },
  'ignite-redlands': {
    name: 'Redlands School',
    programType: 'school-pickup',
    day: 'Monday-Friday',
    time: '3pm - 5:30pm',
    price: 54.99,
    stripePriceId: 'price_1StKPLDqupgKyrhoXcJwf3Bp'
  },
  'ignite-stmarys': {
    name: 'St Marys Catholic School',
    programType: 'school-pickup',
    day: 'Wednesday',
    time: '3pm - 5:30pm',
    price: 54.99,
    stripePriceId: 'price_1StKPMDqupgKyrho5Yb1KWKj'
  }
}

// Test student data
const TEST_STUDENT = {
  firstName: 'Test',
  lastName: 'Student',
  dateOfBirth: '2015-05-15',
  school: 'Test Primary School',
  medicalInfo: '',
  emergencyContactName: 'Test Parent',
  emergencyContactPhone: '0400000000'
}

// Stripe test card
const STRIPE_TEST_CARD = {
  number: '4242424242424242',
  expiry: '12/28',
  cvc: '123'
}

test.describe('Ignite Booking Wizard UI', () => {
  test('should open wizard from Subscribe Now button on Ignite page', async ({ page }) => {
    await page.goto('/ignite')
    
    // Click Subscribe Now button
    await page.click('button:has-text("Subscribe Now")')
    
    // Verify wizard is open
    await expect(page.locator('text=Subscribe to Ignite')).toBeVisible()
    await expect(page.locator('text=Select Your Session')).toBeVisible()
  })

  test('should close wizard when clicking backdrop', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Click backdrop (the dark overlay)
    await page.click('.fixed.inset-0.bg-black', { position: { x: 10, y: 10 } })
    
    // Wizard should be closed
    await expect(page.locator('text=Subscribe to Ignite')).not.toBeVisible()
  })

  test('should show step progress indicator', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Verify step indicators
    await expect(page.locator('text=Select Session')).toBeVisible()
    await expect(page.locator('text=Student Info')).toBeVisible()
    await expect(page.locator('text=Confirm')).toBeVisible()
    await expect(page.locator('text=Step 1 of 3')).toBeVisible()
  })

  test('Next button should be disabled until session is selected', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Next button should be disabled
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeDisabled()
  })
})

test.describe('Session Selection', () => {
  test('should display all days with sessions', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Check day headers are visible
    await expect(page.locator('text=Monday')).toBeVisible()
    await expect(page.locator('text=Tuesday')).toBeVisible()
    await expect(page.locator('text=Wednesday')).toBeVisible()
    await expect(page.locator('text=Thursday')).toBeVisible()
    await expect(page.locator('text=Friday')).toBeVisible()
    await expect(page.locator('text=Saturday')).toBeVisible()
  })

  test('should display program type legend', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    await expect(page.locator('text=In-School')).toBeVisible()
    await expect(page.locator('text=Drop-Off Studio')).toBeVisible()
    await expect(page.locator('text=School Pickup')).toBeVisible()
  })

  test('should select In-School session and show summary', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Click on Balgowlah Heights session (Wednesday)
    await page.click('button:has-text("Balgowlah Heights Public")')
    
    // Verify selection summary appears
    await expect(page.locator('text=Selected Session')).toBeVisible()
    await expect(page.locator('text=$25.99').or(page.locator('text=$29.99'))).toBeVisible()
    
    // Next button should be enabled
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeEnabled()
  })

  test('should select Drop-Off session', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Click on Neutral Bay Studio session
    await page.click('button:has-text("Neutral Bay Studio")')
    
    await expect(page.locator('text=Selected Session')).toBeVisible()
    await expect(page.locator('button:has-text("Next")')).toBeEnabled()
  })

  test('should select School Pickup session', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Click on a School Pickup session
    await page.click('button:has-text("Brookvale Public School")')
    
    await expect(page.locator('text=Selected Session')).toBeVisible()
    await expect(page.locator('text=$44.99')).toBeVisible()
  })
})

test.describe('Student Info Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Select a session first
    await page.click('button:has-text("Neutral Bay Studio")')
    await page.click('button:has-text("Next")')
  })

  test('should show student info form on step 2', async ({ page }) => {
    await expect(page.locator('text=Student Information')).toBeVisible()
    await expect(page.locator('text=Step 2 of 3')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to proceed without filling form
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeDisabled()
  })

  test('should enable Next when form is complete', async ({ page }) => {
    // Fill in student info
    await page.fill('input[name="firstName"]', TEST_STUDENT.firstName)
    await page.fill('input[name="lastName"]', TEST_STUDENT.lastName)
    await page.fill('input[name="dateOfBirth"]', TEST_STUDENT.dateOfBirth)
    await page.fill('input[name="emergencyContactName"]', TEST_STUDENT.emergencyContactName)
    await page.fill('input[name="emergencyContactPhone"]', TEST_STUDENT.emergencyContactPhone)
    
    // Next button should be enabled
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeEnabled()
  })

  test('should navigate back to session selection', async ({ page }) => {
    await page.click('button:has-text("Back")')
    
    await expect(page.locator('text=Select Your Session')).toBeVisible()
    await expect(page.locator('text=Step 1 of 3')).toBeVisible()
  })
})

test.describe('Confirmation Step', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Step 1: Select session
    await page.click('button:has-text("Neutral Bay Studio")')
    await page.click('button:has-text("Next")')
    
    // Step 2: Fill student info
    await page.fill('input[name="firstName"]', TEST_STUDENT.firstName)
    await page.fill('input[name="lastName"]', TEST_STUDENT.lastName)
    await page.fill('input[name="dateOfBirth"]', TEST_STUDENT.dateOfBirth)
    await page.fill('input[name="emergencyContactName"]', TEST_STUDENT.emergencyContactName)
    await page.fill('input[name="emergencyContactPhone"]', TEST_STUDENT.emergencyContactPhone)
    await page.click('button:has-text("Next")')
  })

  test('should show confirmation details', async ({ page }) => {
    await expect(page.locator('text=Step 3 of 3')).toBeVisible()
    await expect(page.locator('text=Neutral Bay Studio')).toBeVisible()
    await expect(page.locator('text=Test Student')).toBeVisible()
    await expect(page.locator('text=$39.99')).toBeVisible()
  })

  test('should show subscription notice', async ({ page }) => {
    await expect(page.locator('text=weekly subscription')).toBeVisible()
  })

  test('should have Subscribe button', async ({ page }) => {
    await expect(page.locator('button:has-text("Subscribe")')).toBeVisible()
  })
})

test.describe('Complete Purchase Flow', () => {
  // Test one product from each program type
  const testProducts = [
    { id: 'ignite-balgowlah-wed', location: 'Balgowlah Heights Public', price: '$25.99' },
    { id: 'ignite-nb-monfri', location: 'Neutral Bay Studio', price: '$39.99' },
    { id: 'ignite-brookvale-ps', location: 'Brookvale Public School', price: '$44.99' }
  ]

  for (const product of testProducts) {
    test(`should complete purchase flow for ${product.location}`, async ({ page }) => {
      await page.goto('/ignite')
      await page.click('button:has-text("Subscribe Now")')
      
      // Step 1: Select session
      await page.click(`button:has-text("${product.location}")`)
      await expect(page.locator('text=Selected Session')).toBeVisible()
      await page.click('button:has-text("Next")')
      
      // Step 2: Fill student info
      await page.fill('input[name="firstName"]', TEST_STUDENT.firstName)
      await page.fill('input[name="lastName"]', TEST_STUDENT.lastName)
      await page.fill('input[name="dateOfBirth"]', TEST_STUDENT.dateOfBirth)
      await page.fill('input[name="emergencyContactName"]', TEST_STUDENT.emergencyContactName)
      await page.fill('input[name="emergencyContactPhone"]', TEST_STUDENT.emergencyContactPhone)
      await page.click('button:has-text("Next")')
      
      // Step 3: Confirm
      await expect(page.locator(`text=${product.location}`)).toBeVisible()
      await expect(page.locator(`text=${product.price}`)).toBeVisible()
      
      // Click Subscribe - this adds to cart
      await page.click('button:has-text("Subscribe")')
      
      // Wizard should close
      await expect(page.locator('text=Subscribe to Ignite')).not.toBeVisible()
    })
  }

  test('should add subscription to cart after completing wizard', async ({ page }) => {
    await page.goto('/ignite')
    await page.click('button:has-text("Subscribe Now")')
    
    // Complete the flow
    await page.click('button:has-text("Neutral Bay Studio")')
    await page.click('button:has-text("Next")')
    
    await page.fill('input[name="firstName"]', TEST_STUDENT.firstName)
    await page.fill('input[name="lastName"]', TEST_STUDENT.lastName)
    await page.fill('input[name="dateOfBirth"]', TEST_STUDENT.dateOfBirth)
    await page.fill('input[name="emergencyContactName"]', TEST_STUDENT.emergencyContactName)
    await page.fill('input[name="emergencyContactPhone"]', TEST_STUDENT.emergencyContactPhone)
    await page.click('button:has-text("Next")')
    
    await page.click('button:has-text("Subscribe")')
    
    // Navigate to cart and verify item is there
    await page.goto('/cart')
    await expect(page.locator('text=Neutral Bay Studio').or(page.locator('text=Drop-Off Studio Ignite'))).toBeVisible()
  })
})

test.describe('Ignite Detail Pages', () => {
  test('should open wizard from In-School Ignite detail page', async ({ page }) => {
    await page.goto('/ignite/in-school-ignite')
    
    await page.click('button:has-text("Subscribe Now")')
    
    await expect(page.locator('text=Subscribe to Ignite')).toBeVisible()
  })

  test('should open wizard from Drop-Off Ignite detail page', async ({ page }) => {
    await page.goto('/ignite/drop-off-ignite')
    
    await page.click('button:has-text("Subscribe Now")')
    
    await expect(page.locator('text=Subscribe to Ignite')).toBeVisible()
  })

  test('should open wizard from School Pickup detail page', async ({ page }) => {
    await page.goto('/ignite/school-pickup-ignite')
    
    await page.click('button:has-text("Subscribe Now")')
    
    await expect(page.locator('text=Subscribe to Ignite')).toBeVisible()
  })
})

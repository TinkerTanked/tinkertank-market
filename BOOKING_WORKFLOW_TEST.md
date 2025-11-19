# Camp Booking Workflow Test Report

## Test Environment
- URL: http://localhost:3000
- Date: Test to be performed
- Browser: To be specified

## Test Steps & Expected Behavior

### Step 1: Start Dev Server
```bash
npm run dev
```
**Expected**: Server starts on http://localhost:3000

---

### Step 2: Navigate to Camps Page
1. Go to http://localhost:3000/camps
2. Click on a camp (Day Camp or All Day Camp)

**Expected**: 
- Camp detail page loads
- "Select Date & Time" or similar booking button visible

---

### Step 3: Open Booking Wizard
Click "Select Date & Time" button

**Expected**:
- Modal opens with booking wizard
- Shows step 1 of 4: Location selection
- Progress indicator shows current step

---

### Step 4: Select Location (Step 1)
Select "Neutral Bay" location

**Expected**:
- Location is highlighted/selected
- "Next" button becomes enabled
- No console errors

**Data to check**:
```javascript
// In browser console
localStorage.getItem('enhanced-cart-storage')
```

---

### Step 5: Select Date (Step 2)
Click "Next", then select one or more dates from calendar

**Expected**:
- Calendar displays available dates
- Selected dates are highlighted
- Multi-select enabled (can select multiple dates)
- "Next" button enabled when at least one date selected

**Potential Issues**:
- Check if closure dates are properly excluded
- Verify date availability is correct

---

### Step 6: Select Camp Type (Step 3)
Click "Next", select camp type (Day Camp or All Day Camp)

**Expected**:
- Available camp types shown with pricing
- Selection highlights the chosen type
- "Next" button becomes enabled

**Data structure in wizard**:
```javascript
{
  location: { id, name, address },
  dates: [Date, Date, ...],
  campType: { id, type, name, price, duration, time }
}
```

---

### Step 7: Confirm & Add to Cart (Step 4)
Click "Next" to confirmation, then "Add to Cart"

**Expected**:
- Summary shows all selections
- "Add to Cart" button adds item to cart
- Modal closes
- Cart icon updates with item count

**Key Code**: `CampBookingWizard.tsx:78-109`
```typescript
const cartItem = {
  id: bookingData.campType.id,
  name: bookingData.campType.name,
  price: bookingData.campType.price,
  category: 'camps',
  type: 'CAMP',
  date: firstDate, // Only first date used!
  location: bookingData.location.name,
  // ...
}

addItem(cartItem, { 
  selectedDate: firstDate,
  selectedDates: bookingData.dates // All dates passed here
})
```

**⚠️ POTENTIAL ISSUE**: Only `firstDate` used in cart item, but `selectedDates` array passed in options.

---

### Step 8: View Cart
Navigate to http://localhost:3000/cart

**Expected**:
- Cart shows added item(s)
- Can add student information for each booking
- Cart summary shows subtotal, GST, total

**Data to Check**:
```javascript
// In browser console - check cart structure
const cart = JSON.parse(localStorage.getItem('enhanced-cart-storage') || '{}')
console.log('Cart items:', cart.state.items)

// Check each item structure
cart.state.items.forEach(item => {
  console.log('Item:', {
    id: item.id,
    product: item.product.name,
    quantity: item.quantity,
    selectedDate: item.selectedDate,
    selectedDates: item.selectedDates, // Should have multiple dates
    students: item.students,
    totalPrice: item.totalPrice
  })
})
```

---

### Step 9: Add Student Information
Fill in student details for each cart item:
- First Name
- Last Name
- Age
- Parent Name
- Parent Email
- Parent Phone
- Medical Info (optional)
- Allergies (optional)

**Expected**:
- Form validates required fields
- Age validated against product age range (6-12 for camps)
- Student data saved to cart item
- Can add multiple students per item

---

### Step 10: Proceed to Checkout
Click "Checkout" or "Proceed to Checkout" button

**Expected**:
- Redirects to `/checkout`
- Checkout form loads
- Cart summary visible

---

### Step 11: Fill Customer Information
Fill in checkout form:
- Full Name
- Email Address
- Phone Number

**Expected**:
- Form validates email format
- Phone requires 10+ characters
- All fields required

**⚠️ POTENTIAL ISSUE**: Hard-coded address in `CheckoutForm.tsx:88-93`:
```typescript
address: {
  line1: 'Address will be collected',
  city: 'Sydney',
  state: 'NSW',
  postal_code: '2000',
  country: 'AU',
}
```

---

### Step 12: Create Payment Intent ⚠️ CRITICAL STEP
Click "Continue to Payment" button

**Expected**:
1. Button shows "Creating Order..."
2. POST request to `/api/stripe/create-payment-intent`
3. Payment Element and Address Element appear
4. Button changes to "Pay $XXX.XX AUD"

**Request Payload** (`CheckoutForm.tsx:72-95`):
```json
{
  "items": [
    {
      "id": "cart-item-id",
      "productId": "product-id",
      "quantity": 1,
      "totalPrice": 0,
      "students": [...],
      "selectedDate": "2025-11-XX...",
      "selectedTimeSlot": { "startTime": "...", "endTime": "..." },
      "notes": "..."
    }
  ],
  "customerInfo": {
    "name": "...",
    "email": "...",
    "phone": "...",
    "address": {
      "line1": "Address will be collected",
      "city": "Sydney",
      "state": "NSW",
      "postal_code": "2000",
      "country": "AU"
    }
  }
}
```

**API Validation** (`create-payment-intent/route.ts:52-97`):
1. Validates schema with Zod
2. Fetches products from database
3. Validates product IDs exist and are active
4. **Recalculates totals server-side**
5. Validates client total matches server total (±$0.01)
6. Creates order items from students array
7. Adds 10% GST
8. Creates Stripe PaymentIntent
9. Creates pending Order in database

**Response**:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "orderId": "order-uuid",
  "paymentIntentId": "pi_xxx",
  "total": 0.00,
  "currency": "aud"
}
```

---

### Step 13: Console Errors to Check

**Open browser DevTools (F12) and check**:

1. **Network tab** - `/api/stripe/create-payment-intent`:
   - Status: Should be 200
   - Response: Contains `clientSecret`, `orderId`, `paymentIntentId`
   - Request body: Check if `students` array is populated
   - Request body: Check if `selectedDate` is valid ISO string

2. **Console tab** - Look for:
   - Stripe loading errors
   - "Failed to create payment intent" errors
   - Schema validation errors
   - "One or more products not found or inactive" (404)
   - "Price mismatch for product" (400)
   - Any React errors or warnings

3. **Application tab** - localStorage:
   - Check `enhanced-cart-storage`
   - Verify `items` array structure
   - Verify `students` array is populated

---

### Step 14: Common Issues & Debug Checks

#### Issue: "One or more products not found or inactive"
**Cause**: Product IDs in cart don't match database
**Check**:
```javascript
// In cart
const cart = JSON.parse(localStorage.getItem('enhanced-cart-storage') || '{}')
console.log('Product IDs:', cart.state.items.map(i => i.product.id))

// Compare with database
// Run in terminal: npm run prisma studio
// Or check with: npx prisma db seed
```

#### Issue: "Price mismatch for product"
**Cause**: Client-calculated price doesn't match server
**Check**:
```javascript
// In cart
cart.state.items.forEach(item => {
  const dateCount = item.selectedDates?.length || 1
  const expectedTotal = item.product.price * item.quantity * dateCount
  console.log({
    product: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    dateCount: dateCount,
    expectedTotal: expectedTotal,
    actualTotal: item.totalPrice,
    match: Math.abs(expectedTotal - item.totalPrice) < 0.01
  })
})
```

#### Issue: Payment Element doesn't appear
**Cause**: `paymentIntent` state not set
**Check**:
```javascript
// In browser console
// Should show PaymentElement after clicking "Continue to Payment"
document.querySelector('[data-testid="payment-element"]')
```

#### Issue: Students array is empty
**Cause**: Student info not added in cart
**Solution**: Must add student info in cart before checkout

---

### Step 15: Test Payment (Use Stripe Test Cards)

Once Payment Element appears, enter test card:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

Fill in billing address in Address Element

Click "Pay $XXX.XX AUD"

**Expected**:
1. Button shows "Processing Payment..."
2. Stripe confirms payment
3. POST to `/api/stripe/confirm-payment`
4. Redirects to `/checkout/processing`
5. PaymentStatusChecker polls for status
6. Eventually redirects to `/checkout/success`

---

## Critical Code Paths to Monitor

### 1. Cart → API Data Transformation
**File**: `CheckoutForm.tsx:73-82`
```typescript
items: items.map(item => ({
  id: item.id,
  productId: item.product.id, // Must match DB
  quantity: item.quantity,
  totalPrice: item.totalPrice, // Must match server calculation
  students: item.students, // Must be populated!
  selectedDate: item.selectedDate?.toISOString(),
  selectedTimeSlot: item.selectedTimeSlot,
  notes: item.notes,
}))
```

### 2. Server-Side Price Validation
**File**: `create-payment-intent/route.ts:71-81`
```typescript
const product = products.find(p => p.id === item.productId)!;
const expectedTotal = Number(product.price) * item.quantity;

if (Math.abs(expectedTotal - item.totalPrice) > 0.01) {
  return NextResponse.json(
    { error: `Price mismatch for product ${product.name}` },
    { status: 400 }
  );
}
```

### 3. Order Creation
**File**: `create-payment-intent/route.ts:140-161`
- Creates Order with `PENDING` status
- Creates OrderItems from student array
- Links to Stripe PaymentIntent

---

## Expected Console Output

### Successful Flow:
```
✓ Cart loaded: 1 items
✓ Payment intent created: pi_xxx
✓ Order created: order-uuid
✓ Payment confirmed
✓ Redirecting to success page
```

### Error Flow:
```
✗ Error creating payment intent: Price mismatch for product Day Camp
```
or
```
✗ Error creating payment intent: One or more products not found or inactive
```
or
```
✗ Students array is empty - please add student information
```

---

## Test Checklist

- [ ] Dev server running
- [ ] Database seeded with products
- [ ] Stripe API keys configured in `.env`
- [ ] Navigate to camps page
- [ ] Open booking wizard
- [ ] Select location
- [ ] Select date(s)
- [ ] Select camp type
- [ ] Add to cart successfully
- [ ] Cart shows correct item
- [ ] Add student information
- [ ] Student data saved to cart
- [ ] Proceed to checkout
- [ ] Fill customer info
- [ ] Click "Continue to Payment"
- [ ] Check Network tab for API call
- [ ] Check Console for errors
- [ ] Check request payload structure
- [ ] Payment Intent created (200 response)
- [ ] Payment Element appears
- [ ] Address Element appears
- [ ] Cart data correct in localStorage
- [ ] Product IDs match database
- [ ] Price calculation correct
- [ ] Students array populated

---

## Report Template

### Test Results

**Date**: ___________
**Browser**: ___________

**Step 1-7 (Booking Wizard)**: ☐ Pass ☐ Fail
- Issues: ___________

**Step 8-9 (Cart & Students)**: ☐ Pass ☐ Fail
- Issues: ___________

**Step 10-11 (Checkout Form)**: ☐ Pass ☐ Fail
- Issues: ___________

**Step 12 (Payment Intent Creation)**: ☐ Pass ☐ Fail
- Network Status: ___________
- Response: ___________
- Console Errors: ___________
- Request Payload: ___________

**Cart Data**:
```json
// Paste cart data here
```

**API Response**:
```json
// Paste API response here
```

**Console Errors**:
```
// Paste console errors here
```

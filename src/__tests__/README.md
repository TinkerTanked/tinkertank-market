# Shopping Cart Test Suite

This directory contains comprehensive tests for the TinkerTank Market shopping cart functionality.

## Test Coverage Summary

### Total Tests: 50+ covering all cart scenarios

## Unit Tests (`/unit/`)

### 1. Enhanced Cart Store Tests (`stores/enhancedCartStore.test.ts`)
**18 tests covering:**
- Basic cart operations (add, remove, update, clear)
- Multi-student support (add, remove, update students)
- Add-ons and pricing calculations
- Cart summary calculations
- Validation logic (students required, age validation, capacity limits, time conflicts)
- Persistence and localStorage handling
- Item retrieval and utility methods
- Date and time handling
- Edge cases (zero quantity, negative updates, non-existent items)

### 2. Cart Components Tests

#### CartIcon (`components/CartIcon.test.tsx`)
**12 tests covering:**
- Display with zero/multiple items
- Item count badge visibility and updates
- Click handler functionality
- Accessibility features
- Loading and disabled states
- Custom styling

#### CartDrawer (`components/CartDrawer.test.tsx`)
**22 tests covering:**
- Open/close functionality
- Cart item display
- Cart summary display
- Checkout button states
- Validation error/warning display
- Keyboard navigation and focus management
- Empty cart state
- Loading and error states
- Overlay interactions
- Accessibility features

#### CartItem (`components/CartItem.test.tsx`)
**24 tests covering:**
- Product details rendering
- Quantity updates and validation
- Student management (add, edit, remove)
- Student form validation
- Add-ons display
- Date/time selection
- Medical information display
- Age requirement validation
- Image handling
- Interactive features

#### CartSummary (`components/CartSummary.test.tsx`)
**18 tests covering:**
- Price calculations (subtotal, tax, total)
- GST handling
- Item and student counting
- Discount display
- Currency formatting
- Breakdown display
- Loading and error states
- Accessibility features
- Large number handling

#### StudentForm (`components/StudentForm.test.tsx`)
**22 tests covering:**
- Form rendering (new vs edit modes)
- Field validation (required fields, email, phone, age)
- Age requirements validation
- Emergency contact handling
- Phone number formatting
- Allergies handling as arrays
- Date of birth to age calculation
- Form submission and cancellation
- Loading states
- Accessibility features

### 3. Hook Tests (`hooks/useCart.test.ts`)
**16 tests covering:**
- State and action exposure
- Cart operations (add, remove, update)
- Student operations
- Computed properties (isEmpty, hasItems, itemCount, etc.)
- Validation state
- Error and loading states
- Method referential stability

## Integration Tests (`/integration/`)

### Cart Workflow Tests (`cart-workflow.test.ts`)
**15+ tests covering:**
- Complete cart workflow (empty to checkout)
- Cart modifications during workflow
- Multi-student scenarios
- Business logic validation
- Persistence and recovery
- Error handling
- Concurrent operations

## End-to-End Tests (`/e2e/`)

### Cart UI Tests (`cart-ui.test.ts`)
**25+ tests covering:**
- Complete user workflows
- UI interactions and state updates
- Form submissions and validations
- Mobile responsive behavior
- Error scenarios and recovery
- Accessibility compliance
- Cross-browser compatibility

## Test Frameworks Used

- **Vitest**: Unit and integration testing
- **React Testing Library**: Component testing
- **@testing-library/user-event**: User interaction simulation
- **Playwright**: End-to-end testing
- **MSW**: API mocking (planned)

## Test Categories

### 1. Cart State Management (15 tests)
- Adding/removing items
- Quantity updates
- Cart persistence
- State synchronization

### 2. Multi-Student Support (12 tests)
- Student assignment to cart items
- Student data validation
- Multiple students per item
- Student conflict detection

### 3. Business Logic (10 tests)
- Price calculations with GST
- Discount applications
- Capacity limit validation
- Age requirement checking

### 4. UI Components (18 tests)
- Cart icon and badge updates
- Cart drawer functionality
- Item editing interfaces
- Form validations

### 5. Error Handling (8 tests)
- Network failures
- Invalid data handling
- Validation errors
- Recovery mechanisms

### 6. Accessibility (7 tests)
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

## Running Tests

```bash
# Unit and integration tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# E2E tests
npx playwright test

# E2E tests in UI mode
npx playwright test --ui
```

## Test Data

All tests use factory functions for consistent test data:
- `createMockProduct()`
- `createMockStudent()`
- `createMockCartItem()`
- `createMockAddOn()`

## Coverage Goals

- **Statements**: >95%
- **Branches**: >90%
- **Functions**: >95%
- **Lines**: >95%

## Key Test Scenarios

### Happy Path
1. Add product to cart
2. Assign students to items
3. Validate cart is ready for checkout
4. Complete purchase workflow

### Error Scenarios
1. Invalid student data
2. Age requirement violations
3. Capacity limit exceeded
4. Network failures
5. Time conflicts

### Edge Cases
1. Empty cart operations
2. Concurrent modifications
3. Browser refresh with cart data
4. Storage quota exceeded
5. Malformed persistence data

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Code commits to main branch
- Release preparations

All tests must pass before deployment to production.

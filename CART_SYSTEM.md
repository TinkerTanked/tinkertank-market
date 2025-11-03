# TinkerTank Cart System Architecture

## Overview

A robust shopping cart system built with Zustand state management, designed specifically for TinkerTank's educational programs with multi-student support, advanced validation, and mobile-responsive design.

## Key Features

### 🛒 **Zustand Cart Store**
- **Enhanced State Management**: Built with Zustand for predictable state updates
- **LocalStorage Persistence**: Automatic cart persistence across sessions with date serialization
- **Real-time Updates**: Instant price calculations and validation feedback
- **GST Integration**: Automatic 10% Australian GST calculation

### 👥 **Multi-Student Support**
- **Individual Student Profiles**: Comprehensive student data collection per cart item
- **Flexible Assignment**: Same product for multiple students or different products per student
- **Age Validation**: Automatic age verification against product age requirements
- **Parent/Guardian Info**: Secure collection of contact and emergency details

### 📝 **Advanced Validation System**
- **Required Field Validation**: Ensures all necessary student data is collected
- **Date/Time Conflict Detection**: Prevents scheduling conflicts for the same student
- **Capacity Management**: Automatic validation against product capacity limits
- **Real-time Feedback**: Instant error and warning messages with actionable guidance

### 🎨 **Beautiful UX Components**
- **Floating Cart Icon**: Always-visible cart with live item count badge
- **Slide-out Cart Drawer**: Smooth animations with Headless UI transitions  
- **Mobile-Responsive Design**: Optimized for all screen sizes with touch-friendly controls
- **Loading States**: Smooth loading indicators and error handling

## Architecture Components

### Core State Management

#### **Enhanced Cart Store** (`/stores/enhancedCartStore.ts`)
```typescript
interface EnhancedCartState {
  items: EnhancedCartItem[]
  isLoading: boolean
  error: string | null
  
  // Actions
  addItem: (product: Product, options?: Partial<EnhancedCartItem>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  addStudent: (itemId: string, student: StudentDetails) => void
  // ... more actions
  
  // Computed Values
  getSummary: () => CartSummary
  getValidation: () => CartValidation
}
```

#### **Student Data Model** (`/types/enhancedCart.ts`)
```typescript
interface StudentDetails {
  id: string
  firstName: string
  lastName: string
  age: number
  allergies?: string[]
  medicalNotes?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  parentName: string
  parentEmail: string
  parentPhone: string
}
```

### UI Components

#### **Cart System Components**
- **`<Cart />`** - Main cart container with drawer management
- **`<CartIcon />`** - Floating cart icon with item count badge
- **`<CartDrawer />`** - Slide-out cart review interface
- **`<CartItem />`** - Individual cart item with student management
- **`<CartSummary />`** - Order totals with GST breakdown
- **`<StudentForm />`** - Comprehensive student data collection modal

#### **Reusable UI Components**
- **`<Button />`** - Consistent button styling with variants
- **`<Input />`** - Form inputs with validation states and help text

### Business Logic Features

#### **Smart Pricing Engine**
- Base product pricing with add-on calculations
- Automatic GST (10%) calculation for Australian market
- Real-time price updates on quantity changes
- Support for promotional pricing and discounts

#### **Validation Engine**
- **Student Requirements**: Ensures required student count per product type
- **Age Verification**: Validates student ages against product age ranges
- **Schedule Conflicts**: Detects and warns about overlapping bookings
- **Required Data**: Validates all necessary parent/student information

#### **Conflict Detection**
- Same student double-booking prevention
- Time slot availability checking  
- Capacity limit enforcement
- Clear warning messages with resolution guidance

## Usage Examples

### Adding Products to Cart
```typescript
import { useCart } from '@/hooks/useCart'

const { addToCart } = useCart()

// Add a summer camp with date and time selection
addToCart(campProduct, {
  quantity: 1,
  selectedDate: new Date('2024-07-15'),
  selectedTimeSlot: { start: '09:00', end: '15:00' },
  selectedAddOns: [{ addOn: lunchAddon, quantity: 1 }]
})
```

### Managing Students
```typescript
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

const { addStudent } = useEnhancedCartStore()

// Add student details to a cart item
addStudent(cartItemId, {
  id: generateId(),
  firstName: 'Emma',
  lastName: 'Johnson', 
  age: 8,
  allergies: ['Peanuts'],
  parentName: 'Sarah Johnson',
  parentEmail: 'sarah@email.com',
  parentPhone: '0412 345 678'
})
```

### Cart Integration
```jsx
import { Cart } from '@/components/cart'

function App() {
  return (
    <div className="app">
      {/* Your main content */}
      <Cart /> {/* Always-present cart system */}
    </div>
  )
}
```

## File Structure

```
src/
├── stores/
│   └── enhancedCartStore.ts      # Main Zustand store
├── types/
│   └── enhancedCart.ts          # TypeScript interfaces
├── components/
│   └── cart/
│       ├── Cart.tsx             # Main cart container
│       ├── CartIcon.tsx         # Floating cart icon
│       ├── CartDrawer.tsx       # Slide-out cart interface
│       ├── CartItem.tsx         # Individual cart items
│       ├── CartSummary.tsx      # Order totals display
│       ├── StudentForm.tsx      # Student data collection
│       └── index.ts             # Barrel exports
├── hooks/
│   └── useCart.ts               # Cart management hook
└── utils/
    ├── formatPrice.ts           # Price formatting utilities
    └── generateId.ts            # ID generation utility
```

## Dependencies

### Required Packages
- **zustand** - State management
- **@headlessui/react** - Accessible UI components
- **@heroicons/react** - Icon library
- **date-fns** - Date handling utilities
- **clsx** - Conditional class name utility

### Installation
```bash
npm install zustand @headlessui/react @heroicons/react date-fns clsx
```

## Development Features

### Type Safety
- Full TypeScript integration with strict type checking
- Comprehensive interface definitions for all cart operations
- Type-safe state management with Zustand

### Developer Experience
- Hot reload support with persistent cart state
- Comprehensive error handling and user feedback
- Extensible architecture for future product types

### Performance Optimizations
- Efficient state updates with Zustand selectors
- Optimized re-renders with React hooks
- Lightweight bundle with tree-shaking support

## Business Value

### For Customers
- **Intuitive Experience**: Clean, modern interface that guides users through the booking process
- **Error Prevention**: Comprehensive validation prevents booking conflicts and missing information
- **Mobile-First**: Fully responsive design works perfectly on phones and tablets
- **Transparent Pricing**: Clear breakdown of costs including GST

### For Business
- **Reduced Support**: Comprehensive validation reduces booking errors and support tickets
- **Higher Conversion**: Smooth UX increases cart completion rates
- **Scalable Architecture**: Easy to extend for new product types and features  
- **Data Quality**: Ensures complete and accurate student information collection

## Future Enhancements

### Planned Features
- **Payment Integration**: Stripe checkout integration
- **Booking Confirmation**: Email confirmation system
- **Calendar Integration**: Real-time availability checking
- **Discount Codes**: Promotional code system
- **Sibling Discounts**: Automatic family discounts
- **Waitlist Management**: Automatic waitlist for full sessions

### Technical Improvements
- **Offline Support**: Service worker for offline cart persistence
- **Analytics Integration**: Cart abandonment and conversion tracking
- **A/B Testing**: Built-in experimentation framework
- **Accessibility**: WCAG 2.1 AA compliance enhancements

---

*The TinkerTank cart system provides a solid foundation for educational program bookings with room for future growth and enhancement.*

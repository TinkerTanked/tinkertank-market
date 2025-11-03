# TinkerTank Product Catalog Architecture

## Overview

The TinkerTank product catalog system provides a comprehensive solution for displaying and managing educational technology products including camps, birthday parties, and subscription programs.

## Product Categories

### 1. Camps (Neutral Bay, weekdays)
- **Day Camp**: 9am-3pm, $109
- **All Day Camp**: 9am-5pm, $149

### 2. Birthday Parties (any day, mobile service)
- **Battle Bots Party**: $450
- **Gamer Party**: $450  
- **3D Design Party**: $450
- **Add-ons**: Extra kids (+$225), Catering (+$150)

### 3. Ignite Subscriptions (weekly programs)
- **In-school programs**: $25/week
- **Drop-off studio**: $39.99/week
- **School pickup**: $54.99/week

## Core Components

### Type System (`src/types/products.ts`)
- **Product**: Main product interface with catalog properties
- **AddOn**: Additional services/items for products
- **ProductFilter**: Search and filter criteria
- **CartItem**: Shopping cart item structure

### Data Layer (`src/lib/productCatalog.ts`)
- **CatalogProduct**: Complete product data structure
- **createProductCatalog()**: Main product data factory
- **getCatalogProductById()**: Product lookup by ID
- **getCatalogProductsByCategory()**: Category filtering
- **searchCatalogProducts()**: Text search functionality
- **getRecommendedProducts()**: Smart product recommendations
- **getFeaturedProducts()**: Curated featured product selection

### UI Components

#### ProductCard (`src/components/ProductCard.tsx`)
- Modern, child-friendly design with rounded corners and vibrant colors
- Category badges with emoji icons
- Price display with subscription indicators
- Feature highlights and add-on indicators
- Hover effects and animations
- Call-to-action buttons (View Details, Add to Cart)

#### ProductGrid (`src/components/ProductGrid.tsx`)
- Responsive grid layout (1/2/3 columns based on screen size)
- Empty state handling with helpful messages
- Product count display
- Consistent spacing and alignment

#### ProductSearch (`src/components/ProductSearch.tsx`)
- Global search bar with placeholder text
- Quick category filter buttons
- Advanced filters (expandable):
  - Age range selection
  - Location filtering
  - Price range brackets
- Clear filters functionality
- Active filter indicators

#### ProductCatalog (`src/components/ProductCatalog.tsx`)
- Main catalog container component
- Featured products section (when no filters active)
- Category-based organization
- Statistics display
- Search and filter integration
- Cart integration

### Utility Functions (`src/lib/productUtils.ts`)
- **filterProducts()**: Advanced filtering logic
- **getRecommendedProducts()**: Recommendation algorithm
- **getFeaturedProducts()**: Featured selection algorithm
- **calculateTotalPrice()**: Price calculation with add-ons
- **getProductsByAgeGroup()**: Age-based filtering

### Shopping Cart Integration (`src/hooks/useProductCart.ts`)
- Zustand-based state management
- Persistent cart storage
- Add/remove/update cart items
- Price calculations
- Cart drawer integration
- Add-on support

## Design Philosophy

### Child-Friendly UI
- Bright, engaging colors
- Emoji icons for visual appeal
- Rounded corners and soft shadows
- Large, easy-to-read text
- Interactive hover effects

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly buttons
- Accessible navigation

### Performance Optimized
- Memoized filtering and search
- Lazy loading capabilities
- Optimized re-renders
- Efficient state management

## Key Features

### Smart Search & Filtering
- Full-text search across names, descriptions, and tags
- Multi-criteria filtering (category, age, location, price)
- Real-time results updating
- Filter state persistence

### Product Recommendations
- Category-based suggestions
- Age-appropriate matching
- Price similarity scoring
- Feature overlap analysis

### Age-Appropriate Content
- Clear age range indicators
- Color-coded age categories
- Age-based product filtering
- Developmentally appropriate features

### Pricing & Add-ons
- Clear price display with currency formatting
- Subscription pricing indicators (/week)
- Add-on system for birthday parties
- Dynamic price calculations

## Integration Points

### Shopping Cart System
- Compatible with existing Zustand cart store
- Supports complex booking scenarios
- Add-on selection and pricing
- Date/time slot selection

### TinkerTank Branding
- Consistent color scheme (blue/purple gradients)
- Brand-appropriate imagery placeholders
- Professional typography
- Trust indicators and badges

## Usage Examples

```tsx
// Basic catalog display
<ProductCatalog />

// Category-specific catalog
<ProductCatalog defaultCategory="camps" />

// With custom product selection handler
<ProductCatalog 
  onProductSelect={(product) => router.push(`/product/${product.id}`)}
/>

// Without featured section
<ProductCatalog showFeatured={false} />
```

## File Structure

```
src/
├── components/
│   ├── ProductCard.tsx          # Individual product display
│   ├── ProductGrid.tsx          # Grid layout for products
│   ├── ProductSearch.tsx        # Search and filtering UI
│   └── ProductCatalog.tsx       # Main catalog container
├── data/
│   └── products.ts              # Product data access layer
├── hooks/
│   └── useProductCart.ts        # Shopping cart state management
├── lib/
│   ├── productCatalog.ts        # Core product data and utilities
│   ├── productUtils.ts          # Product manipulation utilities
│   └── utils.ts                 # General utility functions
└── types/
    └── products.ts              # TypeScript type definitions
```

## Extensibility

The catalog system is designed for easy extension:

- **New Product Types**: Add to `createProductCatalog()` function
- **Additional Filters**: Extend `ProductFilter` interface
- **Custom Components**: Replace any component while maintaining interfaces
- **Enhanced Search**: Extend search algorithm in `searchCatalogProducts()`
- **New Categories**: Add to category type union and update components

## Testing & Quality

- TypeScript strict mode compliance
- ESLint configuration with Next.js rules
- Responsive design testing
- Cross-browser compatibility
- Accessibility considerations (WCAG guidelines)

## Future Enhancements

Potential improvements for the catalog system:

1. **Image Optimization**: Integration with Next.js Image component
2. **Advanced Filtering**: Date availability, instructor preferences
3. **Comparison Tool**: Side-by-side product comparison
4. **Reviews & Ratings**: Customer feedback integration
5. **Virtual Tours**: 360° studio views for location-based programs
6. **Calendar Integration**: Real-time availability checking
7. **Personalization**: AI-driven product recommendations
8. **Multi-language Support**: Internationalization capabilities

## Performance Metrics

The catalog system is optimized for:

- **First Load**: < 100KB JavaScript bundle
- **Search Response**: < 100ms for typical queries
- **Filter Updates**: < 50ms for real-time filtering
- **Mobile Performance**: Lighthouse score > 90

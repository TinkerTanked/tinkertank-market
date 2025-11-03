# TinkerTank Market

A modern e-commerce platform for TinkerTank's STEM education programs, including camps, birthday parties, and subscriptions.

## Features

- **Product Catalog**: Browse STEM camps, birthday parties, and Ignite subscriptions
- **Shopping Cart**: Add multiple items and manage quantities
- **Secure Checkout**: Stripe integration for payments
- **Calendar Integration**: FullCalendar for booking and admin management
- **Admin Dashboard**: Manage products, orders, and calendar events
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Calendar**: FullCalendar
- **Testing**: Vitest
- **TypeScript**: Full type safety

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tinkertank-market

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Set up database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tinkertank_market"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier
- `npm run type-check` - TypeScript checking
- `npm run test` - Run tests
- `npm run db:studio` - Open Prisma Studio

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── catalog/           # Product catalog
│   ├── checkout/          # Checkout process
│   └── calendar/          # Calendar views
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── stores/                # Zustand stores
├── types/                 # TypeScript types
└── utils/                 # Helper functions
```

## API Endpoints

### Public APIs

- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product by ID
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/webhook` - Stripe webhook handler

### Admin APIs

- `GET /api/admin/orders` - Get all orders
- `POST /api/admin/events` - Create calendar event
- `PUT /api/admin/events/[id]` - Update event
- `DELETE /api/admin/events/[id]` - Delete event

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

Run the full test suite including purchase flow and admin functionality:

```bash
npm run test -- --reporter=verbose
```

## Deployment

### Build Optimization

```bash
npm run build
npm run type-check
npm run lint
```

### Environment Setup

1. Set production environment variables
2. Configure database with connection pooling
3. Set up Stripe webhook endpoints
4. Configure domain and SSL

### Health Checks

- `GET /api/health` - Application health status

## Features Overview

### Customer Experience

1. **Browse Products**: View camps, parties, and subscriptions
2. **Add to Cart**: Manage items and quantities
3. **Secure Checkout**: Stripe payment processing
4. **Order Confirmation**: Email receipts and booking details

### Admin Management

1. **Dashboard**: Sales metrics and booking overview
2. **Calendar**: View and manage all bookings
3. **Event Creation**: Schedule new programs
4. **Order Management**: Track and fulfill orders

### Technical Features

1. **Error Handling**: Global error boundaries and user-friendly messages
2. **Performance**: Component memoization and API caching
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Security**: Input validation and secure payment processing

## Contributing

1. Follow the code style guidelines in AGENTS.md
2. Write tests for new features
3. Run type checking and linting before commits
4. Update documentation for API changes

## Support

For technical support or questions, please contact the development team.

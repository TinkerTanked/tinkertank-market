# AGENTS.md - TinkerTank Market

## Build/Test Commands

- **Development**: `npm run dev` (Next.js dev server on port 3000)
- **Build**: `npm run build` (production build)
- **Lint**: `npm run lint` (ESLint)
- **Format**: `npm run format` (Prettier)
- **Type Check**: `npm run type-check` (TypeScript)
- **Test**: `npm run test` (Vitest)
- **Database**: `npx prisma generate && npx prisma migrate dev` (Prisma)

## Architecture

- **Framework**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe with custom checkout
- **Calendar**: FullCalendar for booking and admin views
- **State**: Zustand for shopping cart
- **Location**: Neutral Bay only (initially)
- **Products**: Camps (Day/All Day), Birthdays, Ignite subscriptions

## Code Style

- **Formatting**: 2 spaces, 140 char lines, single quotes, no trailing commas
- **TypeScript**: Strict mode, path aliases using `@/*`
- **Imports**: External → internal → relative
- **Components**: Functional components with hooks
- **Testing**: Vitest for unit tests

# TinkerTank Market Database Setup

## Quick Start

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create database**:
   ```bash
   createdb tinkertank_market
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database setup**:
   ```bash
   npm run db:setup
   ```

## Environment Variables

Copy `.env.example` to `.env` and update:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tinkertank_market"
```

## Available Commands

### Development
- `npm run db:setup` - Initial database setup (migration + seed)
- `npm run db:migrate` - Run new migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio GUI

### Maintenance
- `npm run db:reset-dev` - Reset database with fresh seed data
- `npm run db:backup` - Create database backup
- `npm run db:restore <file>` - Restore from backup
- `npm run db:backups` - List available backups

## Seed Data Includes

### Products (13 total)
- **Day Camps**: Robotics Mastery, Young Engineers, Game Design, 3D Printing
- **Half-Day Camps**: Coding Adventures, Minecraft Engineering, Electronics
- **Birthday Parties**: Robotics, Coding, Minecraft, Engineering themes
- **Subscriptions**: Ignite Weekly, Junior Makers, Advanced Robotics Club

### Sample Data
- **25 Students** with realistic names, birthdates, and allergies
- **20+ Events** including upcoming camps and recurring sessions
- **50+ Bookings** with various statuses (confirmed, completed, pending)
- **15 Orders** with different payment statuses
- **Neutral Bay Location** with proper capacity limits

### Realistic Timeline
- **Past Events**: Completed sessions with student feedback
- **Current Events**: Ongoing subscriptions and upcoming camps
- **Future Events**: Scheduled camps and birthday parties for next 30 days

## Database Schema

### Core Entities
- `Student` - Student profiles with allergies and contact info
- `Product` - Camps, birthdays, and subscriptions with pricing
- `Location` - Physical venues with capacity limits
- `Booking` - Individual student enrollments in events
- `Order` - Payment transactions with Stripe integration

### Calendar System
- `Event` - Scheduled sessions with capacity management
- `RecurringTemplate` - Templates for weekly/monthly programs

### Business Features
- Age-based product filtering
- Capacity management with waitlists
- Comprehensive booking status tracking
- Stripe payment integration ready
- Multi-location support (expandable)

## Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**: `npm run db:migrate`
3. **Update seed data** in `prisma/seed.ts` if needed
4. **Test with fresh data**: `npm run db:reset-dev`

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `brew services start postgresql`
- Check database exists: `psql -l | grep tinkertank_market`
- Verify credentials in `.env` file

### Migration Issues
- Reset if corrupted: `npm run db:reset-dev`
- Check schema syntax: `npx prisma format`
- View migration status: `npx prisma migrate status`

### Seed Data Issues
- Check foreign key constraints
- Verify date formats and timezones
- Run with verbose logging: `DEBUG=* npm run db:seed`

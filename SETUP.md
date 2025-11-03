# TinkerTank Market - Database Setup Guide

## Prerequisites

1. **PostgreSQL installed and running**
2. **Node.js 18+** with npm
3. **Environment variables** configured

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your database URL

# 3. Create database
createdb tinkertank_market

# 4. Run complete setup
npm run db:setup
```

## Manual Setup Steps

### 1. Database Creation

```bash
# Create PostgreSQL database
createdb tinkertank_market

# Or using psql
psql -U postgres -c "CREATE DATABASE tinkertank_market;"
```

### 2. Environment Configuration

Update `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/tinkertank_market"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
NODE_ENV="development"
```

### 3. Prisma Setup

```bash
# Generate Prisma client
npm run db:generate

# Create and run initial migration
npm run db:migrate

# Seed with sample data
npm run db:seed
```

## Database Commands Reference

### Development
| Command | Description |
|---------|-------------|
| `npm run db:setup` | Complete setup (migration + seed) |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Populate with sample data |
| `npm run db:generate` | Generate Prisma client |
| `npm run dev` | Start development server |

### Maintenance
| Command | Description |
|---------|-------------|
| `npm run db:status` | Show database statistics |
| `npm run db:validate` | Validate data integrity |
| `npm run db:reset-dev` | Reset with fresh seed data |
| `npm run db:studio` | Open Prisma Studio GUI |

### Backup & Restore
| Command | Description |
|---------|-------------|
| `npm run db:backup` | Create timestamped backup |
| `npm run db:backups` | List available backups |
| `npm run db:restore <file>` | Restore from backup file |

## Seed Data Overview

The database is populated with comprehensive test data:

### Products (13 items)
- **4 Full-Day Camps** ($80-90): Robotics, Engineering, Game Design, 3D Printing
- **3 Half-Day Camps** ($50-60): Coding, Minecraft, Electronics
- **4 Birthday Parties** ($300-350): Various themes, 2-hour duration
- **3 Subscription Programs** ($80-150): Weekly/monthly recurring sessions

### Students (25 profiles)
- Realistic names and birthdates (ages 5-16)
- Allergy information for safety compliance
- Distributed across appropriate age ranges

### Events & Bookings
- **20+ Scheduled Events** for next 8 weeks
- **Recurring Sessions** (Ignite Weekly, Junior Makers)
- **Weekend Camp Events** with realistic attendance
- **Birthday Parties** scheduled on weekends
- **50+ Bookings** with various statuses

### Business Data
- **15 Sample Orders** with different payment statuses
- **Monthly Revenue Tracking** for dashboard analytics
- **Capacity Management** with realistic attendance numbers
- **Location Data** for Neutral Bay with 20-person capacity

## Data Validation Rules

### Age Validation
- Students must be within product age ranges
- Age calculated from birthdate to current date
- Warnings for borderline age matches

### Capacity Management
- Events cannot exceed location capacity
- Current count must match actual bookings
- Booking validation before confirmation

### Pricing Integrity
- All prices must be positive values
- Booking totals must match product prices
- Order totals must equal sum of order items

### Date Validation
- Event end time must be after start time
- Bookings must be for future dates
- Recurring events follow template schedules

## Troubleshooting

### Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgres

# Test connection
psql postgresql://localhost:5432/tinkertank_market
```

### Migration Problems
```bash
# Check migration status
npx prisma migrate status

# Reset if corrupted
npm run db:reset-dev
```

### Data Issues
```bash
# Validate data integrity
npm run db:validate

# Check database health
npm run db:status
```

## Production Notes

- Use strong passwords for production databases
- Enable SSL connections in production
- Set up automated backups
- Monitor database performance
- Use read replicas for analytics if needed

For production deployment, update `DATABASE_URL` to use your cloud PostgreSQL instance (AWS RDS, Google Cloud SQL, etc.).

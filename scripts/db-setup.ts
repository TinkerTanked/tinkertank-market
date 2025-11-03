#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function setupDatabase() {
  console.log('🔄 Setting up TinkerTank Market database...')

  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })

    // Run migrations
    console.log('🔄 Running database migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })

    // Test connection
    console.log('🔗 Testing database connection...')
    await prisma.$queryRaw`SELECT 1`

    // Seed database
    console.log('🌱 Seeding database...')
    execSync('npx prisma db seed', { stdio: 'inherit' })

    console.log('✅ Database setup complete!')
    console.log('\n🚀 Next steps:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Open browser to: http://localhost:3000')
    console.log('3. Check admin dashboard: http://localhost:3000/admin')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  setupDatabase()
}

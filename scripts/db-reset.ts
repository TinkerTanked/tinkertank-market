#!/usr/bin/env tsx

/**
 * Database reset utility for development
 * Completely resets the database and reseeds with fresh data
 */

import { execSync } from 'child_process'

function runCommand(command: string, description: string) {
  console.log(`🔄 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completed`)
  } catch (error) {
    console.error(`❌ ${description} failed:`, error)
    process.exit(1)
  }
}

async function main() {
  console.log('🔄 Resetting TinkerTank Market Database')
  console.log('⚠️  This will delete ALL data!')
  console.log('=' + '='.repeat(39))

  // Reset database (drops and recreates)
  runCommand('npx prisma migrate reset --force', 'Resetting database')

  // Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client')

  // Seed with fresh data
  runCommand('npx prisma db seed', 'Seeding with fresh data')

  console.log('\n🎉 Database reset completed!')
  console.log('📊 Fresh seed data has been loaded')
}

main().catch(console.error)

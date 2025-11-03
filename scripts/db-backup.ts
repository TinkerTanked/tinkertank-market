#!/usr/bin/env tsx

/**
 * Database backup and restore utilities
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { format } from 'date-fns'

const BACKUP_DIR = './backups'
const DATABASE_NAME = 'tinkertank_market'

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

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

async function backup() {
  ensureBackupDir()
  
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const backupFile = `${BACKUP_DIR}/${DATABASE_NAME}_${timestamp}.sql`
  
  console.log('💾 Creating database backup...')
  
  runCommand(
    `pg_dump -h localhost -U postgres -d ${DATABASE_NAME} > ${backupFile}`,
    `Backing up to ${backupFile}`
  )
  
  console.log(`\n✅ Backup created: ${backupFile}`)
}

async function restore(backupFile: string) {
  if (!existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`)
    process.exit(1)
  }
  
  console.log(`🔄 Restoring from ${backupFile}...`)
  
  // Drop and recreate database
  runCommand(
    `psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS ${DATABASE_NAME};"`,
    'Dropping existing database'
  )
  
  runCommand(
    `psql -h localhost -U postgres -c "CREATE DATABASE ${DATABASE_NAME};"`,
    'Creating fresh database'
  )
  
  // Restore from backup
  runCommand(
    `psql -h localhost -U postgres -d ${DATABASE_NAME} < ${backupFile}`,
    'Restoring database from backup'
  )
  
  // Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client')
  
  console.log('\n✅ Database restored successfully!')
}

async function listBackups() {
  ensureBackupDir()
  
  console.log('📁 Available backups:')
  try {
    execSync(`ls -la ${BACKUP_DIR}/*.sql`, { stdio: 'inherit' })
  } catch {
    console.log('   No backups found')
  }
}

async function main() {
  const command = process.argv[2]
  const argument = process.argv[3]
  
  switch (command) {
    case 'backup':
      await backup()
      break
    case 'restore':
      if (!argument) {
        console.error('❌ Please specify backup file to restore')
        console.log('Usage: tsx scripts/db-backup.ts restore <backup-file>')
        process.exit(1)
      }
      await restore(argument)
      break
    case 'list':
      await listBackups()
      break
    default:
      console.log('🗄️  TinkerTank Market Database Backup Utility')
      console.log('\nUsage:')
      console.log('  tsx scripts/db-backup.ts backup           - Create new backup')
      console.log('  tsx scripts/db-backup.ts restore <file>   - Restore from backup')
      console.log('  tsx scripts/db-backup.ts list             - List available backups')
  }
}

main().catch(console.error)

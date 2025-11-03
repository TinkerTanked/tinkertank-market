#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  name: string
  status: 'pass' | 'fail'
  message?: string
}

async function runDeploymentTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: TypeScript compilation
  try {
    console.log('🔍 Testing TypeScript compilation...')
    execSync('npm run type-check', { stdio: 'pipe' })
    results.push({ name: 'TypeScript', status: 'pass' })
  } catch (error) {
    results.push({ name: 'TypeScript', status: 'fail', message: 'Type checking failed' })
  }

  // Test 2: Linting
  try {
    console.log('🔍 Testing ESLint...')
    execSync('npm run lint', { stdio: 'pipe' })
    results.push({ name: 'ESLint', status: 'pass' })
  } catch (error) {
    results.push({ name: 'ESLint', status: 'fail', message: 'Linting failed' })
  }

  // Test 3: Build
  try {
    console.log('🔍 Testing production build...')
    execSync('npm run build', { stdio: 'pipe' })
    results.push({ name: 'Build', status: 'pass' })
  } catch (error) {
    results.push({ name: 'Build', status: 'fail', message: 'Build failed' })
  }

  // Test 4: Database connection
  try {
    console.log('🔍 Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    results.push({ name: 'Database', status: 'pass' })
  } catch (error) {
    results.push({ name: 'Database', status: 'fail', message: 'Database connection failed' })
  }

  // Test 5: Environment variables
  try {
    console.log('🔍 Testing environment variables...')
    const requiredVars = [
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    ]

    const missing = requiredVars.filter(varName => !process.env[varName])
    if (missing.length > 0) {
      throw new Error(`Missing: ${missing.join(', ')}`)
    }
    results.push({ name: 'Environment', status: 'pass' })
  } catch (error) {
    results.push({ 
      name: 'Environment', 
      status: 'fail', 
      message: error instanceof Error ? error.message : 'Environment check failed' 
    })
  }

  // Test 6: Unit tests
  try {
    console.log('🔍 Running unit tests...')
    execSync('npm run test -- --run', { stdio: 'pipe' })
    results.push({ name: 'Tests', status: 'pass' })
  } catch (error) {
    results.push({ name: 'Tests', status: 'fail', message: 'Unit tests failed' })
  }

  return results
}

async function main() {
  console.log('🚀 Starting TinkerTank Market deployment tests...\n')

  try {
    const results = await runDeploymentTests()
    
    console.log('\n📊 Test Results:')
    console.log('================')
    
    let allPassed = true
    for (const result of results) {
      const status = result.status === 'pass' ? '✅' : '❌'
      console.log(`${status} ${result.name}`)
      if (result.message) {
        console.log(`   ${result.message}`)
      }
      if (result.status === 'fail') {
        allPassed = false
      }
    }

    console.log('\n📋 Summary:')
    console.log(`✅ Passed: ${results.filter(r => r.status === 'pass').length}`)
    console.log(`❌ Failed: ${results.filter(r => r.status === 'fail').length}`)

    if (allPassed) {
      console.log('\n🎉 All tests passed! Ready for deployment.')
      console.log('\n🚀 Next steps:')
      console.log('1. Review DEPLOYMENT.md for deployment checklist')
      console.log('2. Set up production environment variables')
      console.log('3. Configure Stripe webhook endpoints')
      console.log('4. Deploy to your hosting platform')
    } else {
      console.log('\n⚠️  Some tests failed. Please fix issues before deployment.')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Deployment test runner failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

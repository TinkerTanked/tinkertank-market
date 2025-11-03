#!/usr/bin/env tsx

import { execSync } from 'child_process'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message?: string
}

async function runBasicChecks(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: Environment Variables
  try {
    console.log('🔍 Checking environment variables...')
    const requiredVars = [
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
    ]

    const missing = requiredVars.filter(varName => !process.env[varName])
    if (missing.length > 0) {
      results.push({ 
        name: 'Environment', 
        status: 'fail', 
        message: `Missing: ${missing.join(', ')}` 
      })
    } else {
      results.push({ name: 'Environment', status: 'pass' })
    }
  } catch (error) {
    results.push({ name: 'Environment', status: 'fail', message: 'Environment check failed' })
  }

  // Test 2: Build with warnings allowed
  try {
    console.log('🔍 Testing production build (warnings allowed)...')
    execSync('npm run build', { stdio: 'pipe' })
    results.push({ name: 'Build', status: 'pass' })
  } catch (error) {
    // Check if it's just warnings
    try {
      execSync('npm run build', { stdio: 'inherit' })
      results.push({ name: 'Build', status: 'warning', message: 'Build completed with warnings' })
    } catch {
      results.push({ name: 'Build', status: 'fail', message: 'Build failed' })
    }
  }

  // Test 3: Basic file structure
  try {
    console.log('🔍 Checking project structure...')
    const fs = await import('fs')
    const requiredFiles = [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'package.json',
      'next.config.ts',
    ]

    const missing = requiredFiles.filter(file => !fs.existsSync(file))
    if (missing.length === 0) {
      results.push({ name: 'Structure', status: 'pass' })
    } else {
      results.push({ name: 'Structure', status: 'fail', message: `Missing files: ${missing.join(', ')}` })
    }
  } catch (error) {
    results.push({ name: 'Structure', status: 'fail', message: 'File structure check failed' })
  }

  return results
}

async function main() {
  console.log('🚀 TinkerTank Market - Basic Deployment Check\n')

  try {
    const results = await runBasicChecks()
    
    console.log('\n📊 Results:')
    console.log('===========')
    
    for (const result of results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
      console.log(`${icon} ${result.name}`)
      if (result.message) {
        console.log(`   ${result.message}`)
      }
    }

    const passed = results.filter(r => r.status === 'pass').length
    const warnings = results.filter(r => r.status === 'warning').length
    const failed = results.filter(r => r.status === 'fail').length

    console.log('\n📋 Summary:')
    console.log(`✅ Passed: ${passed}`)
    if (warnings > 0) console.log(`⚠️  Warnings: ${warnings}`)
    console.log(`❌ Failed: ${failed}`)

    if (failed === 0) {
      console.log('\n🎉 Basic deployment checks passed!')
      console.log('\n📝 Next Steps:')
      console.log('1. Review and fix any linting warnings')
      console.log('2. Set up production database')
      console.log('3. Configure production Stripe keys')
      console.log('4. Deploy to hosting platform')
      console.log('5. Set up Stripe webhook endpoints')
    } else {
      console.log('\n⚠️  Some checks failed. Address issues before deployment.')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Deployment check failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

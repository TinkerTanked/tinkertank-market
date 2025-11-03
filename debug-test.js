#!/usr/bin/env node

// Quick debug script to test calendar
const { exec } = require('child_process')

console.log('🔍 Starting Calendar Debug...')

// Start Next.js dev server
const devServer = exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Dev server error: ${error}`)
    return
  }
})

devServer.stdout.on('data', (data) => {
  console.log(`📝 Dev: ${data}`)
  
  // Check if server is ready
  if (data.includes('Ready') || data.includes('started server')) {
    console.log('✅ Server is ready! Navigate to:')
    console.log('   - Admin Calendar: http://localhost:3000/admin/calendar')
    console.log('   - Debug Page: http://localhost:3000/debug/calendar')
    console.log('')
    console.log('🔧 Debug checklist:')
    console.log('   1. Open browser console (F12)')
    console.log('   2. Look for JavaScript errors')
    console.log('   3. Check if FullCalendar CSS is loading')
    console.log('   4. Test click interactions')
    console.log('   5. Verify calendar elements exist in DOM')
  }
})

devServer.stderr.on('data', (data) => {
  console.error(`❌ Error: ${data}`)
})

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down debug server...')
  devServer.kill()
  process.exit()
})

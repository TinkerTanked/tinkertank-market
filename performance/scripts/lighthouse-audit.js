const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs').promises

const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-meaningful-paint',
      'speed-index',
      'interactive',
      'mainthread-work-breakdown',
      'bootup-time',
      'uses-responsive-images',
      'uses-text-compression',
      'unused-css-rules',
      'unminified-css',
      'unminified-javascript',
      'unused-javascript',
      'server-response-time'
    ],
  },
}

const urls = [
  'http://localhost:3000',
  'http://localhost:3000/camps',
  'http://localhost:3000/birthdays',
  'http://localhost:3000/subscriptions'
]

async function runLighthouseAudit() {
  const results = []
  
  for (const url of urls) {
    console.log(`Running Lighthouse audit for ${url}...`)
    
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox']
    })
    
    try {
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        disableDeviceEmulation: false,
        throttlingMethod: 'simulate'
      }, config)
      
      const report = runnerResult.lhr
      
      const metrics = {
        url,
        performance: report.categories.performance?.score * 100,
        fcp: report.audits['first-contentful-paint']?.numericValue,
        lcp: report.audits['largest-contentful-paint']?.numericValue,
        fmp: report.audits['first-meaningful-paint']?.numericValue,
        speedIndex: report.audits['speed-index']?.numericValue,
        interactive: report.audits['interactive']?.numericValue,
        serverResponseTime: report.audits['server-response-time']?.numericValue
      }
      
      results.push(metrics)
      
      console.log(`${url}: Performance Score ${metrics.performance}/100`)
      console.log(`  FCP: ${metrics.fcp}ms`)
      console.log(`  LCP: ${metrics.lcp}ms`) 
      console.log(`  Interactive: ${metrics.interactive}ms`)
      console.log(`  Speed Index: ${metrics.speedIndex}`)
      console.log('---')
      
    } catch (error) {
      console.error(`Error auditing ${url}:`, error.message)
    } finally {
      await chrome.kill()
    }
  }
  
  // Save results to file
  await fs.writeFile(
    './performance/results/lighthouse-results.json',
    JSON.stringify(results, null, 2)
  )
  
  // Generate performance summary
  const summary = {
    timestamp: new Date().toISOString(),
    averagePerformanceScore: results.reduce((sum, r) => sum + r.performance, 0) / results.length,
    results
  }
  
  await fs.writeFile(
    './performance/results/performance-summary.json',
    JSON.stringify(summary, null, 2)
  )
  
  console.log(`\nPerformance audit complete!`)
  console.log(`Average Performance Score: ${summary.averagePerformanceScore.toFixed(1)}/100`)
  
  // Performance thresholds
  const thresholds = {
    performance: 80,
    fcp: 1800,
    lcp: 2500,
    interactive: 3800,
    speedIndex: 3000
  }
  
  // Check thresholds
  let failed = false
  results.forEach(result => {
    if (result.performance < thresholds.performance) {
      console.log(`⚠️  ${result.url} performance score below threshold: ${result.performance} < ${thresholds.performance}`)
      failed = true
    }
    if (result.fcp > thresholds.fcp) {
      console.log(`⚠️  ${result.url} FCP above threshold: ${result.fcp}ms > ${thresholds.fcp}ms`)
      failed = true
    }
    if (result.lcp > thresholds.lcp) {
      console.log(`⚠️  ${result.url} LCP above threshold: ${result.lcp}ms > ${thresholds.lcp}ms`)
      failed = true
    }
  })
  
  if (!failed) {
    console.log('✅ All performance thresholds passed!')
  }
  
  return summary
}

// Performance budget checker
async function checkPerformanceBudget() {
  try {
    const results = JSON.parse(await fs.readFile('./performance/results/lighthouse-results.json', 'utf8'))
    
    const budget = {
      maxFCP: 1500,
      maxLCP: 2000,
      maxInteractive: 3000,
      minPerformanceScore: 85
    }
    
    console.log('\n📊 Performance Budget Check:')
    console.log('================================')
    
    let budgetPassed = true
    
    results.forEach(result => {
      console.log(`\n${result.url}:`)
      
      if (result.fcp > budget.maxFCP) {
        console.log(`❌ FCP: ${result.fcp}ms (budget: ${budget.maxFCP}ms)`)
        budgetPassed = false
      } else {
        console.log(`✅ FCP: ${result.fcp}ms`)
      }
      
      if (result.lcp > budget.maxLCP) {
        console.log(`❌ LCP: ${result.lcp}ms (budget: ${budget.maxLCP}ms)`)
        budgetPassed = false
      } else {
        console.log(`✅ LCP: ${result.lcp}ms`)
      }
      
      if (result.interactive > budget.maxInteractive) {
        console.log(`❌ Interactive: ${result.interactive}ms (budget: ${budget.maxInteractive}ms)`)
        budgetPassed = false
      } else {
        console.log(`✅ Interactive: ${result.interactive}ms`)
      }
      
      if (result.performance < budget.minPerformanceScore) {
        console.log(`❌ Performance Score: ${result.performance} (budget: ${budget.minPerformanceScore})`)
        budgetPassed = false
      } else {
        console.log(`✅ Performance Score: ${result.performance}`)
      }
    })
    
    console.log('\n================================')
    if (budgetPassed) {
      console.log('✅ Performance budget PASSED!')
    } else {
      console.log('❌ Performance budget FAILED!')
    }
    
    return budgetPassed
  } catch (error) {
    console.error('Could not read lighthouse results:', error.message)
    return false
  }
}

if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'budget') {
    checkPerformanceBudget()
  } else {
    runLighthouseAudit()
  }
}

module.exports = { runLighthouseAudit, checkPerformanceBudget }

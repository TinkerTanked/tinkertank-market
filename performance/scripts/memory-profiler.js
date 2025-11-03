const { performance } = require('perf_hooks')
const fs = require('fs').promises

class MemoryProfiler {
  constructor() {
    this.snapshots = []
    this.running = false
    this.interval = null
  }

  start(intervalMs = 1000) {
    if (this.running) return
    
    this.running = true
    this.snapshots = []
    
    console.log('🔍 Memory profiling started...')
    
    this.interval = setInterval(() => {
      this.takeSnapshot()
    }, intervalMs)
  }

  stop() {
    if (!this.running) return
    
    clearInterval(this.interval)
    this.running = false
    
    console.log('📊 Memory profiling stopped.')
    return this.generateReport()
  }

  takeSnapshot() {
    const memUsage = process.memoryUsage()
    const timestamp = Date.now()
    
    this.snapshots.push({
      timestamp,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss
    })
  }

  generateReport() {
    if (this.snapshots.length === 0) return null
    
    const first = this.snapshots[0]
    const last = this.snapshots[this.snapshots.length - 1]
    const peak = this.snapshots.reduce((max, snapshot) => 
      snapshot.heapUsed > max.heapUsed ? snapshot : max
    )
    
    const report = {
      duration: last.timestamp - first.timestamp,
      snapshots: this.snapshots.length,
      memory: {
        initial: this.formatBytes(first.heapUsed),
        final: this.formatBytes(last.heapUsed),
        peak: this.formatBytes(peak.heapUsed),
        change: this.formatBytes(last.heapUsed - first.heapUsed)
      },
      leakDetection: this.detectMemoryLeaks(),
      recommendations: this.generateRecommendations()
    }
    
    return report
  }

  detectMemoryLeaks() {
    if (this.snapshots.length < 10) return null
    
    const windowSize = Math.floor(this.snapshots.length / 3)
    const early = this.snapshots.slice(0, windowSize)
    const late = this.snapshots.slice(-windowSize)
    
    const earlyAvg = early.reduce((sum, s) => sum + s.heapUsed, 0) / early.length
    const lateAvg = late.reduce((sum, s) => sum + s.heapUsed, 0) / late.length
    
    const growthRate = (lateAvg - earlyAvg) / earlyAvg * 100
    
    return {
      detected: growthRate > 10,
      growthRate: growthRate.toFixed(2) + '%',
      severity: growthRate > 50 ? 'critical' : growthRate > 20 ? 'moderate' : 'low'
    }
  }

  generateRecommendations() {
    const recommendations = []
    const last = this.snapshots[this.snapshots.length - 1]
    
    if (last.heapUsed > 100 * 1024 * 1024) {
      recommendations.push('High memory usage detected. Consider implementing object pooling.')
    }
    
    const leak = this.detectMemoryLeaks()
    if (leak?.detected) {
      recommendations.push('Potential memory leak detected. Review event listeners and closures.')
    }
    
    if (last.arrayBuffers > 50 * 1024 * 1024) {
      recommendations.push('High ArrayBuffer usage. Review buffer management and cleanup.')
    }
    
    return recommendations
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async saveReport(filename = 'memory-profile') {
    const report = this.generateReport()
    if (!report) return
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filepath = `./performance/results/${filename}-${timestamp}.json`
    
    await fs.writeFile(filepath, JSON.stringify({
      timestamp: new Date().toISOString(),
      ...report,
      snapshots: this.snapshots
    }, null, 2))
    
    console.log(`📄 Memory profile saved to ${filepath}`)
    return filepath
  }
}

// Cart memory test
async function testCartMemoryUsage() {
  const profiler = new MemoryProfiler()
  profiler.start(500)
  
  console.log('🛒 Testing cart memory usage...')
  
  // Simulate cart operations
  const carts = []
  
  for (let i = 0; i < 1000; i++) {
    const cart = {
      id: i,
      items: Array.from({ length: 10 }, (_, j) => ({
        id: `item-${i}-${j}`,
        name: `Product ${j}`,
        price: Math.random() * 100,
        quantity: Math.floor(Math.random() * 5) + 1
      })),
      timestamp: Date.now()
    }
    
    carts.push(cart)
    
    // Simulate some processing
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // Clear some carts (simulate cleanup)
  carts.splice(0, 500)
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const report = profiler.stop()
  await profiler.saveReport('cart-memory-test')
  
  return report
}

// Calendar memory test
async function testCalendarMemoryUsage() {
  const profiler = new MemoryProfiler()
  profiler.start(500)
  
  console.log('📅 Testing calendar memory usage...')
  
  // Simulate calendar events
  const events = []
  
  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= 30; day++) {
      const dayEvents = Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
        id: `event-${month}-${day}-${i}`,
        title: `Event ${i}`,
        date: new Date(2024, month, day),
        type: ['camp', 'birthday', 'workshop'][Math.floor(Math.random() * 3)],
        participants: Math.floor(Math.random() * 20) + 1,
        booked: Math.random() > 0.3
      }))
      
      events.push(...dayEvents)
    }
    
    // Simulate monthly processing
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Simulate filtering and searching
  for (let i = 0; i < 100; i++) {
    const filtered = events.filter(e => e.type === 'camp' && e.participants > 10)
    const sorted = filtered.sort((a, b) => a.date - b.date)
    
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  
  const report = profiler.stop()
  await profiler.saveReport('calendar-memory-test')
  
  return report
}

// Main execution
async function runMemoryTests() {
  console.log('🧠 Starting memory performance tests...\n')
  
  const cartReport = await testCartMemoryUsage()
  console.log('\n📊 Cart Memory Report:')
  console.log(`Duration: ${cartReport.duration}ms`)
  console.log(`Memory change: ${cartReport.memory.change}`)
  console.log(`Peak usage: ${cartReport.memory.peak}`)
  
  if (cartReport.leakDetection?.detected) {
    console.log(`⚠️  Memory leak detected: ${cartReport.leakDetection.growthRate} growth`)
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const calendarReport = await testCalendarMemoryUsage()
  console.log('\n📊 Calendar Memory Report:')
  console.log(`Duration: ${calendarReport.duration}ms`)
  console.log(`Memory change: ${calendarReport.memory.change}`)
  console.log(`Peak usage: ${calendarReport.memory.peak}`)
  
  if (calendarReport.leakDetection?.detected) {
    console.log(`⚠️  Memory leak detected: ${calendarReport.leakDetection.growthRate} growth`)
  }
  
  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    tests: {
      cart: cartReport,
      calendar: calendarReport
    },
    overallRecommendations: [
      ...cartReport.recommendations,
      ...calendarReport.recommendations
    ].filter((rec, i, arr) => arr.indexOf(rec) === i)
  }
  
  await fs.writeFile(
    './performance/results/memory-test-summary.json',
    JSON.stringify(summary, null, 2)
  )
  
  console.log('\n✅ Memory tests completed!')
}

if (require.main === module) {
  runMemoryTests().catch(console.error)
}

module.exports = { MemoryProfiler, testCartMemoryUsage, testCalendarMemoryUsage }

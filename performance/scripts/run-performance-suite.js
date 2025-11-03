#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

class PerformanceSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {},
      passed: 0,
      failed: 0,
      warnings: []
    }
  }

  async ensureResultsDir() {
    const resultsDir = path.join(__dirname, '../results')
    try {
      await fs.access(resultsDir)
    } catch {
      await fs.mkdir(resultsDir, { recursive: true })
      console.log('📁 Created results directory')
    }
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`🏃 Running: ${command} ${args.join(' ')}`)
      
      const proc = spawn(command, args, {
        stdio: 'pipe',
        ...options
      })
      
      let stdout = ''
      let stderr = ''
      
      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
        if (options.verbose) {
          process.stdout.write(data)
        }
      })
      
      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
        if (options.verbose) {
          process.stderr.write(data)
        }
      })
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code })
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`))
        }
      })
    })
  }

  async runVitestPerformanceTests() {
    console.log('\n🧪 Running Vitest Performance Tests...')
    
    try {
      const result = await this.runCommand('npm', ['run', 'test', '--', 'performance'], {
        cwd: process.cwd(),
        verbose: true
      })
      
      this.results.tests.vitest = {
        status: 'passed',
        duration: this.extractDuration(result.stdout),
        output: result.stdout
      }
      
      this.results.passed++
      console.log('✅ Vitest performance tests passed')
      
    } catch (error) {
      this.results.tests.vitest = {
        status: 'failed',
        error: error.message
      }
      
      this.results.failed++
      console.log('❌ Vitest performance tests failed:', error.message)
    }
  }

  async runArtilleryLoadTest() {
    console.log('\n🎯 Running Artillery Load Tests...')
    
    try {
      // Check if server is running
      try {
        const response = await fetch('http://localhost:3000/api/health')
        if (!response.ok) throw new Error('Server not responding')
      } catch {
        this.results.warnings.push('Server may not be running on port 3000. Artillery tests may fail.')
      }
      
      const result = await this.runCommand('npx', ['artillery', 'run', 'performance/config/artillery.yml'], {
        cwd: process.cwd(),
        verbose: true
      })
      
      const metrics = this.parseArtilleryMetrics(result.stdout)
      
      this.results.tests.artillery = {
        status: 'passed',
        metrics,
        output: result.stdout
      }
      
      this.results.passed++
      console.log('✅ Artillery load tests passed')
      
    } catch (error) {
      this.results.tests.artillery = {
        status: 'failed',
        error: error.message
      }
      
      this.results.failed++
      console.log('❌ Artillery load tests failed:', error.message)
    }
  }

  async runLighthouseAudit() {
    console.log('\n🔍 Running Lighthouse Performance Audit...')
    
    try {
      const result = await this.runCommand('node', ['performance/scripts/lighthouse-audit.js'], {
        cwd: process.cwd(),
        verbose: true
      })
      
      // Try to read lighthouse results
      try {
        const lighthouseResults = await fs.readFile('./performance/results/lighthouse-results.json', 'utf8')
        const data = JSON.parse(lighthouseResults)
        
        this.results.tests.lighthouse = {
          status: 'passed',
          results: data,
          averageScore: data.reduce((sum, r) => sum + r.performance, 0) / data.length
        }
        
        this.results.passed++
        console.log('✅ Lighthouse audit completed')
        
      } catch (readError) {
        throw new Error('Could not read lighthouse results')
      }
      
    } catch (error) {
      this.results.tests.lighthouse = {
        status: 'failed',
        error: error.message
      }
      
      this.results.failed++
      console.log('❌ Lighthouse audit failed:', error.message)
    }
  }

  async runMemoryProfiling() {
    console.log('\n🧠 Running Memory Profiling...')
    
    try {
      const result = await this.runCommand('node', ['performance/scripts/memory-profiler.js'], {
        cwd: process.cwd(),
        verbose: true
      })
      
      // Try to read memory results
      try {
        const memoryResults = await fs.readFile('./performance/results/memory-test-summary.json', 'utf8')
        const data = JSON.parse(memoryResults)
        
        this.results.tests.memory = {
          status: 'passed',
          results: data
        }
        
        // Check for memory leaks
        if (data.tests.cart?.leakDetection?.detected || data.tests.calendar?.leakDetection?.detected) {
          this.results.warnings.push('Potential memory leaks detected in memory profiling')
        }
        
        this.results.passed++
        console.log('✅ Memory profiling completed')
        
      } catch (readError) {
        throw new Error('Could not read memory profiling results')
      }
      
    } catch (error) {
      this.results.tests.memory = {
        status: 'failed',
        error: error.message
      }
      
      this.results.failed++
      console.log('❌ Memory profiling failed:', error.message)
    }
  }

  parseArtilleryMetrics(output) {
    const metrics = {}
    
    // Extract key metrics from Artillery output
    const lines = output.split('\n')
    
    for (const line of lines) {
      if (line.includes('http.response_time')) {
        const match = line.match(/min: ([\d.]+).*max: ([\d.]+).*median: ([\d.]+).*p95: ([\d.]+).*p99: ([\d.]+)/)
        if (match) {
          metrics.responseTime = {
            min: parseFloat(match[1]),
            max: parseFloat(match[2]),
            median: parseFloat(match[3]),
            p95: parseFloat(match[4]),
            p99: parseFloat(match[5])
          }
        }
      }
      
      if (line.includes('http.requests')) {
        const match = line.match(/(\d+)/)
        if (match) {
          metrics.totalRequests = parseInt(match[1])
        }
      }
      
      if (line.includes('http.codes.200')) {
        const match = line.match(/(\d+)/)
        if (match) {
          metrics.successfulRequests = parseInt(match[1])
        }
      }
    }
    
    return metrics
  }

  extractDuration(output) {
    const match = output.match(/Time:\s+([\d.]+)/)
    return match ? parseFloat(match[1]) : null
  }

  generateSummary() {
    const total = this.results.passed + this.results.failed
    const successRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0
    
    this.results.summary = {
      totalTests: total,
      passed: this.results.passed,
      failed: this.results.failed,
      successRate: `${successRate}%`,
      warnings: this.results.warnings.length,
      duration: Date.now() - new Date(this.results.timestamp).getTime(),
      recommendations: this.generateRecommendations()
    }
  }

  generateRecommendations() {
    const recommendations = []
    
    // Lighthouse recommendations
    if (this.results.tests.lighthouse?.averageScore < 80) {
      recommendations.push('Lighthouse performance score below 80. Consider optimizing images, CSS, and JavaScript.')
    }
    
    // Artillery recommendations
    if (this.results.tests.artillery?.metrics?.responseTime?.p95 > 1000) {
      recommendations.push('95th percentile response time above 1 second. Consider API optimization.')
    }
    
    // Memory recommendations
    if (this.results.warnings.some(w => w.includes('memory leak'))) {
      recommendations.push('Memory leaks detected. Review component cleanup and event listeners.')
    }
    
    // General recommendations
    if (this.results.failed > 0) {
      recommendations.push('Some performance tests failed. Review failed test details and address issues.')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All performance tests passed! Consider setting more aggressive performance budgets.')
    }
    
    return recommendations
  }

  async saveResults() {
    const filename = `./performance/results/performance-suite-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    await fs.writeFile(filename, JSON.stringify(this.results, null, 2))
    console.log(`📊 Results saved to ${filename}`)
  }

  printSummary() {
    console.log('\n' + '='.repeat(50))
    console.log('📈 PERFORMANCE TEST SUITE SUMMARY')
    console.log('='.repeat(50))
    
    console.log(`📊 Tests: ${this.results.summary.passed}/${this.results.summary.totalTests} passed (${this.results.summary.successRate})`)
    console.log(`⏱️  Duration: ${(this.results.summary.duration / 1000).toFixed(1)}s`)
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`)
    
    console.log('\n📋 Test Results:')
    Object.entries(this.results.tests).forEach(([test, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌'
      console.log(`  ${status} ${test}: ${result.status}`)
    })
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      this.results.warnings.forEach(warning => {
        console.log(`  • ${warning}`)
      })
    }
    
    console.log('\n💡 Recommendations:')
    this.results.summary.recommendations.forEach(rec => {
      console.log(`  • ${rec}`)
    })
    
    console.log('\n' + '='.repeat(50))
  }

  async run() {
    console.log('🚀 Starting Performance Test Suite...\n')
    
    await this.ensureResultsDir()
    
    // Run all performance tests
    await this.runVitestPerformanceTests()
    await this.runMemoryProfiling()
    await this.runLighthouseAudit()
    await this.runArtilleryLoadTest()
    
    this.generateSummary()
    await this.saveResults()
    this.printSummary()
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0)
  }
}

// CLI execution
if (require.main === module) {
  const suite = new PerformanceSuite()
  suite.run().catch(error => {
    console.error('❌ Performance suite failed:', error)
    process.exit(1)
  })
}

module.exports = PerformanceSuite

module.exports = {
  // Performance budgets and thresholds
  budgets: {
    lighthouse: {
      performance: 85,        // Lighthouse performance score
      fcp: 1500,             // First Contentful Paint (ms)
      lcp: 2000,             // Largest Contentful Paint (ms)
      interactive: 3000,     // Time to Interactive (ms)
      speedIndex: 2500,      // Speed Index
      cls: 0.1,              // Cumulative Layout Shift
    },
    
    api: {
      maxResponseTime: 200,   // API response time (ms)
      p95ResponseTime: 500,   // 95th percentile (ms)
      maxConcurrentUsers: 100,
      maxErrorRate: 0.05,     // 5% error rate
    },
    
    memory: {
      maxHeapSize: 100,       // MB
      maxLeakGrowth: 10,      // % growth rate
      maxGCPause: 50,         // ms
    },
    
    database: {
      maxQueryTime: 100,      // ms
      maxConnectionTime: 50,  // ms
      maxConcurrentQueries: 50,
    },
    
    components: {
      maxRenderTime: 50,      // ms
      maxCalendarRender: 100, // ms for 100 events
      maxCatalogRender: 50,   // ms for 50 products
      maxCartUpdate: 30,      // ms for 20 items
    }
  },
  
  // Load testing scenarios
  loadTesting: {
    warmup: {
      duration: 30,
      arrivalRate: 5
    },
    
    load: {
      duration: 120,
      arrivalRate: 20
    },
    
    spike: {
      duration: 60,
      arrivalRate: 50
    },
    
    stress: {
      duration: 180,
      arrivalRate: 100
    }
  },
  
  // Browser and environment settings
  browsers: {
    chrome: {
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    },
    
    viewport: {
      width: 1200,
      height: 800
    },
    
    network: {
      throttling: 'simulate',
      latency: 150,
      downloadThroughput: 1.6 * 1024 * 1024 / 8,  // 1.6Mbps
      uploadThroughput: 750 * 1024 / 8             // 750Kbps
    }
  },
  
  // Test data generation
  testData: {
    products: {
      count: 50,
      types: ['camp', 'birthday', 'workshop', 'subscription']
    },
    
    events: {
      count: 100,
      dateRange: {
        start: '2024-12-01',
        end: '2024-12-31'
      }
    },
    
    users: {
      concurrent: 20,
      sessions: 100
    }
  },
  
  // Monitoring and alerts
  monitoring: {
    sampleInterval: 1000,    // ms
    retentionPeriod: 7,      // days
    alertThresholds: {
      responseTime: 1000,    // ms
      errorRate: 0.05,       // 5%
      memoryUsage: 80        // % of available
    }
  },
  
  // Output and reporting
  reporting: {
    formats: ['json', 'html', 'console'],
    outputDir: './performance/results',
    includeCharts: true,
    includeRecommendations: true
  },
  
  // CI/CD integration
  ci: {
    failOnBudgetExceeded: true,
    failOnPerformanceRegression: true,
    baselineComparison: true,
    slackNotifications: false
  }
}

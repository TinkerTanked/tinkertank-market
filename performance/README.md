# Performance Testing Suite

Comprehensive performance testing for TinkerTank Market application covering component performance, API response times, database optimization, load testing, and memory usage monitoring.

## Quick Start

```bash
# Run all performance tests
npm run perf:all

# Run individual test suites
npm run test:performance      # Component performance tests
npm run perf:lighthouse      # Web performance audit
npm run perf:memory          # Memory profiling
npm run perf:load           # Load testing with Artillery
npm run perf:budget         # Check performance budget
```

## Test Categories

### 1. Component Performance Tests (`performance/tests/component-performance.test.ts`)

Tests rendering performance of React components:

- **Calendar Widget**: 100 events render under 100ms
- **Product Catalog**: 50 products render under 50ms  
- **Cart Updates**: 20 items update under 30ms
- **Search Filtering**: 200 products filter under 20ms
- **Memory Leak Detection**: Cart operations memory usage

**Thresholds:**
- Calendar render: < 100ms (100 events)
- Catalog render: < 50ms (50 products)
- Cart update: < 30ms (20 items)
- Search filter: < 20ms (200 products)

### 2. Database Performance Tests (`performance/tests/database-performance.test.ts`)

Tests database query optimization:

- **Large Product Queries**: 100 products with relations under 200ms
- **Concurrent Bookings**: 10 simultaneous queries under 500ms
- **Availability Checks**: Complex calendar queries under 150ms
- **Bulk Operations**: 50 booking creation under 300ms
- **Connection Pool**: 20 concurrent connections under 100ms each
- **Aggregation Queries**: Complex stats under 250ms

**Thresholds:**
- Product queries: < 200ms
- Concurrent queries: < 500ms total
- Availability checks: < 150ms
- Bulk operations: < 300ms
- Connection pool: < 100ms each
- Aggregations: < 250ms

### 3. API Performance Tests (`performance/tests/api-performance.test.ts`)

Tests REST API response times:

- **Health Check**: Response under 50ms
- **Product API**: Products list under 200ms
- **Availability API**: Date availability under 300ms
- **Cart Operations**: Add/update/remove under 150ms
- **Booking API**: Create booking under 500ms
- **Concurrent Requests**: 20 parallel requests under 1000ms
- **Rate Limiting**: Graceful handling of 50 rapid requests

**Thresholds:**
- Health check: < 50ms
- Product API: < 200ms
- Cart operations: < 150ms
- Booking creation: < 500ms
- Concurrent load: < 1000ms total

### 4. Load Testing (`performance/config/artillery.yml`)

Artillery-based load testing scenarios:

**Test Scenarios:**
- **Browse & Book**: 40% - Catalog browsing → camp booking
- **Birthday Booking**: 30% - Birthday party booking flow
- **Cart Operations**: 20% - Add/update/remove cart items
- **Calendar Usage**: 10% - Admin calendar event loading

**Load Phases:**
- **Warmup**: 30s @ 5 users/sec
- **Load Test**: 120s @ 20 users/sec
- **Spike Test**: 60s @ 50 users/sec

**Metrics Tracked:**
- Response times (min/max/median/p95/p99)
- Request success rate
- Error rate by endpoint
- Throughput (requests/second)

### 5. Lighthouse Web Performance (`performance/scripts/lighthouse-audit.js`)

Automated web performance auditing:

**Pages Tested:**
- Home page (`/`)
- Camps catalog (`/camps`)
- Birthdays (`/birthdays`)
- Subscriptions (`/subscriptions`)

**Metrics:**
- **Performance Score**: Target > 85/100
- **First Contentful Paint**: Target < 1.5s
- **Largest Contentful Paint**: Target < 2.0s
- **Time to Interactive**: Target < 3.0s
- **Speed Index**: Target < 2.5s
- **Server Response Time**: Target < 200ms

**Optimizations Checked:**
- Image optimization and responsive images
- CSS/JavaScript minification
- Unused code elimination
- Text compression (gzip/brotli)
- Server response times

### 6. Memory Profiling (`performance/scripts/memory-profiler.js`)

Memory usage monitoring and leak detection:

**Tests:**
- **Cart Memory Usage**: 1000 cart operations memory tracking
- **Calendar Memory Usage**: 12 months of events memory tracking
- **Memory Leak Detection**: Growth rate analysis
- **Garbage Collection**: GC pause monitoring

**Monitoring:**
- Heap memory usage (initial/final/peak)
- Memory growth rate analysis
- ArrayBuffer usage tracking
- localStorage performance
- Component cleanup verification

## Performance Budgets

Performance budgets are defined in [`performance/config/performance.config.js`](./config/performance.config.js):

```javascript
budgets: {
  lighthouse: {
    performance: 85,      // Score
    fcp: 1500,           // ms
    lcp: 2000,           // ms
    interactive: 3000,   // ms
  },
  api: {
    maxResponseTime: 200,    // ms
    p95ResponseTime: 500,    // ms
    maxErrorRate: 0.05,      // 5%
  },
  memory: {
    maxHeapSize: 100,        // MB
    maxLeakGrowth: 10,       // %
  }
}
```

## Running Tests

### Prerequisites

1. **Server Running**: Ensure development server is running on port 3000:
   ```bash
   npm run dev
   ```

2. **Database**: Ensure PostgreSQL database is running and seeded:
   ```bash
   npm run db:setup
   ```

3. **Dependencies**: Install performance testing dependencies:
   ```bash
   npm install
   ```

### Individual Test Suites

```bash
# Component performance (Vitest)
npm run test:performance

# Lighthouse web performance audit
npm run perf:lighthouse

# Memory profiling and leak detection
npm run perf:memory

# Artillery load testing
npm run perf:load

# Check performance budget compliance
npm run perf:budget
```

### Complete Performance Suite

```bash
# Run all performance tests with summary report
npm run perf:all
```

## Results and Reporting

Test results are saved to `./performance/results/`:

- `lighthouse-results.json` - Lighthouse audit data
- `performance-summary.json` - Lighthouse summary with budget check
- `memory-test-summary.json` - Memory profiling results
- `artillery-report.json` - Load testing metrics
- `performance-suite-[timestamp].json` - Complete test suite results

### Reading Results

**Lighthouse Results:**
```json
{
  "url": "http://localhost:3000",
  "performance": 87.3,
  "fcp": 1247,
  "lcp": 1856,
  "interactive": 2435
}
```

**Artillery Metrics:**
```json
{
  "responseTime": {
    "min": 12.4,
    "max": 453.2,
    "median": 67.8,
    "p95": 187.3,
    "p99": 298.7
  },
  "totalRequests": 2847,
  "successfulRequests": 2834
}
```

**Memory Profile:**
```json
{
  "memory": {
    "initial": "45.2 MB",
    "final": "47.1 MB", 
    "peak": "52.3 MB",
    "change": "+1.9 MB"
  },
  "leakDetection": {
    "detected": false,
    "growthRate": "4.2%"
  }
}
```

## Performance Optimization Tips

### Component Performance
- Use `React.memo` for expensive components
- Implement virtual scrolling for large lists
- Optimize re-renders with `useMemo` and `useCallback`
- Lazy load components with `React.lazy`

### API Performance  
- Implement response caching (Redis)
- Use database query optimization
- Add request compression (gzip)
- Implement API rate limiting

### Database Performance
- Add proper indexes on queried fields
- Use connection pooling
- Optimize complex queries with EXPLAIN
- Implement query result caching

### Memory Performance
- Clean up event listeners in `useEffect` cleanup
- Avoid memory leaks in closures
- Use weak references where appropriate
- Monitor and limit localStorage usage

### Web Performance
- Optimize images (WebP, proper sizing)
- Implement code splitting
- Use CDN for static assets
- Enable compression (gzip/brotli)
- Minimize CSS/JavaScript bundles

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Performance Tests
  run: |
    npm run build
    npm run dev &
    sleep 10
    npm run perf:all
    npm run perf:budget
```

Performance tests will fail the build if:
- Lighthouse performance score < 85
- API response times exceed thresholds  
- Memory leaks detected
- Load testing error rate > 5%

## Monitoring and Alerts

Consider integrating with monitoring tools:

- **Application Performance Monitoring**: New Relic, DataDog
- **Real User Monitoring**: Google Analytics, Sentry
- **Synthetic Monitoring**: Pingdom, Uptime Robot
- **Database Monitoring**: pgAdmin, DataDog Database Monitoring

## Troubleshooting

**Common Issues:**

1. **Server Not Running**: Ensure `npm run dev` is running on port 3000
2. **Database Connection**: Check PostgreSQL is running and accessible
3. **Chrome Launch Failed**: Install Chrome or use headless mode
4. **Artillery Timeout**: Reduce concurrent users or increase timeout
5. **Memory Tests Fail**: Run with `--expose-gc` flag for garbage collection

**Debug Mode:**
```bash
# Run with verbose output
DEBUG=* npm run perf:all

# Run individual tests with console output
npm run test:performance -- --reporter=verbose
```

## Contributing

When adding new features, ensure:

1. **Add Performance Tests**: Cover new components and APIs
2. **Update Budgets**: Adjust performance thresholds if needed
3. **Document Changes**: Update this README with new test scenarios
4. **Monitor Regressions**: Run performance tests before merging

Performance testing is critical for user experience. Maintain these tests as you would unit tests!

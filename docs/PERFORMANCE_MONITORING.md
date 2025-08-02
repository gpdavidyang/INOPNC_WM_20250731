# Performance Monitoring System Documentation

## Overview

This document describes the comprehensive performance monitoring system implemented for the INOPNC Work Management System. The system provides real-time error tracking, performance metrics, Core Web Vitals monitoring, and Real User Monitoring (RUM) capabilities.

## Architecture

### Components

1. **Sentry Integration** - Error tracking and performance monitoring
2. **Core Web Vitals** - LCP, FID, CLS, FCP, INP, TTFB tracking
3. **Custom Performance Metrics** - Construction app-specific metrics
4. **Real User Monitoring (RUM)** - Session tracking and user behavior analysis
5. **API Monitoring** - Server-side performance tracking

## Configuration

### Environment Variables

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_org_name
SENTRY_PROJECT=your_project_name
SENTRY_AUTH_TOKEN=your_auth_token # For source map uploads

# Optional: Release tracking
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=auto_populated_by_vercel
```

### Sentry Setup

1. **Client Configuration** (`sentry.client.config.ts`)
   - Browser-side error and performance tracking
   - Session replay for error reproduction
   - Performance monitoring with 10% sample rate in production

2. **Server Configuration** (`sentry.server.config.ts`)
   - Server-side error tracking
   - API performance monitoring

3. **Edge Configuration** (`sentry.edge.config.ts`)
   - Middleware and edge function monitoring

## Core Web Vitals Tracking

### Metrics Tracked

1. **LCP (Largest Contentful Paint)**
   - Good: < 2.5s
   - Needs Improvement: 2.5s - 4s
   - Poor: > 4s

2. **FID (First Input Delay)**
   - Good: < 100ms
   - Needs Improvement: 100ms - 300ms
   - Poor: > 300ms

3. **CLS (Cumulative Layout Shift)**
   - Good: < 0.1
   - Needs Improvement: 0.1 - 0.25
   - Poor: > 0.25

4. **Additional Metrics**
   - FCP (First Contentful Paint)
   - INP (Interaction to Next Paint)
   - TTFB (Time to First Byte)

### Implementation

```typescript
import { initWebVitals } from '@/lib/monitoring/web-vitals'

// Initialize in your app
initWebVitals()
```

## Custom Performance Metrics

### Construction App-Specific Metrics

1. **API Response Time**
   - Tracks all API calls with performance data
   - Alerts on slow responses (> 1s)

2. **Daily Report Operations**
   - Load time
   - Save time
   - Submit time

3. **Image Upload Performance**
   - Upload duration
   - Upload speed (MB/s)
   - File size tracking

4. **Offline Sync Performance**
   - Items synced
   - Sync duration
   - Items per second

5. **Component Render Performance**
   - Tracks React component render times
   - Alerts on slow renders (> 16ms)

### Usage Examples

```typescript
// Track API calls
const data = await performanceTracker.trackApiCall(
  '/api/daily-reports',
  async () => {
    return await fetch('/api/daily-reports')
  }
)

// Track component performance
import { useComponentPerformance } from '@/lib/monitoring/performance-metrics'

function MyComponent() {
  const { trackRender } = useComponentPerformance('MyComponent')
  
  useEffect(() => {
    trackRender()
  })
  
  return <div>...</div>
}

// HOC for automatic tracking
import { withPerformanceTracking } from '@/lib/monitoring/performance-metrics'

const TrackedComponent = withPerformanceTracking(MyComponent, 'MyComponent')
```

## Real User Monitoring (RUM)

### Features

1. **Session Tracking**
   - Unique session IDs
   - Session duration (30 minutes)
   - Page views per session
   - User interactions count
   - Error tracking per session

2. **Device Information**
   - Device type (mobile/desktop)
   - Browser and OS detection
   - Viewport dimensions
   - Connection type and speed

3. **User Interaction Tracking**
   - Click events
   - Form submissions
   - Slow interactions (> 100ms)

4. **Resource Timing**
   - Script load times
   - Image load times
   - API call durations
   - Slow resource alerts (> 1s)

### Sample Rate

- Production: 10% of users
- Development: 100% of users

## API Monitoring

### Server-Side Performance Tracking

```typescript
import { withApiMonitoring } from '@/lib/monitoring/api-monitoring'

// Wrap your API route handlers
export const GET = withApiMonitoring(
  async (request: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ data })
  },
  { name: 'getDailyReports' }
)
```

### Database Query Monitoring

```typescript
import { withDatabaseMonitoring } from '@/lib/monitoring/api-monitoring'

const data = await withDatabaseMonitoring(
  'get_daily_reports',
  async () => {
    return await supabase
      .from('daily_reports')
      .select('*')
  }
)
```

## Performance Budgets

### Thresholds

1. **Page Load**
   - Target: < 3s on 3G
   - Maximum: 5s

2. **API Response**
   - Target: < 200ms
   - Warning: > 500ms
   - Error: > 1000ms

3. **Image Upload**
   - Target: > 1 MB/s
   - Warning: < 0.5 MB/s

4. **Component Render**
   - Target: < 16ms (60fps)
   - Warning: > 16ms
   - Error: > 50ms

## Monitoring Dashboard

### Available Metrics

1. **Real-Time Metrics**
   - Active users
   - Current error rate
   - Average response time
   - Core Web Vitals scores

2. **Historical Data**
   - Performance trends
   - Error trends
   - User session analytics
   - Device and browser breakdown

3. **Alerts**
   - Error rate spikes
   - Performance degradation
   - Slow API endpoints
   - Failed deployments

## Best Practices

### 1. Error Handling

```typescript
try {
  // Your code
} catch (error) {
  // Capture with context
  captureException(error, {
    component: 'DailyReportForm',
    action: 'submit',
    userId: user.id
  })
}
```

### 2. Performance Marks

```typescript
import { performanceMark } from '@/lib/monitoring/web-vitals'

// Start timing
performanceMark.start('daily-report-load')

// Your async operation
await loadDailyReport()

// End timing
const duration = performanceMark.end('daily-report-load')
```

### 3. Custom Metrics

```typescript
// Track custom business metrics
performanceTracker.trackDailyReportOperation('submit', duration)
performanceTracker.trackImageUpload(fileSize, duration)
performanceTracker.trackOfflineSync(itemCount, duration)
```

## Troubleshooting

### Common Issues

1. **Sentry Not Capturing Events**
   - Check SENTRY_DSN is set correctly
   - Verify Sentry initialization in all configs
   - Check browser console for errors

2. **Performance Metrics Not Showing**
   - Ensure PerformanceObserver is supported
   - Check if user is sampled (10% in production)
   - Verify metrics are being sent to API

3. **RUM Data Missing**
   - Check session storage is enabled
   - Verify user sampling rate
   - Check network requests to /api/analytics/realtime

### Debug Mode

Enable debug logging in development:

```typescript
Sentry.init({
  debug: true,
  // other config
})
```

## Privacy Considerations

1. **Data Anonymization**
   - No PII in error messages
   - Masked text in session replays
   - Blocked media in replays

2. **User Consent**
   - Performance monitoring is anonymous
   - Session replay only on errors
   - Users can opt-out via browser settings

3. **Data Retention**
   - Sentry: 90 days (configurable)
   - Custom metrics: 30 days
   - Session data: 7 days

## Future Enhancements

1. **Synthetic Monitoring**
   - Automated testing from multiple locations
   - Uptime monitoring
   - Performance regression detection

2. **Advanced Analytics**
   - User journey analysis
   - Conversion funnel tracking
   - A/B testing integration

3. **Machine Learning**
   - Anomaly detection
   - Predictive alerts
   - Automatic issue grouping

## Integration with CI/CD

### Deployment Tracking

```yaml
# .github/workflows/deploy.yml
- name: Create Sentry release
  uses: getsentry/action-release@v1
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
    SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
  with:
    environment: production
    version: ${{ github.sha }}
```

### Source Map Upload

Automatically handled by `@sentry/nextjs` during build process.

## Conclusion

The performance monitoring system provides comprehensive insights into application performance, user experience, and system health. By tracking Core Web Vitals, custom metrics, and real user behavior, we can proactively identify and resolve issues before they impact users.
# Performance Budgets & Alerting System

## Overview

The Performance Budgets & Alerting System provides real-time monitoring of application performance metrics with configurable thresholds and automated alerting. This system helps maintain optimal user experience by proactively identifying and alerting on performance degradations.

## Features

- **Configurable Performance Budgets**: Set custom thresholds for Core Web Vitals and custom metrics
- **Real-time Alerting**: Immediate notifications when performance budgets are violated
- **Multiple Severity Levels**: Good, Warning, and Critical alert levels
- **Integration with Monitoring**: Seamlessly integrates with Sentry and custom analytics
- **Dashboard Configuration**: Web-based UI for managing performance budgets
- **Export/Import**: Configuration backup and sharing capabilities

## Performance Metrics Monitored

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: Page loading performance
- **INP (Interaction to Next Paint)**: User interaction responsiveness  
- **CLS (Cumulative Layout Shift)**: Visual stability
- **FCP (First Contentful Paint)**: Time to first content
- **TTFB (Time to First Byte)**: Server response time

### Custom Construction App Metrics
- **API Response Time**: Average API endpoint response times
- **Daily Report Load Time**: Time to load daily report pages
- **Image Upload Time**: File upload performance
- **Offline Sync Time**: Time to synchronize offline data
- **Component Render Time**: React component rendering performance
- **Session Error Rate**: Percentage of sessions with errors
- **Page Load Error Rate**: Percentage of failed page loads

## Default Performance Budgets

### Core Web Vitals Thresholds

| Metric | Good | Warning | Critical | Unit |
|--------|------|---------|----------|------|
| LCP | ≤ 2.5s | > 4s | > 6s | ms |
| INP | ≤ 200ms | > 500ms | > 1s | ms |
| CLS | ≤ 0.1 | > 0.25 | > 0.5 | - |
| FCP | ≤ 1.8s | > 3s | > 4.5s | ms |
| TTFB | ≤ 800ms | > 1.8s | > 3s | ms |

### Custom Metrics Thresholds

| Metric | Good | Warning | Critical | Unit |
|--------|------|---------|----------|------|
| API Response Time | ≤ 200ms | > 500ms | > 1s | ms |
| Daily Report Load | ≤ 1s | > 2s | > 3s | ms |
| Image Upload | ≤ 5s | > 10s | > 20s | s |
| Offline Sync | ≤ 2s | > 5s | > 10s | s |
| Component Render | ≤ 16ms | > 50ms | > 100ms | ms |
| Session Error Rate | ≤ 1% | > 5% | > 10% | % |
| Page Load Error Rate | ≤ 0.5% | > 2% | > 5% | % |

## Implementation

### Automatic Integration

Performance budget checking is automatically integrated into:

1. **Web Vitals Tracking**: All Core Web Vitals measurements are checked against budgets
2. **API Monitoring**: API response times are monitored via `withApiMonitoring` wrapper
3. **Custom Metrics**: All custom performance metrics trigger budget checks
4. **Real User Monitoring**: Session-level metrics are continuously monitored

### Manual Integration

For custom scenarios, use the budget checking API:

```typescript
import { checkPerformanceBudget } from '@/lib/monitoring/performance-budgets'

// Check a metric against its budget
const alert = checkPerformanceBudget('custom_metric', value, {
  component: 'MyComponent',
  timestamp: new Date().toISOString()
})

if (alert) {
  console.warn('Performance budget violation:', alert)
}
```

### Alert Handling

Register alert handlers to respond to budget violations:

```typescript
import { onPerformanceAlert } from '@/lib/monitoring/performance-budgets'

onPerformanceAlert((alert) => {
  console.log(`Performance alert: ${alert.budget.name} = ${alert.value}${alert.budget.unit}`)
  
  // Custom alert handling logic
  if (alert.severity === 'critical') {
    // Send notification to administrators
    sendCriticalAlert(alert)
  }
})
```

## Configuration Management

### Web Interface

Access performance budget configuration via:
1. Admin Dashboard → Performance Monitoring → Budget Configuration
2. Navigate to `/dashboard/performance` (admin users only)

### Configuration Features

- **Enable/Disable Budgets**: Toggle monitoring for specific metrics
- **Threshold Adjustment**: Modify good, warning, and critical thresholds
- **Real-time Preview**: See immediate effect of threshold changes
- **Export Configuration**: Download budget settings as JSON
- **Import Configuration**: Upload saved configurations
- **Reset to Defaults**: Restore original settings

### Programmatic Configuration

```typescript
import { performanceBudgetManager } from '@/lib/monitoring/performance-budgets'

// Update a specific budget
performanceBudgetManager.updateBudget('LCP', {
  thresholds: { good: 2000, warning: 3500, critical: 5000 }
})

// Add custom budget
performanceBudgetManager.addCustomBudget({
  name: 'Custom Operation Time',
  metric: 'custom_operation_time',
  thresholds: { good: 100, warning: 250, critical: 500 },
  unit: 'ms',
  enabled: true
})
```

## Alerting Channels

### Sentry Integration
- **Warning Level**: Budget violations logged as warnings in Sentry
- **Critical Level**: Budget violations logged as errors in Sentry
- **Context**: Full performance context attached to alerts
- **Breadcrumbs**: Performance events tracked in error breadcrumbs

### Analytics Integration
- **Real-time Events**: Budget violations sent to analytics system
- **Event Data**: Includes metric value, thresholds, and metadata
- **Trend Analysis**: Historical violation data for trend analysis

### Console Logging
- **Development**: All budget violations logged to console
- **Production**: Critical violations logged with reduced verbosity

## Best Practices

### Setting Appropriate Thresholds

1. **Baseline Measurement**: Establish current performance baseline before setting budgets
2. **User Impact Focus**: Set thresholds based on user experience impact, not arbitrary numbers
3. **Gradual Improvement**: Start with achievable targets and progressively tighten
4. **Context Awareness**: Consider device capabilities and network conditions

### Budget Management

1. **Regular Review**: Review and adjust budgets monthly based on performance trends
2. **Alert Fatigue**: Avoid setting thresholds too aggressively to prevent alert fatigue
3. **Critical Focus**: Ensure critical alerts require immediate attention
4. **Documentation**: Document rationale for threshold choices

### Development Workflow

1. **Pre-deployment Testing**: Run performance tests against budgets before deploying
2. **Continuous Monitoring**: Monitor budget violations in production
3. **Performance Regression Detection**: Use alerts to catch performance regressions early
4. **Team Awareness**: Ensure development team understands budget implications

## API Reference

### Performance Budget Manager

```typescript
interface PerformanceBudgetManager {
  getBudgets(): PerformanceBudget[]
  getBudget(metric: string): PerformanceBudget | undefined
  updateBudget(metric: string, budget: Partial<PerformanceBudget>): void
  addCustomBudget(budget: PerformanceBudget): void
  removeBudget(metric: string): void
  checkBudget(metric: string, value: number, metadata?: Record<string, any>): PerformanceAlert | null
  getRecentAlerts(limit?: number): PerformanceAlert[]
  clearAlerts(): void
}
```

### Performance Budget Interface

```typescript
interface PerformanceBudget {
  name: string
  metric: string
  thresholds: {
    good: number
    warning: number
    critical: number
  }
  unit: string
  enabled: boolean
}
```

### Performance Alert Interface

```typescript
interface PerformanceAlert {
  id: string
  budget: PerformanceBudget
  value: number
  severity: 'good' | 'warning' | 'critical'
  timestamp: Date
  metadata?: Record<string, any>
}
```

## Troubleshooting

### Common Issues

1. **No Alerts Triggering**
   - Check if budgets are enabled
   - Verify threshold values are appropriate
   - Ensure metrics are being collected

2. **Too Many Alerts**
   - Review threshold settings
   - Consider disabling non-critical budgets temporarily
   - Adjust warning thresholds to be less sensitive

3. **Configuration Not Saving**
   - Verify admin permissions
   - Check network connectivity
   - Review browser console for errors

4. **Metrics Not Being Monitored**
   - Ensure performance monitoring is initialized
   - Check that Web Vitals library is loaded
   - Verify custom metrics are being recorded

### Debug Mode

Enable debug logging for performance budgets:

```typescript
// In development environment
console.log('Performance Budget Status:', performanceBudgetManager.getBudgetStatus())
console.log('Recent Alerts:', performanceBudgetManager.getRecentAlerts())
```

## Future Enhancements

### Planned Features

1. **Machine Learning Thresholds**: Automatically adjust budgets based on historical data
2. **Contextual Budgets**: Different thresholds for different user segments
3. **Performance Scoring**: Unified performance score across all metrics
4. **Automated Remediation**: Automatic performance optimization suggestions
5. **Advanced Alerting**: Integration with Slack, email, and PagerDuty
6. **Performance Regression Testing**: Automated CI/CD performance validation

### Integration Opportunities

1. **A/B Testing**: Performance budget monitoring for experiment variants
2. **Feature Flags**: Dynamic performance requirements based on feature usage
3. **User Segmentation**: Performance budgets based on user tier or plan
4. **Geographic Optimization**: Location-based performance requirements

## Conclusion

The Performance Budgets & Alerting System provides comprehensive, real-time monitoring of application performance with configurable thresholds and multi-channel alerting. By implementing performance budgets, teams can proactively maintain optimal user experience and catch performance regressions before they impact users.

Regular monitoring, appropriate threshold setting, and responsive alert handling are key to maximizing the value of this performance management system.
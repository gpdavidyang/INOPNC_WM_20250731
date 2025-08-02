# Analytics Dashboard Infrastructure Documentation

## Overview

This document describes the comprehensive analytics dashboard infrastructure implemented for the INOPNC Work Management System. The analytics system provides real-time and historical metrics for construction site management, including daily report completion rates, material usage trends, attendance patterns, equipment utilization, and site productivity metrics.

## Database Schema

### Core Tables

1. **analytics_metrics** - Time-series data storage for individual metrics
   - Stores metric values with timestamps
   - Supports multiple metric types
   - Includes dimensions and metadata for flexible analysis

2. **analytics_daily_stats** - Aggregated daily statistics
   - Pre-computed daily summaries for performance
   - Includes all key metrics in one table
   - Optimized for dashboard queries

3. **analytics_events** - Real-time event streaming
   - Captures user actions and system events
   - Enables real-time dashboard updates
   - Supports event-driven analytics

4. **analytics_cache** - Performance optimization
   - Caches expensive calculations
   - Time-based expiration
   - Reduces database load

5. **analytics_retention_policy** - Data lifecycle management
   - Configurable retention periods by metric type
   - Supports archival and compression
   - Ensures compliance and performance

### Materialized Views

- **analytics_dashboard_summary** - Pre-computed dashboard data
  - 30-day rolling window
  - Refreshed on-demand or scheduled
  - Optimized for quick dashboard loading

## API Endpoints

### 1. Dashboard API (`/api/analytics/dashboard`)
- **GET**: Retrieve aggregated dashboard data
- Query parameters:
  - `siteId`: Filter by specific site
  - `startDate`: Beginning of date range
  - `endDate`: End of date range
- Returns summary statistics and daily breakdowns

### 2. Metrics API (`/api/analytics/metrics`)
- **GET**: Retrieve specific metric data
- **POST**: Manually trigger metric aggregation
- Query parameters:
  - `type`: Specific metric type
  - `siteId`: Filter by site
  - `days`: Number of days to retrieve
  - `organizationId`: For system admins only

### 3. Trends API (`/api/analytics/trends`)
- **GET**: Retrieve historical trends with calculations
- Shows metric changes over time
- Includes trend direction and percentage changes
- Grouped by metric type for visualization

### 4. Aggregate API (`/api/analytics/aggregate`)
- **POST**: Run full analytics aggregation
- **GET**: Check aggregation status
- System admin only
- Used for batch processing and scheduled jobs

### 5. Real-time API (`/api/analytics/realtime`)
- **GET**: Get real-time subscription configuration
- **POST**: Emit analytics events
- Enables live dashboard updates
- Supports WebSocket connections via Supabase

## Data Aggregation Functions

### Core Functions

1. **calculate_daily_report_metrics** - Report completion statistics
2. **calculate_material_usage_metrics** - Material tracking and efficiency
3. **calculate_attendance_metrics** - Worker attendance and labor hours
4. **calculate_equipment_utilization** - Equipment usage rates
5. **calculate_site_productivity** - Composite productivity score
6. **aggregate_daily_analytics** - Master aggregation function
7. **run_daily_analytics_aggregation** - Batch processing for all sites
8. **get_analytics_trends** - Historical trend analysis

### Aggregation Schedule

- Real-time: Events trigger immediate updates for critical metrics
- Hourly: Incremental updates for recent data
- Daily: Full aggregation runs at 1 AM (configurable)
- On-demand: Manual triggers available for admins

## Security & Access Control

### Role-Based Access

1. **System Admin**
   - Full access to all analytics data
   - Can run manual aggregations
   - Can configure retention policies

2. **Organization Admin**
   - Access to organization-wide analytics
   - Can view all sites in organization
   - Can trigger aggregations for their org

3. **Site Manager**
   - Access to assigned sites only
   - Cannot run manual aggregations
   - Read-only access to analytics

4. **Workers & Customers**
   - No direct analytics access
   - May see limited metrics in their dashboards

### Row Level Security (RLS)

All analytics tables have RLS policies that enforce:
- Organization isolation
- Site-based access control
- Role-based permissions
- Audit trail protection

## Performance Optimization

### Strategies Implemented

1. **Materialized Views**
   - Pre-computed dashboard summaries
   - Reduces query complexity
   - Refreshed periodically

2. **Intelligent Indexing**
   - Composite indexes on common query patterns
   - Partial indexes for filtered queries
   - BRIN indexes for time-series data

3. **Data Partitioning** (Future)
   - Monthly partitions for metrics table
   - Automatic partition management
   - Improved query performance

4. **Caching Layer**
   - Database-level caching for expensive queries
   - API-level caching with ETags
   - Client-side caching for static data

## Real-time Features

### WebSocket Integration

Using Supabase Realtime:
- Subscribe to analytics events
- Live metric updates
- Dashboard auto-refresh
- Reduced polling overhead

### Event Types

- `report_submitted` - New daily report
- `report_approved` - Report status change
- `attendance_marked` - Worker check-in/out
- `material_requested` - Material requisition
- `equipment_checked_out` - Equipment usage
- `issue_reported` - Site issues
- `metric_updated` - Aggregated metric change

## Usage Examples

### Client-Side Real-time Hook

```typescript
import { useAnalyticsRealtime } from '@/hooks/use-analytics-realtime'

function Dashboard() {
  const { events, isConnected, emitEvent } = useAnalyticsRealtime({
    siteId: 'site-123',
    eventTypes: ['report_approved', 'metric_updated'],
    onEvent: (event) => {
      // Handle real-time updates
      console.log('New event:', event)
    }
  })

  // Emit custom events
  const handleReportSubmit = async () => {
    await emitEvent('report_submitted', { reportId: 'abc123' })
  }
}
```

### API Usage

```typescript
// Fetch dashboard data
const response = await fetch('/api/analytics/dashboard?' + new URLSearchParams({
  siteId: 'site-123',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
}))

// Get specific metrics
const metrics = await fetch('/api/analytics/metrics?type=attendance_rate&days=7')

// Check trends
const trends = await fetch('/api/analytics/trends?metricType=site_productivity')
```

## Maintenance & Operations

### Daily Tasks

1. Monitor aggregation job completion
2. Check for failed events in analytics_events
3. Review cache hit rates
4. Validate data accuracy

### Weekly Tasks

1. Review analytics performance
2. Check index usage statistics
3. Clean up old cache entries
4. Analyze metric trends

### Monthly Tasks

1. Review retention policies
2. Archive old data if needed
3. Optimize slow queries
4. Update documentation

## Future Enhancements

1. **Advanced Analytics**
   - Predictive analytics for resource planning
   - Anomaly detection for safety incidents
   - Machine learning for productivity optimization

2. **Enhanced Visualizations**
   - Interactive dashboards with drill-down
   - Custom report builder
   - Mobile-optimized analytics views

3. **Integration Features**
   - Export to Excel/PDF
   - Email scheduled reports
   - Third-party BI tool integration

4. **Performance Improvements**
   - Time-series database integration
   - GraphQL API for flexible queries
   - Edge caching for global deployment

## Troubleshooting

### Common Issues

1. **Missing Data**
   - Check aggregation job status
   - Verify RLS policies
   - Review event processing logs

2. **Slow Queries**
   - Check materialized view refresh
   - Review index usage
   - Consider query optimization

3. **Real-time Not Working**
   - Verify WebSocket connection
   - Check subscription permissions
   - Review event emission logs

### Debug Queries

```sql
-- Check today's aggregation status
SELECT * FROM analytics_daily_stats 
WHERE stat_date = CURRENT_DATE 
ORDER BY updated_at DESC;

-- View recent events
SELECT * FROM analytics_events 
WHERE event_timestamp > NOW() - INTERVAL '1 hour'
ORDER BY event_timestamp DESC;

-- Check cache performance
SELECT cache_type, COUNT(*), 
       AVG(EXTRACT(EPOCH FROM (expires_at - created_at))) as avg_ttl
FROM analytics_cache
GROUP BY cache_type;
```

## Conclusion

The analytics infrastructure provides a robust foundation for data-driven decision making in construction site management. With real-time updates, historical analysis, and role-based access control, it enables stakeholders at all levels to monitor and improve site operations effectively.
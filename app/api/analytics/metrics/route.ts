import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check permissions
    if (!['site_manager', 'admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const metricType = searchParams.get('type')
    const siteId = searchParams.get('siteId')
    const days = parseInt(searchParams.get('days') || '30')
    const organizationId = searchParams.get('organizationId') || profile.organization_id

    // Validate metric type
    const validMetricTypes = [
      'daily_report_completion',
      'material_usage',
      'attendance_rate',
      'equipment_utilization',
      'site_productivity',
      'safety_incidents',
      'approval_time',
      'worker_efficiency'
    ]

    if (metricType && !validMetricTypes.includes(metricType)) {
      return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from('analytics_metrics')
      .select('*')
      .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('metric_date', { ascending: false })

    // Apply filters
    if (profile.role !== 'system_admin') {
      query = query.eq('organization_id', profile.organization_id)
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    if (metricType) {
      query = query.eq('metric_type', metricType)
    }

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    // For site managers, filter by their sites
    if (profile.role === 'site_manager') {
      const { data: assignedSites } = await supabase
        .from('site_members')
        .select('site_id')
        .eq('user_id', user.id)
        .eq('role', 'site_manager')

      if (assignedSites && assignedSites.length > 0) {
        const siteIds = assignedSites.map(s => s.site_id)
        query = query.in('site_id', siteIds)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching metrics:', error)
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    // Group metrics by type if no specific type requested
    const groupedMetrics = metricType ? data : data?.reduce((acc, metric) => {
      if (!acc[metric.metric_type]) {
        acc[metric.metric_type] = []
      }
      acc[metric.metric_type].push(metric)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      data: metricType ? data : groupedMetrics,
      count: data?.length || 0,
      filters: {
        type: metricType,
        siteId,
        days,
        organizationId: profile.role === 'system_admin' ? organizationId : profile.organization_id
      }
    })

  } catch (error) {
    console.error('Analytics metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for storing performance metrics and triggering aggregation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if request has a body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
    }
    
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    // Check if this is a performance metric submission (Web Vitals, custom metrics, etc.)
    if (body.type && ['web_vitals', 'custom_metric', 'api_performance'].includes(body.type)) {
      // Handle performance metric storage
      const {
        type,
        metric,
        value,
        rating,
        delta,
        id,
        navigationType,
        url,
        timestamp,
        endpoint,
        duration,
        unit
      } = body

      // Get current user's organization (if available)
      const { data: { user } } = await supabase.auth.getUser()
      let organizationId = null
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        
        organizationId = profile?.organization_id
      }

      // Store Web Vitals metrics
      if (type === 'web_vitals' && metric && value !== undefined) {
        const { error } = await supabase
          .from('analytics_metrics')
          .insert({
            metric_type: `web_vitals_${metric.toLowerCase()}`,
            organization_id: organizationId,
            metric_date: new Date().toISOString().split('T')[0],
            metric_value: value,
            metric_count: 1,
            dimensions: {
              rating,
              delta,
              navigationType,
              url: url ? new URL(url).pathname : null,
            },
            metadata: {
              id,
              timestamp,
              userAgent: request.headers.get('user-agent'),
            }
          })

        if (error) {
          console.error('Error storing Web Vitals metric:', error)
          return NextResponse.json({ error: 'Failed to store metric' }, { status: 500 })
        }
      }

      // Store custom performance metrics
      if (type === 'custom_metric' && metric && value !== undefined) {
        const { error } = await supabase
          .from('analytics_metrics')
          .insert({
            metric_type: metric,
            organization_id: organizationId,
            metric_date: new Date().toISOString().split('T')[0],
            metric_value: value,
            metric_count: 1,
            dimensions: {
              endpoint,
              unit,
              url: url ? new URL(url).pathname : null,
            },
            metadata: {
              timestamp,
              userAgent: request.headers.get('user-agent'),
            }
          })

        if (error) {
          console.error('Error storing custom metric:', error)
          return NextResponse.json({ error: 'Failed to store metric' }, { status: 500 })
        }
      }

      // Store API performance metrics
      if (type === 'api_performance' && endpoint && duration !== undefined) {
        const { error } = await supabase
          .from('analytics_metrics')
          .insert({
            metric_type: 'api_response_time',
            organization_id: organizationId,
            metric_date: new Date().toISOString().split('T')[0],
            metric_value: duration,
            metric_count: 1,
            dimensions: {
              endpoint,
              status: body.status,
              method: body.method,
            },
            metadata: {
              timestamp,
              userAgent: request.headers.get('user-agent'),
            }
          })

        if (error) {
          console.error('Error storing API performance metric:', error)
          return NextResponse.json({ error: 'Failed to store metric' }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true })
    }

    // Handle manual aggregation trigger (existing functionality)
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only admins can trigger manual aggregation
    if (!['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { date, siteId } = body

    // Call the aggregation function
    const { error } = await supabase.rpc('aggregate_daily_analytics', {
      p_organization_id: profile.organization_id,
      p_site_id: siteId || null,
      p_date: date || new Date().toISOString().split('T')[0]
    })

    if (error) {
      console.error('Error running aggregation:', error)
      return NextResponse.json({ error: 'Failed to aggregate metrics' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Metrics aggregated successfully'
    })

  } catch (error) {
    console.error('Analytics metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
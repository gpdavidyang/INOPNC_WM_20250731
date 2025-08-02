import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET endpoint to subscribe to real-time analytics events
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')

    // For site managers, verify access
    if (profile.role === 'site_manager' && siteId) {
      const { data: siteAccess } = await supabase
        .from('site_members')
        .select('site_id')
        .eq('user_id', user.id)
        .eq('site_id', siteId)
        .eq('role', 'site_manager')
        .single()

      if (!siteAccess) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 })
      }
    }

    // Return subscription configuration
    // The actual real-time subscription will be handled on the client side
    return NextResponse.json({
      channel: `analytics:${profile.organization_id}${siteId ? `:${siteId}` : ''}`,
      tables: ['analytics_events', 'analytics_metrics'],
      filters: {
        organization_id: profile.organization_id,
        site_id: siteId
      },
      permissions: {
        canSubscribe: true,
        role: profile.role
      }
    })

  } catch (error) {
    console.error('Analytics realtime setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to emit real-time analytics events
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { eventType, siteId, eventData } = body
    
    // Check if this is a RUM event (these can be anonymous)
    const isRumEvent = eventType.startsWith('rum_')
    
    let user = null
    let profile = null
    
    if (!isRumEvent) {
      // For non-RUM events, require authentication
      const { data: userData, error: authError } = await supabase.auth.getUser()
      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = userData.user

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      profile = profileData
    } else {
      // For RUM events, try to get user if available but don't require it
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        user = userData.user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('id', user.id)
          .single()
        profile = profileData
      }
    }

    // Validate event type
    const validEventTypes = [
      'report_submitted',
      'report_approved',
      'attendance_marked',
      'material_requested',
      'equipment_checked_out',
      'issue_reported',
      'metric_updated',
      // RUM event types
      'rum_page_view',
      'rum_session_update',
      'rum_error',
      'rum_unhandled_rejection',
      'rum_interaction',
      'rum_resource_timing'
    ]

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Insert analytics event
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        organization_id: profile?.organization_id || null,
        site_id: siteId || null,
        user_id: user?.id || null,
        event_data: eventData || {},
        event_timestamp: new Date().toISOString(),
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '0.0.0.0',
          isRumEvent,
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating analytics event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    // Trigger metric recalculation if needed (only for authenticated events)
    if (profile && ['report_submitted', 'report_approved', 'attendance_marked'].includes(eventType)) {
      // Run aggregation in the background (fire and forget)
      supabase.rpc('aggregate_daily_analytics', {
        p_organization_id: profile.organization_id,
        p_site_id: siteId,
        p_date: new Date().toISOString().split('T')[0]
      }).then(() => {
        console.log('Analytics aggregation triggered')
      }).catch((err) => {
        console.error('Analytics aggregation failed:', err)
      })
    }

    return NextResponse.json({
      success: true,
      event: data
    })

  } catch (error) {
    console.error('Analytics event creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
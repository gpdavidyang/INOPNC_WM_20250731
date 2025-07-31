'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSites() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get user's profile to check organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role, site_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'User profile not found' }
    }

    let query = supabase
      .from('sites')
      .select('*')
      .order('name', { ascending: true })

    // Filter based on user role
    if (profile.role === 'system_admin') {
      // System admin can see all sites
    } else if (profile.role === 'admin') {
      // Admin can see all sites in their organization
      query = query.eq('organization_id', profile.organization_id)
    } else if (profile.role === 'site_manager' && profile.site_id) {
      // Site manager can only see their assigned site
      query = query.eq('id', profile.site_id)
    } else if (profile.role === 'worker' && profile.site_id) {
      // Worker can only see their assigned site
      query = query.eq('id', profile.site_id)
    } else if (profile.role === 'customer_manager') {
      // Customer manager can see sites their organization has access to
      query = query.eq('organization_id', profile.organization_id)
    } else {
      // No sites available
      return { success: true, data: [] }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sites:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getSites:', error)
    return { success: false, error: 'Failed to fetch sites' }
  }
}
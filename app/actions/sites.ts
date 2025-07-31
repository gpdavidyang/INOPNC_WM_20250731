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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile query error:', profileError)
      // Return all sites for now since we don't have proper role-based access set up
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .order('name', { ascending: true })
      
      if (sitesError) {
        console.error('Error fetching sites:', sitesError)
        return { success: false, error: sitesError.message }
      }
      
      return { success: true, data: sites }
    }

    // For now, return all sites since role-based filtering isn't set up yet
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('name', { ascending: true })

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
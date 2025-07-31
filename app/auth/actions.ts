'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileManager } from '@/lib/auth/profile-manager'

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // TODO: Log failed login attempt when log_auth_event function is created
    // try {
    //   await supabase.rpc('log_auth_event', {
    //     user_id: email,
    //     event_type: 'login_failed',
    //     details: { error: error.message }
    //   })
    // } catch (logError) {
    //   console.error('Failed to log auth event:', logError)
    // }
    
    return { error: error.message }
  }

  // Update login stats using ProfileManager
  if (data.user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('login_count')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({ 
            last_login_at: new Date().toISOString(),
            login_count: (profile.login_count || 0) + 1
          })
          .eq('id', data.user.id)
      }

      // TODO: Log successful login when log_auth_event function is created
      // await supabase.rpc('log_auth_event', {
      //   user_id: data.user.id,
      //   event_type: 'login',
      //   details: { email }
      // })
    } catch (updateError) {
      console.error('Failed to update login stats:', updateError)
    }
  }

  // Return success without redirect - let client handle navigation
  return { success: true }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  role: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Determine organization_id and site_id using proper UUIDs
    let organizationId = null
    let siteId = null
    
    if (email.includes('@inopnc.com')) {
      organizationId = '11111111-1111-1111-1111-111111111111' // INOPNC
      if (role === 'worker' || role === 'site_manager') {
        siteId = '33333333-3333-3333-3333-333333333333' // Site 1
      }
    } else if (email.includes('@customer.com')) {
      organizationId = '22222222-2222-2222-2222-222222222222' // Customer
    }

    // Handle special case for davidswyang@gmail.com
    if (email === 'davidswyang@gmail.com') {
      role = 'system_admin'
      organizationId = '11111111-1111-1111-1111-111111111111'
    }

    // Create/update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone,
        role,
        organization_id: organizationId,
        site_id: siteId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { error: 'Failed to create user profile' }
    }

    // Create user_organizations entry
    if (organizationId) {
      await supabase
        .from('user_organizations')
        .upsert({
          user_id: data.user.id,
          organization_id: organizationId,
          is_primary: true
        })
    }

    // Create site_assignments entry
    if (siteId) {
      await supabase
        .from('site_assignments')
        .upsert({
          user_id: data.user.id,
          site_id: siteId,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
    }
  }

  // Return success without redirect - let client handle navigation
  return { success: true }
}

export async function signOut() {
  const supabase = createClient()
  
  // Get current user before signing out
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // TODO: Log logout event when log_auth_event function is created
    // try {
    //   await supabase.rpc('log_auth_event', {
    //     user_id: user.id,
    //     event_type: 'logout'
    //   })
    // } catch (logError) {
    //   console.error('Failed to log logout event:', logError)
    // }
  }
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }
  
  // Return success and let the client handle the redirect
  return { success: true }
}
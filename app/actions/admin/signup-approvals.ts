'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function getSignupRequests(filter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending') {
  const supabase = createClient()
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'system_admin')) {
      return { success: false, error: 'Forbidden' }
    }
    
    // Get signup requests
    let query = supabase
      .from('signup_requests')
      .select(`
        *,
        approver:profiles!signup_requests_approved_by_fkey(
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Error fetching signup requests:', error)
    return { success: false, error: error.message }
  }
}

export async function approveSignupRequest(requestId: string) {
  const supabase = createClient()
  const serviceClient = createServiceRoleClient()
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'system_admin')) {
      return { success: false, error: 'Forbidden' }
    }
    
    // Get the signup request
    const { data: request, error: fetchError } = await supabase
      .from('signup_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    
    if (fetchError || !request) {
      throw new Error('Signup request not found')
    }
    
    if (request.status !== 'pending') {
      throw new Error('Request has already been processed')
    }
    
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
    
    // Create user with service role client
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
        phone: request.phone,
        company_name: request.company_name
      }
    })
    
    if (authError) throw authError
    
    // Create profile for the new user
    const { error: profileError } = await serviceClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: request.email,
        full_name: request.full_name,
        role: request.requested_role,
        phone: request.phone,
        company_name: request.company_name
      })
    
    if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
      console.error('Profile creation error:', profileError)
    }
    
    // Update signup request status
    const { error: updateError } = await supabase
      .from('signup_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', requestId)
    
    if (updateError) throw updateError
    
    // TODO: Send welcome email with temporary password
    console.log('Welcome email would be sent to:', request.email, 'with password:', tempPassword)
    
    return { 
      success: true, 
      message: `${request.full_name}님의 가입이 승인되었습니다.`,
      tempPassword // In production, this should be sent via email
    }
  } catch (error: any) {
    console.error('Error approving signup request:', error)
    return { success: false, error: error.message }
  }
}

export async function rejectSignupRequest(requestId: string, reason: string) {
  const supabase = createClient()
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'system_admin')) {
      return { success: false, error: 'Forbidden' }
    }
    
    // Get the signup request
    const { data: request, error: fetchError } = await supabase
      .from('signup_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    
    if (fetchError || !request) {
      throw new Error('Signup request not found')
    }
    
    if (request.status !== 'pending') {
      throw new Error('Request has already been processed')
    }
    
    // Update signup request status
    const { error: updateError } = await supabase
      .from('signup_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', requestId)
    
    if (updateError) throw updateError
    
    return { 
      success: true, 
      message: `${request.full_name}님의 가입이 거절되었습니다.`
    }
  } catch (error: any) {
    console.error('Error rejecting signup request:', error)
    return { success: false, error: error.message }
  }
}
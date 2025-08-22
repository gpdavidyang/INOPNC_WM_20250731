// Remove 'use client' - this file contains wrappers for server actions
// Server actions must be imported directly, not through client components

import { createClient } from '@/lib/supabase/client'
import { getCurrentUserSite as serverGetCurrentUserSite, getUserSiteHistory as serverGetUserSiteHistory } from './site-info'

// Client-side wrapper for getCurrentUserSite that ensures session is valid before calling server action
export async function getCurrentUserSiteWithAuth() {
  const supabase = createClient()
  
  try {
    console.log('[SITE-INFO-CLIENT] Checking client session before server action...')
    
    // First ensure we have a valid client session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('[SITE-INFO-CLIENT] No client session, cannot proceed')
      return { success: false, error: 'No active session' }
    }
    
    console.log('[SITE-INFO-CLIENT] Client session valid:', session.user?.email)
    
    // Verify the session is actually valid
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('[SITE-INFO-CLIENT] Session verification failed, attempting refresh...')
      
      // Try to refresh the session (no sync needed with singleton pattern fix)
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshResult.session) {
        console.log('[SITE-INFO-CLIENT] Session refresh failed')
        return { success: false, error: 'Session expired' }
      }
      
      console.log('[SITE-INFO-CLIENT] Session refreshed successfully')
      
      // Wait a bit for cookies to propagate
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Now call the server action which should have access to the cookies
    console.log('[SITE-INFO-CLIENT] Calling server action...')
    const result = await serverGetCurrentUserSite()
    console.log('[SITE-INFO-CLIENT] Server action result:', result)
    
    // If server action failed due to auth, try refreshing and retry once
    if (!result.success && result.error?.includes('Authentication')) {
      console.log('[SITE-INFO-CLIENT] Server action auth failed, refreshing session and retrying...')
      
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshResult.session && !refreshError) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const retryResult = await serverGetCurrentUserSite()
        console.log('[SITE-INFO-CLIENT] Retry result:', retryResult)
        return retryResult
      }
    }
    
    return result
  } catch (error) {
    console.error('[SITE-INFO-CLIENT] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Client-side wrapper for getUserSiteHistory
export async function getUserSiteHistoryWithAuth() {
  const supabase = createClient()
  
  try {
    console.log('[SITE-INFO-CLIENT] Checking client session before server action...')
    
    // First ensure we have a valid client session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('[SITE-INFO-CLIENT] No client session, cannot proceed')
      return { success: false, error: 'No active session' }
    }
    
    console.log('[SITE-INFO-CLIENT] Client session valid:', session.user?.email)
    
    // Now call the server action
    const result = await serverGetUserSiteHistory()
    console.log('[SITE-INFO-CLIENT] Server action result:', result)
    
    // If server action failed due to auth, try refreshing and retry once
    if (!result.success && result.error?.includes('Authentication')) {
      console.log('[SITE-INFO-CLIENT] Server action auth failed, refreshing session and retrying...')
      
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshResult.session && !refreshError) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const retryResult = await serverGetUserSiteHistory()
        console.log('[SITE-INFO-CLIENT] Retry result:', retryResult)
        return retryResult
      }
    }
    
    return result
  } catch (error) {
    console.error('[SITE-INFO-CLIENT] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
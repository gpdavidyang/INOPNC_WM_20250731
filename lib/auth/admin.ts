import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile, UserRole } from '@/types'
import { getAuthenticatedUser } from './session'

/**
 * Admin authentication wrapper for admin pages
 * Ensures only admin and system_admin users can access admin functionality
 */
export async function requireAdminAuth(): Promise<{ user: any; profile: Profile }> {
  const supabase = createClient()
  
  // Get authenticated user
  const user = await getAuthenticatedUser()
  
  if (!user) {
    console.error('No authenticated user found')
    redirect('/auth/login')
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    redirect('/auth/login')
  }

  // Check if user has admin privileges
  if (profile.role !== 'admin' && profile.role !== 'system_admin') {
    console.warn(`User ${user.email} attempted to access admin area with role: ${profile.role}`)
    redirect('/dashboard')
  }

  return { user, profile }
}

/**
 * Check if user has system admin privileges
 */
export function isSystemAdmin(profile: Profile): boolean {
  return profile.role === 'system_admin'
}

/**
 * Check if user has admin privileges (admin or system_admin)
 */
export function isAdmin(profile: Profile): boolean {
  return profile.role === 'admin' || profile.role === 'system_admin'
}
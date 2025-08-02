'use server'

import { withAdminAuth, AdminActionResult, AdminErrors, validateRequired } from './common'
import { Site, SiteStatus } from '@/types'

export interface CreateSiteData {
  name: string
  address: string
  description?: string
  construction_manager_phone?: string
  safety_manager_phone?: string
  accommodation_name?: string
  accommodation_address?: string
  work_process?: string
  work_section?: string
  component_name?: string
  manager_name?: string
  safety_manager_name?: string
  status?: SiteStatus
  start_date: string
  end_date?: string
}

export interface UpdateSiteData extends Partial<CreateSiteData> {
  id: string
}

export interface SiteAssignmentData {
  site_id: string
  user_id: string
  role: 'worker' | 'site_manager' | 'supervisor'
}

/**
 * Get all sites with pagination and filtering
 */
export async function getSites(
  page = 1,
  limit = 10,
  search = '',
  status?: SiteStatus
): Promise<AdminActionResult<{ sites: Site[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase) => {
    try {
      let query = supabase
        .from('sites')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: sites, error, count } = await query

      if (error) {
        console.error('Error fetching sites:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          sites: sites || [],
          total: count || 0,
          pages: totalPages
        }
      }
    } catch (error) {
      console.error('Sites fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Create a new site
 */
export async function createSite(data: CreateSiteData): Promise<AdminActionResult<Site>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      // Validate required fields
      const nameError = validateRequired(data.name, '현장명')
      if (nameError) {
        return { success: false, error: nameError }
      }

      const addressError = validateRequired(data.address, '주소')
      if (addressError) {
        return { success: false, error: addressError }
      }

      const startDateError = validateRequired(data.start_date, '시작일')
      if (startDateError) {
        return { success: false, error: startDateError }
      }

      const { data: site, error } = await supabase
        .from('sites')
        .insert({
          ...data,
          status: data.status || 'active',
          created_by: profile.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating site:', error)
        if (error.code === '23505') {
          return { success: false, error: AdminErrors.DUPLICATE_ERROR }
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: site,
        message: '현장이 성공적으로 생성되었습니다.'
      }
    } catch (error) {
      console.error('Site creation error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Update an existing site
 */
export async function updateSite(data: UpdateSiteData): Promise<AdminActionResult<Site>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { id, ...updateData } = data

      const { data: site, error } = await supabase
        .from('sites')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating site:', error)
        if (error.code === 'PGRST116') {
          return { success: false, error: AdminErrors.NOT_FOUND }
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: site,
        message: '현장 정보가 성공적으로 업데이트되었습니다.'
      }
    } catch (error) {
      console.error('Site update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Delete sites (bulk operation)
 */
export async function deleteSites(siteIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Check if any sites have active assignments
      const { data: assignments, error: checkError } = await supabase
        .from('site_assignments')
        .select('site_id')
        .in('site_id', siteIds)
        .eq('is_active', true)

      if (checkError) {
        console.error('Error checking site assignments:', checkError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      if (assignments && assignments.length > 0) {
        return {
          success: false,
          error: '활성 배정이 있는 현장은 삭제할 수 없습니다.'
        }
      }

      const { error } = await supabase
        .from('sites')
        .delete()
        .in('id', siteIds)

      if (error) {
        console.error('Error deleting sites:', error)
        if (error.code === '23503') {
          return { success: false, error: AdminErrors.FOREIGN_KEY_ERROR }
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${siteIds.length}개 현장이 성공적으로 삭제되었습니다.`
      }
    } catch (error) {
      console.error('Sites deletion error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Update site status (bulk operation)
 */
export async function updateSiteStatus(
  siteIds: string[],
  status: SiteStatus
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { error } = await supabase
        .from('sites')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', siteIds)

      if (error) {
        console.error('Error updating site status:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const statusText = status === 'active' ? '활성화' : status === 'inactive' ? '비활성화' : '완료'

      return {
        success: true,
        message: `${siteIds.length}개 현장이 ${statusText}되었습니다.`
      }
    } catch (error) {
      console.error('Site status update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get site assignments
 */
export async function getSiteAssignments(siteId: string): Promise<AdminActionResult<any[]>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { data: assignments, error } = await supabase
        .from('site_assignments')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('site_id', siteId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching site assignments:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: assignments || []
      }
    } catch (error) {
      console.error('Site assignments fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Assign user to site
 */
export async function assignUserToSite(data: SiteAssignmentData): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Check if assignment already exists
      const { data: existing, error: checkError } = await supabase
        .from('site_assignments')
        .select('id')
        .eq('site_id', data.site_id)
        .eq('user_id', data.user_id)
        .eq('is_active', true)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing assignment:', checkError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      if (existing) {
        return {
          success: false,
          error: '사용자가 이미 해당 현장에 배정되어 있습니다.'
        }
      }

      const { error } = await supabase
        .from('site_assignments')
        .insert({
          site_id: data.site_id,
          user_id: data.user_id,
          role: data.role,
          assigned_date: new Date().toISOString(),
          is_active: true
        })

      if (error) {
        console.error('Error assigning user to site:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: '사용자가 현장에 성공적으로 배정되었습니다.'
      }
    } catch (error) {
      console.error('Site assignment error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Remove user from site
 */
export async function removeUserFromSite(
  siteId: string,
  userId: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { error } = await supabase
        .from('site_assignments')
        .update({
          is_active: false,
          unassigned_date: new Date().toISOString()
        })
        .eq('site_id', siteId)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Error removing user from site:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: '사용자가 현장에서 성공적으로 해제되었습니다.'
      }
    } catch (error) {
      console.error('Site assignment removal error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}
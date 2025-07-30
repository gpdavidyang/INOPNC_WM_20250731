import { createClient } from '@/lib/supabase/client'
import { DailyReport } from '@/types'

export async function getDailyReports(siteId?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('daily_reports')
    .select(`
      *,
      sites!inner (
        id,
        name,
        organization_id
      ),
      profiles (
        id,
        full_name,
        email
      )
    `)
    .order('work_date', { ascending: false })
  
  if (siteId) {
    query = query.eq('site_id', siteId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching daily reports:', error)
    throw error
  }
  
  return data
}

export async function getDailyReport(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_reports')
    .select(`
      *,
      sites!inner (
        id,
        name,
        organization_id
      ),
      profiles (
        id,
        full_name,
        email
      ),
      daily_report_workers (
        id,
        user_id,
        role,
        start_time,
        end_time,
        profiles (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching daily report:', error)
    throw error
  }
  
  return data
}

export async function createDailyReport(report: Partial<DailyReport>) {
  const supabase = createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('daily_reports')
    .insert({
      ...report,
      reported_by: userData.user.id,
      status: 'draft'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating daily report:', error)
    throw error
  }
  
  return data
}

export async function updateDailyReport(id: string, updates: Partial<DailyReport>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating daily report:', error)
    throw error
  }
  
  return data
}

export async function deleteDailyReport(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('daily_reports')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting daily report:', error)
    throw error
  }
}

export async function submitDailyReport(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_reports')
    .update({ 
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error submitting daily report:', error)
    throw error
  }
  
  return data
}

export async function approveDailyReport(id: string, approvedBy: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_reports')
    .update({ 
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error approving daily report:', error)
    throw error
  }
  
  return data
}
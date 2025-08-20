import { createClient } from '@/lib/supabase/client'
import { DailyReport } from '@/types'

export async function getDailyReports(siteId?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('daily_reports')
    .select(`
      *,
      site:sites!inner (
        id,
        name,
        organization_id
      ),
      created_by_profile:profiles!daily_reports_created_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('report_date', { ascending: false })
  
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
      created_by_profile:profiles!daily_reports_created_by_fkey (
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
  
  // Check for existing report with same site_id, work_date, and created_by
  const { data: existingReport, error: checkError } = await supabase
    .from('daily_reports')
    .select('id, status')
    .eq('site_id', report.site_id)
    .eq('work_date', report.work_date)
    .eq('created_by', userData.user.id)
    .single()
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking existing daily report:', checkError)
    throw checkError
  }
  
  // If report exists, update it instead of creating new one
  if (existingReport) {
    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        member_name: report.member_name,
        process_type: report.process_type,
        total_workers: report.total_workers,
        npc1000_incoming: report.npc1000_incoming,
        npc1000_used: report.npc1000_used,
        npc1000_remaining: report.npc1000_remaining,
        issues: report.issues,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingReport.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating existing daily report:', error)
      throw error
    }
    
    return data
  }
  
  // Create new report if none exists
  const { data, error } = await supabase
    .from('daily_reports')
    .insert({
      site_id: report.site_id,
      work_date: report.work_date,
      member_name: report.member_name,
      process_type: report.process_type,
      total_workers: report.total_workers,
      npc1000_incoming: report.npc1000_incoming || 0,
      npc1000_used: report.npc1000_used || 0,
      npc1000_remaining: report.npc1000_remaining || 0,
      issues: report.issues,
      created_by: userData.user.id,
      status: 'draft' as any
    } as any)
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
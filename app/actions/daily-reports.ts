'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  DailyReport, 
  DailyReportStatus, 
  WorkLog, 
  AttendanceRecord,
  Material,
  WorkLogMaterial
} from '@/types'
import { revalidatePath } from 'next/cache'

// ==========================================
// DAILY REPORT ACTIONS
// ==========================================

export async function createDailyReport(data: {
  site_id: string
  work_date: string
  member_name: string
  process_type: string // Required field in actual DB
  total_workers?: number
  npc1000_incoming?: number
  npc1000_used?: number
  npc1000_remaining?: number
  issues?: string
}) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if report already exists for this date
    const { data: existing } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('site_id', data.site_id)
      .eq('work_date', data.work_date) // Updated column name
      .single()

    if (existing) {
      return { success: false, error: 'Report already exists for this date' }
    }

    // Create new daily report
    const { data: report, error } = await supabase
      .from('daily_reports')
      .insert({
        ...data,
        status: 'draft' as DailyReportStatus,
        created_by: user.id,
        submitted_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating daily report:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/daily-reports')
    return { success: true, data: report }
  } catch (error) {
    console.error('Error in createDailyReport:', error)
    return { success: false, error: 'Failed to create daily report' }
  }
}

export async function updateDailyReport(
  id: string,
  data: Partial<DailyReport>
) {
  try {
    const supabase = createClient()
    
    const { data: report, error } = await supabase
      .from('daily_reports')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating daily report:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    console.error('Error in updateDailyReport:', error)
    return { success: false, error: 'Failed to update daily report' }
  }
}

export async function submitDailyReport(id: string) {
  try {
    const supabase = createClient()
    
    const { data: report, error } = await supabase
      .from('daily_reports')
      .update({
        status: 'submitted' as DailyReportStatus,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'draft')
      .select()
      .single()

    if (error) {
      console.error('Error submitting daily report:', error)
      return { success: false, error: error.message }
    }

    if (!report) {
      return { success: false, error: 'Report not found or already submitted' }
    }

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    console.error('Error in submitDailyReport:', error)
    return { success: false, error: 'Failed to submit daily report' }
  }
}

export async function approveDailyReport(
  id: string,
  approve: boolean,
  comments?: string
) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data: report, error } = await supabase
      .from('daily_reports')
      .update({
        status: approve ? 'approved' : 'rejected' as DailyReportStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        notes: comments ? `${comments}\n\n---\nApproval comments` : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'submitted')
      .select()
      .single()

    if (error) {
      console.error('Error approving daily report:', error)
      return { success: false, error: error.message }
    }

    if (!report) {
      return { success: false, error: 'Report not found or not in submitted status' }
    }

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    console.error('Error in approveDailyReport:', error)
    return { success: false, error: 'Failed to approve daily report' }
  }
}

export async function getDailyReports(filters: {
  site_id?: string
  start_date?: string
  end_date?: string
  status?: DailyReportStatus
  limit?: number
  offset?: number
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        site:sites(id, name),
        created_by_profile:profiles!daily_reports_created_by_fkey(full_name),
        approved_by_profile:profiles!daily_reports_approved_by_fkey(full_name)
      `)
      .order('report_date', { ascending: false })

    if (filters.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters.start_date) {
      query = query.gte('report_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('report_date', filters.end_date)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching daily reports:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data, count }
  } catch (error) {
    console.error('Error in getDailyReports:', error)
    return { success: false, error: 'Failed to fetch daily reports' }
  }
}

export async function getDailyReportById(id: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        site:sites(*),
        created_by_profile:profiles!daily_reports_created_by_fkey(*),
        approved_by_profile:profiles!daily_reports_approved_by_fkey(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching daily report:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getDailyReportById:', error)
    return { success: false, error: 'Failed to fetch daily report' }
  }
}

// ==========================================
// WORK LOG ACTIONS
// ==========================================
// TODO: Implement when work_logs table is created

// export async function addWorkLog(
//   daily_report_id: string,
//   data: {
//     work_type: string
//     location: string
//     description: string
//     worker_count: number
//     notes?: string
//   }
// ) {
//   try {
//     const supabase = createClient()
    
//     const { data: { user }, error: userError } = await supabase.auth.getUser()
//     if (userError || !user) {
//       return { success: false, error: 'User not authenticated' }
//     }

//     const { data: workLog, error } = await supabase
//       .from('work_logs')
//       .insert({
//         daily_report_id,
//         ...data,
//         created_by: user.id
//       })
//       .select()
//       .single()

//     if (error) {
//       console.error('Error adding work log:', error)
//       return { success: false, error: error.message }
//     }

//     revalidatePath(`/dashboard/daily-reports/${daily_report_id}`)
//     return { success: true, data: workLog }
//   } catch (error) {
//     console.error('Error in addWorkLog:', error)
//     return { success: false, error: 'Failed to add work log' }
//   }
// }

// export async function updateWorkLog(
//   id: string,
//   data: Partial<WorkLog>
// ) {
//   try {
//     const supabase = createClient()
    
//     const { data: { user }, error: userError } = await supabase.auth.getUser()
//     if (userError || !user) {
//       return { success: false, error: 'User not authenticated' }
//     }

//     const { data: workLog, error } = await supabase
//       .from('work_logs')
//       .update({
//         ...data,
//         updated_by: user.id,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', id)
//       .select()
//       .single()

//     if (error) {
//       console.error('Error updating work log:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true, data: workLog }
//   } catch (error) {
//     console.error('Error in updateWorkLog:', error)
//     return { success: false, error: 'Failed to update work log' }
//   }
// }

// export async function deleteWorkLog(id: string) {
//   try {
//     const supabase = createClient()
    
//     const { error } = await supabase
//       .from('work_logs')
//       .delete()
//       .eq('id', id)

//     if (error) {
//       console.error('Error deleting work log:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true }
//   } catch (error) {
//     console.error('Error in deleteWorkLog:', error)
//     return { success: false, error: 'Failed to delete work log' }
//   }
// }

// ==========================================
// WORK LOG MATERIALS ACTIONS
// ==========================================
// TODO: Implement when work_log_materials table is created

// export async function addWorkLogMaterials(
//   work_log_id: string,
//   materials: Array<{
//     material_id: string
//     quantity: number
//     notes?: string
//   }>
// ) {
//   try {
//     const supabase = createClient()
    
//     const { data, error } = await supabase
//       .from('work_log_materials')
//       .insert(
//         materials.map(m => ({
//           work_log_id,
//           ...m
//         }))
//       )
//       .select()

//     if (error) {
//       console.error('Error adding work log materials:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true, data }
//   } catch (error) {
//     console.error('Error in addWorkLogMaterials:', error)
//     return { success: false, error: 'Failed to add work log materials' }
//   }
// }

// export async function updateWorkLogMaterial(
//   id: string,
//   data: {
//     quantity?: number
//     notes?: string
//   }
// ) {
//   try {
//     const supabase = createClient()
    
//     const { data: material, error } = await supabase
//       .from('work_log_materials')
//       .update({
//         ...data,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', id)
//       .select()
//       .single()

//     if (error) {
//       console.error('Error updating work log material:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true, data: material }
//   } catch (error) {
//     console.error('Error in updateWorkLogMaterial:', error)
//     return { success: false, error: 'Failed to update work log material' }
//   }
// }

// export async function deleteWorkLogMaterial(id: string) {
//   try {
//     const supabase = createClient()
    
//     const { error } = await supabase
//       .from('work_log_materials')
//       .delete()
//       .eq('id', id)

//     if (error) {
//       console.error('Error deleting work log material:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true }
//   } catch (error) {
//     console.error('Error in deleteWorkLogMaterial:', error)
//     return { success: false, error: 'Failed to delete work log material' }
//   }
// }
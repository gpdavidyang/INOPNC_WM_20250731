'use server'

import { createClient } from '@/lib/supabase/server'
import { AttendanceRecord, AttendanceStatus, AttendanceLocation } from '@/types'
import { revalidatePath } from 'next/cache'

// ==========================================
// ATTENDANCE ACTIONS
// ==========================================

export async function checkIn(data: {
  site_id: string
  latitude?: number
  longitude?: number
  accuracy?: number
  address?: string
  device_info?: string
}) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    const checkInTime = new Date().toTimeString().split(' ')[0]

    // Get or create today's daily report for the site
    let { data: dailyReport } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('site_id', data.site_id)
      .eq('report_date', today)
      .single()

    if (!dailyReport) {
      // Create daily report if it doesn't exist
      const { data: newReport, error: reportError } = await supabase
        .from('daily_reports')
        .insert({
          site_id: data.site_id,
          report_date: today,
          status: 'draft',
          created_by: user.id
        })
        .select()
        .single()

      if (reportError) {
        console.error('Error creating daily report:', reportError)
        return { success: false, error: 'Failed to create daily report' }
      }
      dailyReport = newReport
    }

    // Check if already checked in today
    const { data: existingAttendance } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('daily_report_id', dailyReport.id)
      .eq('worker_id', user.id)
      .single()

    if (existingAttendance) {
      return { success: false, error: 'Already checked in today' }
    }

    // Create attendance record
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        daily_report_id: dailyReport.id,
        worker_id: user.id,
        check_in_time: checkInTime,
        status: 'present' as AttendanceStatus,
        created_by: user.id
      })
      .select()
      .single()

    if (attendanceError) {
      console.error('Error creating attendance record:', attendanceError)
      return { success: false, error: attendanceError.message }
    }

    // Create location record if GPS data provided
    if (data.latitude && data.longitude) {
      const { error: locationError } = await supabase
        .from('attendance_locations')
        .insert({
          attendance_record_id: attendance.id,
          check_type: 'in',
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          address: data.address,
          device_info: data.device_info,
          ip_address: null // Would need to get from request headers
        })

      if (locationError) {
        console.error('Error creating location record:', locationError)
        // Don't fail the whole operation if location fails
      }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true, data: attendance }
  } catch (error) {
    console.error('Error in checkIn:', error)
    return { success: false, error: 'Failed to check in' }
  }
}

export async function checkOut(data: {
  attendance_id: string
  latitude?: number
  longitude?: number
  accuracy?: number
  address?: string
  device_info?: string
}) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const checkOutTime = new Date().toTimeString().split(' ')[0]

    // Get attendance record
    const { data: attendance, error: fetchError } = await supabase
      .from('attendance_records')
      .select('*, daily_report:daily_reports(report_date)')
      .eq('id', data.attendance_id)
      .eq('worker_id', user.id)
      .single()

    if (fetchError || !attendance) {
      return { success: false, error: 'Attendance record not found' }
    }

    if (attendance.check_out_time) {
      return { success: false, error: 'Already checked out' }
    }

    // Calculate work hours
    const checkIn = new Date(`2000-01-01T${attendance.check_in_time}`)
    const checkOut = new Date(`2000-01-01T${checkOutTime}`)
    const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
    
    // Calculate overtime (assuming 8 hours is regular)
    const regularHours = Math.min(hoursWorked, 8)
    const overtimeHours = Math.max(0, hoursWorked - 8)

    // Update attendance record
    const { data: updatedAttendance, error: updateError } = await supabase
      .from('attendance_records')
      .update({
        check_out_time: checkOutTime,
        work_hours: hoursWorked,
        overtime_hours: overtimeHours,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.attendance_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating attendance record:', updateError)
      return { success: false, error: updateError.message }
    }

    // Create location record if GPS data provided
    if (data.latitude && data.longitude) {
      const { error: locationError } = await supabase
        .from('attendance_locations')
        .insert({
          attendance_record_id: data.attendance_id,
          check_type: 'out',
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          address: data.address,
          device_info: data.device_info,
          ip_address: null
        })

      if (locationError) {
        console.error('Error creating location record:', locationError)
      }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true, data: updatedAttendance }
  } catch (error) {
    console.error('Error in checkOut:', error)
    return { success: false, error: 'Failed to check out' }
  }
}

export async function getTodayAttendance(site_id?: string) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        worker:profiles(*),
        daily_report:daily_reports!inner(
          id,
          report_date,
          site_id,
          site:sites(*)
        ),
        attendance_locations(*)
      `)
      .eq('daily_report.report_date', today)

    if (site_id) {
      query = query.eq('daily_report.site_id', site_id)
    }

    const { data, error } = await query
      .order('check_in_time', { ascending: true })

    if (error) {
      console.error('Error fetching attendance:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getTodayAttendance:', error)
    return { success: false, error: 'Failed to fetch attendance' }
  }
}

export async function getMyAttendance(filters: {
  start_date?: string
  end_date?: string
  site_id?: string
}) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        daily_report:daily_reports!inner(
          id,
          report_date,
          site_id,
          site:sites(*)
        )
      `)
      .eq('worker_id', user.id)
      .order('daily_report.report_date', { ascending: false })

    if (filters.start_date) {
      query = query.gte('daily_report.report_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('daily_report.report_date', filters.end_date)
    }
    if (filters.site_id) {
      query = query.eq('daily_report.site_id', filters.site_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching my attendance:', error)
      return { success: false, error: error.message }
    }

    // Calculate summary
    const summary = {
      total_days: data?.length || 0,
      total_hours: data?.reduce((sum, record) => sum + (record.work_hours || 0), 0) || 0,
      total_overtime: data?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0,
      days_present: data?.filter(r => r.status === 'present').length || 0,
      days_absent: data?.filter(r => r.status === 'absent').length || 0,
      days_holiday: data?.filter(r => r.status === 'holiday').length || 0
    }

    return { success: true, data, summary }
  } catch (error) {
    console.error('Error in getMyAttendance:', error)
    return { success: false, error: 'Failed to fetch attendance history' }
  }
}

export async function updateAttendanceRecord(
  id: string,
  data: Partial<AttendanceRecord>
) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data: attendance, error } = await supabase
      .from('attendance_records')
      .update({
        ...data,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating attendance:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true, data: attendance }
  } catch (error) {
    console.error('Error in updateAttendanceRecord:', error)
    return { success: false, error: 'Failed to update attendance' }
  }
}

export async function addBulkAttendance(
  daily_report_id: string,
  workers: Array<{
    worker_id: string
    check_in_time: string
    check_out_time?: string
    work_type?: string
    notes?: string
  }>
) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Prepare attendance records
    const attendanceRecords = workers.map(worker => {
      const checkIn = new Date(`2000-01-01T${worker.check_in_time}`)
      const checkOut = worker.check_out_time ? new Date(`2000-01-01T${worker.check_out_time}`) : null
      const hoursWorked = checkOut ? (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) : 0
      
      return {
        daily_report_id,
        worker_id: worker.worker_id,
        check_in_time: worker.check_in_time,
        check_out_time: worker.check_out_time,
        work_hours: hoursWorked,
        overtime_hours: Math.max(0, hoursWorked - 8),
        work_type: worker.work_type,
        notes: worker.notes,
        status: 'present' as AttendanceStatus,
        created_by: user.id
      }
    })

    const { data, error } = await supabase
      .from('attendance_records')
      .insert(attendanceRecords)
      .select()

    if (error) {
      console.error('Error adding bulk attendance:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/attendance')
    revalidatePath(`/dashboard/daily-reports/${daily_report_id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Error in addBulkAttendance:', error)
    return { success: false, error: 'Failed to add bulk attendance' }
  }
}

export async function getMonthlyAttendance(year: number, month: number) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        daily_report:daily_reports!inner(
          report_date,
          site_id
        )
      `)
      .eq('worker_id', user.id)
      .gte('daily_report.report_date', startDate)
      .lte('daily_report.report_date', endDate)
      .order('daily_report.report_date', { ascending: true })

    if (error) {
      console.error('Error fetching monthly attendance:', error)
      return { success: false, error: error.message }
    }

    // Transform data to include date field for calendar
    const transformedData = data?.map(record => ({
      ...record,
      date: record.daily_report.report_date
    })) || []

    return { success: true, data: transformedData }
  } catch (error) {
    console.error('Error in getMonthlyAttendance:', error)
    return { success: false, error: 'Failed to fetch monthly attendance' }
  }
}

export async function getAttendanceSummary(filters: {
  site_id?: string
  start_date: string
  end_date: string
}) {
  try {
    const supabase = createClient()

    let query = supabase
      .from('attendance_records')
      .select(`
        id,
        worker_id,
        work_hours,
        overtime_hours,
        status,
        worker:profiles(
          id,
          full_name,
          email
        ),
        daily_report:daily_reports!inner(
          report_date,
          site_id
        )
      `)
      .gte('daily_report.report_date', filters.start_date)
      .lte('daily_report.report_date', filters.end_date)

    if (filters.site_id) {
      query = query.eq('daily_report.site_id', filters.site_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching attendance summary:', error)
      return { success: false, error: error.message }
    }

    // Group by worker
    const workerSummary = data?.reduce((acc, record) => {
      const workerId = record.worker_id
      if (!acc[workerId]) {
        acc[workerId] = {
          worker: record.worker,
          total_days: 0,
          total_hours: 0,
          total_overtime: 0,
          days_present: 0,
          days_absent: 0
        }
      }

      acc[workerId].total_days++
      acc[workerId].total_hours += record.work_hours || 0
      acc[workerId].total_overtime += record.overtime_hours || 0
      
      if (record.status === 'present') {
        acc[workerId].days_present++
      } else if (record.status === 'absent') {
        acc[workerId].days_absent++
      }

      return acc
    }, {} as Record<string, any>)

    return { 
      success: true, 
      data: Object.values(workerSummary || {}) 
    }
  } catch (error) {
    console.error('Error in getAttendanceSummary:', error)
    return { success: false, error: 'Failed to fetch attendance summary' }
  }
}
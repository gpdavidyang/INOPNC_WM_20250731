'use server'

import { withAdminAuth, AdminActionResult, AdminErrors, validateRequired } from './common'

export interface SalaryCalculationRule {
  id: string
  rule_name: string
  rule_type: 'hourly_rate' | 'daily_rate' | 'overtime_multiplier' | 'bonus_calculation'
  base_amount: number
  multiplier?: number
  conditions?: any
  site_id?: string
  role?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SalaryRecord {
  id: string
  worker_id: string
  worker: {
    full_name: string
    email: string
    role: string
  }
  site_id: string
  site: {
    name: string
  }
  work_date: string
  regular_hours: number
  overtime_hours: number
  base_pay: number
  overtime_pay: number
  bonus_pay: number
  deductions: number
  total_pay: number
  status: 'calculated' | 'approved' | 'paid'
  notes?: string
  created_at: string
  updated_at: string
}

export interface SalaryStats {
  total_workers: number
  pending_calculations: number
  approved_payments: number
  total_payroll: number
  average_daily_pay: number
  overtime_percentage: number
}

/**
 * Get salary calculation rules
 */
export async function getSalaryRules(
  page = 1,
  limit = 10,
  search = '',
  rule_type?: string,
  site_id?: string
): Promise<AdminActionResult<{ rules: SalaryCalculationRule[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase) => {
    try {
      let query = supabase
        .from('salary_calculation_rules')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`rule_name.ilike.%${search}%,rule_type.ilike.%${search}%`)
      }

      // Apply rule type filter
      if (rule_type) {
        query = query.eq('rule_type', rule_type)
      }

      // Apply site filter
      if (site_id) {
        query = query.or(`site_id.eq.${site_id},site_id.is.null`)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: rules, error, count } = await query

      if (error) {
        console.error('Error fetching salary rules:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          rules: rules || [],
          total: count || 0,
          pages: totalPages
        }
      }
    } catch (error) {
      console.error('Salary rules fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Create or update salary calculation rule
 */
export async function upsertSalaryRule(
  data: Partial<SalaryCalculationRule>
): Promise<AdminActionResult<SalaryCalculationRule>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      // Validate required fields
      const ruleNameError = validateRequired(data.rule_name, '규칙명')
      if (ruleNameError) {
        return { success: false, error: ruleNameError }
      }

      const ruleTypeError = validateRequired(data.rule_type, '규칙 타입')
      if (ruleTypeError) {
        return { success: false, error: ruleTypeError }
      }

      const baseAmountError = validateRequired(data.base_amount, '기본 금액')
      if (baseAmountError) {
        return { success: false, error: baseAmountError }
      }

      const ruleData = {
        rule_name: data.rule_name,
        rule_type: data.rule_type,
        base_amount: data.base_amount,
        multiplier: data.multiplier,
        conditions: data.conditions,
        site_id: data.site_id,
        role: data.role,
        is_active: data.is_active ?? true,
        updated_at: new Date().toISOString()
      }

      let result
      if (data.id) {
        // Update existing rule
        result = await supabase
          .from('salary_calculation_rules')
          .update(ruleData)
          .eq('id', data.id)
          .select()
          .single()
      } else {
        // Create new rule
        result = await supabase
          .from('salary_calculation_rules')
          .insert({
            ...ruleData,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
      }

      if (result.error) {
        console.error('Error upserting salary rule:', result.error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: result.data,
        message: data.id ? '급여 규칙이 업데이트되었습니다.' : '급여 규칙이 생성되었습니다.'
      }
    } catch (error) {
      console.error('Salary rule upsert error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Delete salary calculation rules
 */
export async function deleteSalaryRules(ruleIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { error } = await supabase
        .from('salary_calculation_rules')
        .delete()
        .in('id', ruleIds)

      if (error) {
        console.error('Error deleting salary rules:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${ruleIds.length}개 급여 규칙이 삭제되었습니다.`
      }
    } catch (error) {
      console.error('Salary rules deletion error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get salary records with calculations
 */
export async function getSalaryRecords(
  page = 1,
  limit = 10,
  search = '',
  status?: 'calculated' | 'approved' | 'paid',
  site_id?: string,
  date_from?: string,
  date_to?: string
): Promise<AdminActionResult<{ records: SalaryRecord[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase) => {
    try {
      let query = supabase
        .from('salary_records')
        .select(`
          *,
          worker:profiles!salary_records_worker_id_fkey(full_name, email, role),
          site:sites!salary_records_site_id_fkey(name)
        `, { count: 'exact' })
        .order('work_date', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`worker.full_name.ilike.%${search}%,worker.email.ilike.%${search}%,notes.ilike.%${search}%`)
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Apply site filter
      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      // Apply date filters
      if (date_from) {
        query = query.gte('work_date', date_from)
      }
      if (date_to) {
        query = query.lte('work_date', date_to)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: records, error, count } = await query

      if (error) {
        console.error('Error fetching salary records:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          records: records || [],
          total: count || 0,
          pages: totalPages
        }
      }
    } catch (error) {
      console.error('Salary records fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Calculate salaries for a specific date range
 */
export async function calculateSalaries(
  site_id?: string,
  date_from?: string,
  date_to?: string
): Promise<AdminActionResult<{ calculated_records: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      // This would normally call a stored procedure or complex calculation logic
      // For now, we'll simulate the calculation
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          worker:profiles!attendance_records_user_id_fkey(id, full_name, role),
          site:sites!attendance_records_site_id_fkey(id, name)
        `)
        .gte('date', date_from || new Date().toISOString().split('T')[0])
        .lte('date', date_to || new Date().toISOString().split('T')[0])

      if (site_id && attendanceData) {
        // Filter by site_id after getting the data
      }

      if (attendanceError) {
        console.error('Error fetching attendance data:', attendanceError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Get salary rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('salary_calculation_rules')
        .select('*')
        .eq('is_active', true)

      if (rulesError) {
        console.error('Error fetching salary rules:', rulesError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const rules = rulesData || []
      const calculatedRecords = []

      // Process attendance records and calculate salaries
      for (const attendance of attendanceData || []) {
        if (!attendance.check_out || !attendance.check_in) continue

        const workDate = new Date(attendance.date)
        const checkIn = new Date(`${attendance.date}T${attendance.check_in}`)
        const checkOut = new Date(`${attendance.date}T${attendance.check_out}`)
        
        const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
        const regularHours = Math.min(totalHours, 8)
        const overtimeHours = Math.max(totalHours - 8, 0)

        // Find applicable rules
        const hourlyRule = rules.find((r: any) => 
          r.rule_type === 'hourly_rate' && 
          (!r.site_id || r.site_id === attendance.site_id) &&
          (!r.role || r.role === attendance.worker?.role)
        )
        
        const overtimeRule = rules.find((r: any) => 
          r.rule_type === 'overtime_multiplier' && 
          (!r.site_id || r.site_id === attendance.site_id)
        )

        const hourlyRate = hourlyRule?.base_amount || 15000 // Default rate
        const overtimeMultiplier = overtimeRule?.multiplier || 1.5

        const basePay = regularHours * hourlyRate
        const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier
        const totalPay = basePay + overtimePay

        calculatedRecords.push({
          worker_id: attendance.worker.id,
          site_id: attendance.site_id,
          work_date: attendance.date,
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          base_pay: basePay,
          overtime_pay: overtimePay,
          bonus_pay: 0,
          deductions: 0,
          total_pay: totalPay,
          status: 'calculated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      // Insert calculated records
      if (calculatedRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('salary_records')
          .upsert(calculatedRecords, {
            onConflict: 'worker_id,site_id,work_date'
          })

        if (insertError) {
          console.error('Error inserting salary records:', insertError)
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }
      }

      return {
        success: true,
        data: { calculated_records: calculatedRecords.length },
        message: `${calculatedRecords.length}개 급여 계산이 완료되었습니다.`
      }
    } catch (error) {
      console.error('Salary calculation error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Approve salary records (bulk operation)
 */
export async function approveSalaryRecords(recordIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const { error } = await supabase
        .from('salary_records')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .in('id', recordIds)

      if (error) {
        console.error('Error approving salary records:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${recordIds.length}개 급여 기록이 승인되었습니다.`
      }
    } catch (error) {
      console.error('Salary approval error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get salary statistics
 */
export async function getSalaryStats(
  site_id?: string,
  date_from?: string,
  date_to?: string
): Promise<AdminActionResult<SalaryStats>> {
  return withAdminAuth(async (supabase) => {
    try {
      let query = supabase
        .from('salary_records')
        .select('*')

      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      if (date_from) {
        query = query.gte('work_date', date_from)
      }

      if (date_to) {
        query = query.lte('work_date', date_to)
      }

      const { data: records, error } = await query

      if (error) {
        console.error('Error fetching salary stats:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const totalWorkers = new Set(records?.map((r: any) => r.worker_id)).size
      const pendingCalculations = records?.filter((r: any) => r.status === 'calculated').length || 0
      const approvedPayments = records?.filter((r: any) => r.status === 'approved').length || 0
      const totalPayroll = records?.reduce((sum: number, r: any) => sum + (r.total_pay || 0), 0) || 0
      const averageDailyPay = records?.length ? totalPayroll / records.length : 0
      const totalHours = records?.reduce((sum: number, r: any) => sum + (r.regular_hours || 0) + (r.overtime_hours || 0), 0) || 0
      const overtimeHours = records?.reduce((sum: number, r: any) => sum + (r.overtime_hours || 0), 0) || 0
      const overtimePercentage = totalHours > 0 ? (overtimeHours / totalHours) * 100 : 0

      const stats: SalaryStats = {
        total_workers: totalWorkers,
        pending_calculations: pendingCalculations,
        approved_payments: approvedPayments,
        total_payroll: totalPayroll,
        average_daily_pay: averageDailyPay,
        overtime_percentage: overtimePercentage
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('Salary stats fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get available sites for salary management
 */
export async function getAvailableSitesForSalary(): Promise<AdminActionResult<Array<{ id: string; name: string }>>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { data: sites, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching sites for salary:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: sites || []
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
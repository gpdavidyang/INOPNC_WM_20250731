import {
  getSalaryRules,
  upsertSalaryRule,
  deleteSalaryRules,
  getSalaryRecords,
  calculateSalaries,
  approveSalaryRecords,
  getSalaryStats,
  getAvailableSitesForSalary
} from '@/app/actions/admin/salary'
import { calculatePayrollTotals } from '@/lib/attendance/labor-hours'

// Mock the admin auth wrapper and Supabase client
jest.mock('@/app/actions/admin/common', () => ({
  withAdminAuth: jest.fn((callback) => callback(mockSupabase, mockProfile)),
  AdminErrors: {
    DATABASE_ERROR: 'Database error occurred',
    UNKNOWN_ERROR: 'An unknown error occurred',
    VALIDATION_ERROR: 'Validation failed'
  },
  validateRequired: jest.fn((value, fieldName) => {
    if (!value && value !== 0) {
      return `${fieldName} is required`
    }
    return null
  })
}))

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  upsert: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  or: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase)
}

const mockProfile = {
  id: 'admin-1',
  role: 'admin',
  organization_id: 'org-1'
}

describe('Salary Calculation API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSalaryRules', () => {
    it('should fetch salary calculation rules with pagination', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          rule_name: 'Basic Hourly Rate',
          rule_type: 'hourly_rate',
          base_amount: 15000,
          multiplier: null,
          conditions: null,
          site_id: null,
          role: 'worker',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'rule-2',
          rule_name: 'Overtime Multiplier',
          rule_type: 'overtime_multiplier',
          base_amount: 0,
          multiplier: 1.5,
          conditions: { min_hours: 8 },
          site_id: 'site-1',
          role: null,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.range.mockResolvedValue({
        data: mockRules,
        error: null,
        count: 2
      })

      const result = await getSalaryRules(1, 10, '', undefined, undefined)

      expect(result.success).toBe(true)
      expect(result.data?.rules).toEqual(mockRules)
      expect(result.data?.total).toBe(2)
      expect(result.data?.pages).toBe(1)
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' })
    })

    it('should apply search filter for rule names', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.or.mockReturnValueOnce(mockSupabase)
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await getSalaryRules(1, 10, 'hourly', undefined, undefined)

      expect(mockSupabase.or).toHaveBeenCalledWith('rule_name.ilike.%hourly%,rule_type.ilike.%hourly%')
    })

    it('should apply rule type filter', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await getSalaryRules(1, 10, '', 'overtime_multiplier', undefined)

      expect(mockSupabase.eq).toHaveBeenCalledWith('rule_type', 'overtime_multiplier')
    })

    it('should handle database errors', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
        count: null
      })

      const result = await getSalaryRules()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error occurred')
    })
  })

  describe('upsertSalaryRule', () => {
    it('should create a new salary rule', async () => {
      const newRule = {
        rule_name: 'Site Manager Rate',
        rule_type: 'hourly_rate' as const,
        base_amount: 25000,
        multiplier: undefined,
        conditions: undefined,
        site_id: 'site-1',
        role: 'site_manager',
        is_active: true
      }

      const expectedData = {
        id: 'rule-3',
        ...newRule,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      }

      mockSupabase.insert.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: expectedData,
        error: null
      })

      const result = await upsertSalaryRule(newRule)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expectedData)
      expect(result.message).toBe('급여 규칙이 생성되었습니다.')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        rule_name: 'Site Manager Rate',
        rule_type: 'hourly_rate',
        base_amount: 25000,
        multiplier: undefined,
        conditions: undefined,
        site_id: 'site-1',
        role: 'site_manager',
        is_active: true,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
    })

    it('should update an existing salary rule', async () => {
      const updateRule = {
        id: 'rule-1',
        rule_name: 'Updated Hourly Rate',
        rule_type: 'hourly_rate' as const,
        base_amount: 18000,
        is_active: true
      }

      const expectedData = {
        ...updateRule,
        updated_at: expect.any(String)
      }

      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: expectedData,
        error: null
      })

      const result = await upsertSalaryRule(updateRule)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expectedData)
      expect(result.message).toBe('급여 규칙이 업데이트되었습니다.')
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'rule-1')
    })

    it('should validate required fields', async () => {
      const invalidRule = {
        rule_name: '',
        rule_type: 'hourly_rate' as const,
        base_amount: 15000
      }

      const result = await upsertSalaryRule(invalidRule)

      expect(result.success).toBe(false)
      expect(result.error).toBe('규칙명 is required')
    })
  })

  describe('calculateSalaries', () => {
    it('should calculate salaries based on attendance and labor hours', async () => {
      const mockAttendanceData = [
        {
          id: 'att-1',
          date: '2024-01-15',
          check_in: '09:00:00',
          check_out: '18:00:00',
          site_id: 'site-1',
          worker: { id: 'worker-1', full_name: 'John Doe', role: 'worker' },
          site: { id: 'site-1', name: 'Construction Site A' }
        },
        {
          id: 'att-2',
          date: '2024-01-16',
          check_in: '08:00:00',
          check_out: '19:00:00', // 11 hours = overtime
          site_id: 'site-1',
          worker: { id: 'worker-1', full_name: 'John Doe', role: 'worker' },
          site: { id: 'site-1', name: 'Construction Site A' }
        }
      ]

      const mockRulesData = [
        {
          id: 'rule-1',
          rule_type: 'hourly_rate',
          base_amount: 15000,
          site_id: 'site-1',
          role: 'worker'
        },
        {
          id: 'rule-2',
          rule_type: 'overtime_multiplier',
          multiplier: 1.5,
          site_id: 'site-1'
        }
      ]

      // Mock attendance data fetch
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockAttendanceData,
        error: null
      })

      // Mock salary rules fetch
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValueOnce({
        data: mockRulesData,
        error: null
      })

      // Mock salary records insert
      mockSupabase.upsert.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await calculateSalaries('site-1', '2024-01-15', '2024-01-16')

      expect(result.success).toBe(true)
      expect(result.data?.calculated_records).toBe(2)
      expect(result.message).toBe('2개 급여 계산이 완료되었습니다.')

      // Verify the calculation logic
      const insertCall = mockSupabase.upsert.mock.calls[0][0]
      expect(insertCall).toHaveLength(2)
      
      // First record: 9 hours = 8 regular + 1 overtime
      expect(insertCall[0]).toEqual({
        worker_id: 'worker-1',
        site_id: 'site-1',
        work_date: '2024-01-15',
        regular_hours: 8,
        overtime_hours: 1,
        base_pay: 120000, // 8 * 15000
        overtime_pay: 22500, // 1 * 15000 * 1.5
        bonus_pay: 0,
        deductions: 0,
        total_pay: 142500,
        status: 'calculated',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })

      // Second record: 11 hours = 8 regular + 3 overtime
      expect(insertCall[1]).toEqual({
        worker_id: 'worker-1',
        site_id: 'site-1',
        work_date: '2024-01-16',
        regular_hours: 8,
        overtime_hours: 3,
        base_pay: 120000, // 8 * 15000
        overtime_pay: 67500, // 3 * 15000 * 1.5
        bonus_pay: 0,
        deductions: 0,
        total_pay: 187500,
        status: 'calculated',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
    })

    it('should handle missing check-in or check-out times', async () => {
      const mockAttendanceData = [
        {
          id: 'att-1',
          date: '2024-01-15',
          check_in: '09:00:00',
          check_out: null, // Missing check-out
          site_id: 'site-1',
          worker: { id: 'worker-1', full_name: 'John Doe', role: 'worker' }
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockAttendanceData,
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const result = await calculateSalaries('site-1', '2024-01-15', '2024-01-15')

      expect(result.success).toBe(true)
      expect(result.data?.calculated_records).toBe(0) // No complete records to calculate
    })

    it('should use default rates when no rules are found', async () => {
      const mockAttendanceData = [
        {
          id: 'att-1',
          date: '2024-01-15',
          check_in: '09:00:00',
          check_out: '17:00:00',
          site_id: 'site-1',
          worker: { id: 'worker-1', full_name: 'John Doe', role: 'worker' }
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockAttendanceData,
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValueOnce({
        data: [], // No rules found
        error: null
      })

      mockSupabase.upsert.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await calculateSalaries()

      expect(result.success).toBe(true)
      
      // Verify default rates are used
      const insertCall = mockSupabase.upsert.mock.calls[0][0]
      expect(insertCall[0].base_pay).toBe(120000) // 8 hours * 15000 (default rate)
      expect(insertCall[0].overtime_pay).toBe(0) // No overtime
    })
  })

  describe('getSalaryRecords', () => {
    it('should fetch salary records with worker and site details', async () => {
      const mockRecords = [
        {
          id: 'sal-1',
          worker_id: 'worker-1',
          site_id: 'site-1',
          work_date: '2024-01-15',
          regular_hours: 8,
          overtime_hours: 1,
          base_pay: 120000,
          overtime_pay: 22500,
          bonus_pay: 0,
          deductions: 0,
          total_pay: 142500,
          status: 'calculated',
          notes: null,
          created_at: '2024-01-15T18:00:00Z',
          updated_at: '2024-01-15T18:00:00Z',
          worker: { full_name: 'John Doe', email: 'john@example.com', role: 'worker' },
          site: { name: 'Construction Site A' }
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.range.mockResolvedValue({
        data: mockRecords,
        error: null,
        count: 1
      })

      const result = await getSalaryRecords(1, 10)

      expect(result.success).toBe(true)
      expect(result.data?.records).toEqual(mockRecords)
      expect(result.data?.total).toBe(1)
      expect(result.data?.pages).toBe(1)
    })

    it('should apply status filter', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await getSalaryRecords(1, 10, '', 'approved')

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'approved')
    })

    it('should apply date range filter', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockReturnValueOnce(mockSupabase)
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await getSalaryRecords(1, 10, '', undefined, undefined, '2024-01-01', '2024-01-31')

      expect(mockSupabase.gte).toHaveBeenCalledWith('work_date', '2024-01-01')
      expect(mockSupabase.lte).toHaveBeenCalledWith('work_date', '2024-01-31')
    })
  })

  describe('approveSalaryRecords', () => {
    it('should approve multiple salary records', async () => {
      const recordIds = ['sal-1', 'sal-2', 'sal-3']

      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await approveSalaryRecords(recordIds)

      expect(result.success).toBe(true)
      expect(result.message).toBe('3개 급여 기록이 승인되었습니다.')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'approved',
        updated_at: expect.any(String)
      })
      expect(mockSupabase.in).toHaveBeenCalledWith('id', recordIds)
    })

    it('should handle approval errors', async () => {
      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockResolvedValue({
        data: null,
        error: new Error('Update failed')
      })

      const result = await approveSalaryRecords(['sal-1'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error occurred')
    })
  })

  describe('getSalaryStats', () => {
    it('should calculate comprehensive salary statistics', async () => {
      const mockRecords = [
        {
          id: 'sal-1',
          worker_id: 'worker-1',
          site_id: 'site-1',
          regular_hours: 8,
          overtime_hours: 1,
          total_pay: 142500,
          status: 'calculated'
        },
        {
          id: 'sal-2',
          worker_id: 'worker-2',
          site_id: 'site-1',
          regular_hours: 8,
          overtime_hours: 0,
          total_pay: 120000,
          status: 'approved'
        },
        {
          id: 'sal-3',
          worker_id: 'worker-1',
          site_id: 'site-1',
          regular_hours: 8,
          overtime_hours: 2,
          total_pay: 165000,
          status: 'approved'
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.resolve.mockResolvedValue({
        data: mockRecords,
        error: null
      })

      // Mock the final query resolution
      const query = mockSupabase.select.mockReturnValue(mockSupabase)
      query.mockResolvedValue({
        data: mockRecords,
        error: null
      })

      const result = await getSalaryStats('site-1', '2024-01-01', '2024-01-31')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        total_workers: 2, // Unique worker-1 and worker-2
        pending_calculations: 1, // 1 'calculated' status
        approved_payments: 2, // 2 'approved' status
        total_payroll: 427500, // Sum of all total_pay
        average_daily_pay: 142500, // 427500 / 3 records
        overtime_percentage: expect.closeTo(11.11, 1) // 3 overtime hours / 27 total hours * 100
      })
    })

    it('should handle empty records gracefully', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      const query = mockSupabase.select.mockReturnValue(mockSupabase)
      query.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await getSalaryStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        total_workers: 0,
        pending_calculations: 0,
        approved_payments: 0,
        total_payroll: 0,
        average_daily_pay: 0,
        overtime_percentage: 0
      })
    })
  })

  describe('Labor Hours Payroll Integration', () => {
    it('should correctly calculate payroll totals from labor hours', () => {
      const payrollData = {
        userId: 'worker-1',
        month: '2024-01',
        hourlyRate: 15000,
        overtimeRate: 22500, // 15000 * 1.5
        attendanceRecords: [
          { 
            id: 'att-1', 
            date: '2024-01-15', 
            labor_hours: 1.0, // 8 hours regular
            work_hours: 8, 
            status: 'present' 
          },
          { 
            id: 'att-2', 
            date: '2024-01-16', 
            labor_hours: 1.125, // 9 hours = 8 regular + 1 overtime
            work_hours: 9, 
            status: 'present' 
          },
          { 
            id: 'att-3', 
            date: '2024-01-17', 
            labor_hours: 0.5, // 4 hours partial
            work_hours: 4, 
            status: 'present' 
          },
          { 
            id: 'att-4', 
            date: '2024-01-18', 
            labor_hours: 0, // Absent
            work_hours: 0, 
            status: 'absent' 
          }
        ] as any
      }

      const result = calculatePayrollTotals(payrollData)

      expect(result).toEqual({
        regularHours: 20, // 8 + 8 + 4 = 20 regular hours
        overtimeHours: 1, // Only 1 overtime hour from second day
        regularPay: 300000, // 20 * 15000
        overtimePay: 22500, // 1 * 22500
        totalPay: 322500,
        totalHours: 21, // 20 regular + 1 overtime
        totalLaborHours: 2.625, // 1.0 + 1.125 + 0.5 + 0 = 2.625
        workDays: 3, // 3 days with labor_hours > 0
        absentDays: 1 // 1 day with labor_hours = 0
      })
    })

    it('should handle empty attendance records', () => {
      const payrollData = {
        userId: 'worker-1',
        month: '2024-01',
        hourlyRate: 15000,
        overtimeRate: 22500,
        attendanceRecords: []
      }

      const result = calculatePayrollTotals(payrollData)

      expect(result).toEqual({
        regularHours: 0,
        overtimeHours: 0,
        regularPay: 0,
        overtimePay: 0,
        totalPay: 0,
        totalHours: 0,
        totalLaborHours: 0,
        workDays: 0,
        absentDays: 0
      })
    })
  })
})
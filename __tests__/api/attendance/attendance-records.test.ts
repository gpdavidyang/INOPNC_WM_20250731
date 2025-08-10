import { 
  getAttendanceRecords, 
  checkIn, 
  checkOut, 
  getTodayAttendance,
  getMyAttendance,
  updateAttendanceRecord,
  addBulkAttendance,
  getMonthlyAttendance,
  getAttendanceSummary
} from '@/app/actions/attendance'
import { createClient } from '@/lib/supabase/server'
import { calculateLaborHours } from '@/lib/attendance/labor-hours'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  upsert: jest.fn(() => mockSupabase),
  filter: jest.fn(() => mockSupabase),
  or: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase)
}

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Attendance API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
    
    // Mock current date
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T09:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getAttendanceRecords', () => {
    it('should fetch attendance records with filters', async () => {
      const mockAttendance = [
        {
          id: 'attendance-1',
          user_id: 'user-1',
          site_id: 'site-1',
          attendance_date: '2024-01-15',
          check_in_time: '09:00:00',
          check_out_time: '18:00:00',
          work_hours: 8,
          labor_hours: 1.0,
          overtime_hours: 0,
          status: 'present',
          site: { id: 'site-1', name: 'Construction Site A' },
          worker: { id: 'user-1', full_name: 'John Doe', email: 'john@example.com' }
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockAttendance,
        error: null
      })

      const result = await getAttendanceRecords({
        user_id: 'user-1',
        site_id: 'site-1',
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendance)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('site_id', 'site-1')
      expect(mockSupabase.gte).toHaveBeenCalledWith('attendance_date', '2024-01-01')
      expect(mockSupabase.lte).toHaveBeenCalledWith('attendance_date', '2024-01-31')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const result = await getAttendanceRecords({
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('checkIn', () => {
    it('should successfully check in with labor hours calculation', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockDailyReport = { id: 'report-1' }
      const mockAttendance = {
        id: 'attendance-1',
        site_id: 'site-1',
        user_id: 'user-1',
        work_date: '2024-01-15',
        check_in_time: '09:00:00',
        status: 'present'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock daily report check and creation
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockDailyReport,
        error: null
      })

      // Mock existing attendance check
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      // Mock attendance creation
      mockSupabase.insert.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockAttendance,
        error: null
      })

      const result = await checkIn({
        site_id: 'site-1',
        latitude: 37.5665,
        longitude: 126.9780,
        accuracy: 10,
        address: 'Seoul, Korea'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendance)
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        site_id: 'site-1',
        user_id: 'user-1',
        work_date: '2024-01-15',
        check_in_time: '09:00:00',
        status: 'present'
      })
    })

    it('should prevent duplicate check-ins', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockExistingAttendance = { id: 'attendance-1' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock daily report check
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'report-1' },
        error: null
      })

      // Mock existing attendance check - return existing record
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockExistingAttendance,
        error: null
      })

      const result = await checkIn({
        site_id: 'site-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Already checked in today')
    })

    it('should handle unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const result = await checkIn({
        site_id: 'site-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })
  })

  describe('checkOut', () => {
    it('should successfully check out and calculate labor hours', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockAttendance = {
        id: 'attendance-1',
        user_id: 'user-1',
        check_in_time: '09:00:00',
        check_out_time: null
      }

      const mockUpdatedAttendance = {
        ...mockAttendance,
        check_out_time: '18:00:00',
        work_hours: 9,
        labor_hours: 1.125, // 9 hours = 1.125 공수
        overtime_hours: 1
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock attendance record fetch
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockAttendance,
        error: null
      })

      // Mock attendance update
      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedAttendance,
        error: null
      })

      const result = await checkOut({
        attendance_id: 'attendance-1',
        latitude: 37.5665,
        longitude: 126.9780
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedAttendance)
      
      // Verify work hours and overtime calculation
      expect(mockSupabase.update).toHaveBeenCalledWith({
        check_out_time: '18:00:00',
        work_hours: 9,
        overtime_hours: 1,
        updated_by: 'user-1',
        updated_at: expect.any(String)
      })
    })

    it('should prevent duplicate check-outs', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockAttendance = {
        id: 'attendance-1',
        user_id: 'user-1',
        check_in_time: '09:00:00',
        check_out_time: '17:00:00' // Already checked out
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockAttendance,
        error: null
      })

      const result = await checkOut({
        attendance_id: 'attendance-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Already checked out')
    })

    it('should handle attendance record not found', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found')
      })

      const result = await checkOut({
        attendance_id: 'invalid-id'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Attendance record not found')
    })
  })

  describe('addBulkAttendance', () => {
    it('should add multiple attendance records with labor hours calculations', async () => {
      const mockUser = { id: 'manager-1', email: 'manager@example.com' }
      const workers = [
        {
          user_id: 'worker-1',
          check_in_time: '08:00:00',
          check_out_time: '17:00:00', // 9 hours = 1.125 공수
          notes: 'Regular shift'
        },
        {
          user_id: 'worker-2',
          check_in_time: '09:00:00',
          check_out_time: '13:00:00', // 4 hours = 0.5 공수
          notes: 'Half day'
        }
      ]

      const expectedRecords = [
        {
          site_id: 'site-1',
          user_id: 'worker-1',
          work_date: '2024-01-15',
          check_in_time: '08:00:00',
          check_out_time: '17:00:00',
          work_hours: 9,
          overtime_hours: 1,
          notes: 'Regular shift',
          status: 'present'
        },
        {
          site_id: 'site-1',
          user_id: 'worker-2',
          work_date: '2024-01-15',
          check_in_time: '09:00:00',
          check_out_time: '13:00:00',
          work_hours: 4,
          overtime_hours: 0,
          notes: 'Half day',
          status: 'present'
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.insert.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockResolvedValue({
        data: expectedRecords,
        error: null
      })

      const result = await addBulkAttendance(
        'site-1',
        '2024-01-15',
        workers
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expectedRecords)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expectedRecords)
    })

    it('should handle database errors during bulk insert', async () => {
      const mockUser = { id: 'manager-1', email: 'manager@example.com' }
      const workers = [
        {
          user_id: 'worker-1',
          check_in_time: '08:00:00',
          check_out_time: '17:00:00'
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.insert.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Constraint violation')
      })

      const result = await addBulkAttendance(
        'site-1',
        '2024-01-15',
        workers
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Constraint violation')
    })
  })

  describe('getMonthlyAttendance', () => {
    it('should fetch monthly attendance records with labor hours', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockAttendance = [
        {
          id: 'att-1',
          user_id: 'user-1',
          work_date: '2024-01-15',
          check_in_time: '09:00:00',
          check_out_time: '18:00:00',
          work_hours: 9,
          labor_hours: 1.125,
          overtime_hours: 1,
          status: 'present',
          site: { report_date: '2024-01-15', site_id: 'site-1' }
        },
        {
          id: 'att-2',
          user_id: 'user-1',
          work_date: '2024-01-16',
          check_in_time: '09:00:00',
          check_out_time: '17:00:00',
          work_hours: 8,
          labor_hours: 1.0,
          overtime_hours: 0,
          status: 'present',
          site: { report_date: '2024-01-16', site_id: 'site-1' }
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockAttendance,
        error: null
      })

      const result = await getMonthlyAttendance(2024, 1)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toHaveProperty('date', '2024-01-15')
      expect(result.data?.[0]).toHaveProperty('labor_hours', 1.125)
      
      // Verify date filtering
      expect(mockSupabase.gte).toHaveBeenCalledWith('work_date', '2024-01-01')
      expect(mockSupabase.lte).toHaveBeenCalledWith('work_date', '2024-01-31')
    })
  })

  describe('getAttendanceSummary', () => {
    it('should calculate attendance summary with labor hours aggregation', async () => {
      const mockAttendance = [
        {
          id: 'att-1',
          user_id: 'user-1',
          work_hours: 8,
          labor_hours: 1.0,
          overtime_hours: 0,
          status: 'present',
          worker: { id: 'user-1', full_name: 'John Doe', email: 'john@example.com' }
        },
        {
          id: 'att-2',
          user_id: 'user-1',
          work_hours: 9,
          labor_hours: 1.125,
          overtime_hours: 1,
          status: 'present',
          worker: { id: 'user-1', full_name: 'John Doe', email: 'john@example.com' }
        },
        {
          id: 'att-3',
          user_id: 'user-2',
          work_hours: 4,
          labor_hours: 0.5,
          overtime_hours: 0,
          status: 'present',
          worker: { id: 'user-2', full_name: 'Jane Smith', email: 'jane@example.com' }
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValue({
        data: mockAttendance,
        error: null
      })

      const result = await getAttendanceSummary({
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2) // Two unique workers

      const worker1Summary = result.data?.find((w: any) => w.worker.id === 'user-1')
      expect(worker1Summary).toEqual({
        worker: { id: 'user-1', full_name: 'John Doe', email: 'john@example.com' },
        total_days: 2,
        total_hours: 17, // 8 + 9 hours
        total_overtime: 1, // 0 + 1 overtime hours
        days_present: 2,
        days_absent: 0
      })

      const worker2Summary = result.data?.find((w: any) => w.worker.id === 'user-2')
      expect(worker2Summary).toEqual({
        worker: { id: 'user-2', full_name: 'Jane Smith', email: 'jane@example.com' },
        total_days: 1,
        total_hours: 4,
        total_overtime: 0,
        days_present: 1,
        days_absent: 0
      })
    })
  })

  describe('Labor Hours Integration', () => {
    it('should correctly calculate labor hours from work hours', () => {
      // Test the labor hours calculation function directly
      const testCases = [
        { laborHours: 0, expectedHours: 0, expectedOvertime: 0, expectedType: 'absent' },
        { laborHours: 0.5, expectedHours: 4, expectedOvertime: 0, expectedType: 'partial' },
        { laborHours: 1.0, expectedHours: 8, expectedOvertime: 0, expectedType: 'regular' },
        { laborHours: 1.125, expectedHours: 9, expectedOvertime: 1, expectedType: 'overtime' },
        { laborHours: 1.5, expectedHours: 12, expectedOvertime: 4, expectedType: 'overtime' }
      ]

      testCases.forEach(({ laborHours, expectedHours, expectedOvertime, expectedType }) => {
        const result = calculateLaborHours(laborHours)
        expect(result.actualHours).toBe(expectedHours)
        expect(result.overtimeHours).toBe(expectedOvertime)
        expect(result.type).toBe(expectedType)
      })
    })

    it('should handle invalid labor hours values', () => {
      const invalidCases = [NaN, -1, undefined as any, null as any]
      
      invalidCases.forEach(invalidValue => {
        const result = calculateLaborHours(invalidValue)
        expect(result.laborHours).toBe(0)
        expect(result.actualHours).toBe(0)
        expect(result.overtimeHours).toBe(0)
        expect(result.type).toBe('absent')
      })
    })
  })
})
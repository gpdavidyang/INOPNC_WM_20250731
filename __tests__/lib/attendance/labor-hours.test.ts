/**
 * Labor Hours Calculation Test Suite
 * Tests for Korean labor hours (공수) system including attendance tracking,
 * overtime calculations, and monthly aggregations
 */

import { jest } from '@jest/globals'
import {
  calculateLaborHours,
  calculateOvertimeHours,
  calculateMonthlyTotals,
  formatLaborHours,
  getLaborHoursByDateRange,
  getAttendanceColor,
  isHoliday,
  calculatePayrollTotals
} from '@/lib/attendance/labor-hours'
import type { AttendanceRecord, LaborHoursCalculation, MonthlyTotals } from '@/types'

// Mock Korean holidays
const mockHolidays = [
  '2025-01-01', // New Year
  '2025-02-09', // Lunar New Year
  '2025-02-10', // Lunar New Year
  '2025-02-11', // Lunar New Year
  '2025-03-01', // Independence Movement Day
  '2025-05-05', // Children's Day
  '2025-05-13', // Buddha's Birthday
  '2025-06-06', // Memorial Day
  '2025-08-15', // Liberation Day
  '2025-09-16', // Chuseok
  '2025-09-17', // Chuseok
  '2025-09-18', // Chuseok
  '2025-10-03', // National Foundation Day
  '2025-10-09', // Hangeul Day
  '2025-12-25'  // Christmas
]

// Mock attendance records for testing
const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    user_id: 'user-1',
    site_id: 'site-1',
    date: '2025-08-01',
    labor_hours: 1.0, // Full day (8 hours)
    work_type: 'regular',
    weather_condition: 'clear',
    notes: 'Regular work day',
    created_at: '2025-08-01T09:00:00Z'
  },
  {
    id: 'att-2',
    user_id: 'user-1',
    site_id: 'site-1',
    date: '2025-08-02',
    labor_hours: 0.5, // Half day (4 hours)
    work_type: 'regular',
    weather_condition: 'rainy',
    notes: 'Half day due to rain',
    created_at: '2025-08-02T09:00:00Z'
  },
  {
    id: 'att-3',
    user_id: 'user-1',
    site_id: 'site-1',
    date: '2025-08-03',
    labor_hours: 1.25, // Overtime (10 hours)
    work_type: 'overtime',
    weather_condition: 'clear',
    notes: 'Overtime work',
    created_at: '2025-08-03T09:00:00Z'
  },
  {
    id: 'att-4',
    user_id: 'user-1',
    site_id: 'site-1',
    date: '2025-08-04',
    labor_hours: 0.0, // No work (Sunday)
    work_type: 'holiday',
    weather_condition: 'clear',
    notes: 'Sunday rest',
    created_at: '2025-08-04T09:00:00Z'
  },
  {
    id: 'att-5',
    user_id: 'user-1',
    site_id: 'site-1',
    date: '2025-08-15', // Liberation Day
    labor_hours: 0.0,
    work_type: 'holiday',
    weather_condition: 'clear',
    notes: 'National holiday',
    created_at: '2025-08-15T09:00:00Z'
  }
]

describe('Labor Hours Calculation System (공수 시스템)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Labor Hours Calculations', () => {
    it('should convert labor hours to actual hours correctly', () => {
      expect(calculateLaborHours(1.0)).toEqual({
        laborHours: 1.0,
        actualHours: 8,
        overtimeHours: 0,
        type: 'regular'
      })

      expect(calculateLaborHours(0.5)).toEqual({
        laborHours: 0.5,
        actualHours: 4,
        overtimeHours: 0,
        type: 'partial'
      })

      expect(calculateLaborHours(1.25)).toEqual({
        laborHours: 1.25,
        actualHours: 10,
        overtimeHours: 2,
        type: 'overtime'
      })

      expect(calculateLaborHours(0.0)).toEqual({
        laborHours: 0.0,
        actualHours: 0,
        overtimeHours: 0,
        type: 'absent'
      })
    })

    it('should handle edge cases for labor hours', () => {
      // Very small labor hours
      expect(calculateLaborHours(0.125)).toEqual({
        laborHours: 0.125,
        actualHours: 1,
        overtimeHours: 0,
        type: 'partial'
      })

      // Negative labor hours (should be treated as 0)
      expect(calculateLaborHours(-0.5)).toEqual({
        laborHours: 0.0,
        actualHours: 0,
        overtimeHours: 0,
        type: 'absent'
      })

      // Very high overtime
      expect(calculateLaborHours(2.0)).toEqual({
        laborHours: 2.0,
        actualHours: 16,
        overtimeHours: 8,
        type: 'overtime'
      })
    })

    it('should calculate overtime hours correctly', () => {
      expect(calculateOvertimeHours(8)).toBe(0)   // Regular 8 hours
      expect(calculateOvertimeHours(10)).toBe(2)  // 2 hours overtime
      expect(calculateOvertimeHours(12)).toBe(4)  // 4 hours overtime
      expect(calculateOvertimeHours(4)).toBe(0)   // Part-time, no overtime
      expect(calculateOvertimeHours(0)).toBe(0)   // No work, no overtime
    })

    it('should format labor hours with Korean decimals', () => {
      expect(formatLaborHours(1.0)).toBe('1.0공수')
      expect(formatLaborHours(0.5)).toBe('0.5공수')
      expect(formatLaborHours(1.25)).toBe('1.3공수') // Rounded to quarter
      expect(formatLaborHours(0.125)).toBe('0.1공수')
      expect(formatLaborHours(0.0)).toBe('0.0공수')
    })
  })

  describe('Monthly Labor Hours Aggregation', () => {
    it('should calculate monthly totals correctly', () => {
      const monthlyTotals = calculateMonthlyTotals(mockAttendanceRecords, '2025-08')

      expect(monthlyTotals).toEqual({
        month: '2025-08',
        totalLaborHours: 2.75, // 1.0 + 0.5 + 1.25 + 0.0 + 0.0
        totalActualHours: 22,   // 8 + 4 + 10 + 0 + 0
        totalOvertimeHours: 2,  // 0 + 0 + 2 + 0 + 0
        workDays: 3,           // Days with labor_hours > 0
        absentDays: 2,         // Days with labor_hours = 0
        holidayDays: 2,        // Sunday + Liberation Day
        averageLaborHours: 0.92, // 2.75 / 3 work days, rounded
        records: mockAttendanceRecords
      })
    })

    it('should handle empty attendance records', () => {
      const monthlyTotals = calculateMonthlyTotals([], '2025-08')

      expect(monthlyTotals).toEqual({
        month: '2025-08',
        totalLaborHours: 0,
        totalActualHours: 0,
        totalOvertimeHours: 0,
        workDays: 0,
        absentDays: 0,
        holidayDays: 0,
        averageLaborHours: 0,
        records: []
      })
    })

    it('should filter records by month correctly', () => {
      const recordsWithDifferentMonths = [
        ...mockAttendanceRecords,
        {
          id: 'att-6',
          user_id: 'user-1',
          site_id: 'site-1',
          date: '2025-07-31', // Different month
          labor_hours: 1.0,
          work_type: 'regular' as const,
          weather_condition: 'clear',
          notes: 'Previous month',
          created_at: '2025-07-31T09:00:00Z'
        }
      ]

      const monthlyTotals = calculateMonthlyTotals(recordsWithDifferentMonths, '2025-08')

      // Should only include August records
      expect(monthlyTotals.totalLaborHours).toBe(2.75)
      expect(monthlyTotals.records).toHaveLength(5) // Only August records
    })
  })

  describe('Date Range Labor Hours Retrieval', () => {
    it('should get labor hours by date range', () => {
      const result = getLaborHoursByDateRange(
        mockAttendanceRecords,
        '2025-08-01',
        '2025-08-03'
      )

      expect(result).toHaveLength(3)
      expect(result[0].date).toBe('2025-08-01')
      expect(result[0].labor_hours).toBe(1.0)
      expect(result[1].date).toBe('2025-08-02')
      expect(result[1].labor_hours).toBe(0.5)
      expect(result[2].date).toBe('2025-08-03')
      expect(result[2].labor_hours).toBe(1.25)
    })

    it('should return empty array for invalid date range', () => {
      const result = getLaborHoursByDateRange(
        mockAttendanceRecords,
        '2025-09-01',
        '2025-09-30'
      )

      expect(result).toHaveLength(0)
    })

    it('should handle reverse date range', () => {
      const result = getLaborHoursByDateRange(
        mockAttendanceRecords,
        '2025-08-03',
        '2025-08-01' // End before start
      )

      expect(result).toHaveLength(0)
    })
  })

  describe('Attendance Color Coding System', () => {
    it('should return correct colors for different labor hour ranges', () => {
      // Green: Full day or overtime (1.0+ 공수)
      expect(getAttendanceColor(1.0)).toBe('green')
      expect(getAttendanceColor(1.25)).toBe('green')
      expect(getAttendanceColor(2.0)).toBe('green')

      // Yellow: Half to almost full day (0.5-0.9 공수)
      expect(getAttendanceColor(0.5)).toBe('yellow')
      expect(getAttendanceColor(0.75)).toBe('yellow')
      expect(getAttendanceColor(0.9)).toBe('yellow')

      // Orange: Less than half day (0.1-0.4 공수)
      expect(getAttendanceColor(0.1)).toBe('orange')
      expect(getAttendanceColor(0.25)).toBe('orange')
      expect(getAttendanceColor(0.4)).toBe('orange')

      // Gray: No work/holiday (0.0 공수)
      expect(getAttendanceColor(0.0)).toBe('gray')
    })

    it('should handle edge cases for color coding', () => {
      expect(getAttendanceColor(0.49)).toBe('orange') // Just below yellow threshold
      expect(getAttendanceColor(0.51)).toBe('yellow') // Just above orange threshold
      expect(getAttendanceColor(0.99)).toBe('yellow') // Just below green threshold
      expect(getAttendanceColor(1.01)).toBe('green')  // Just above yellow threshold
    })
  })

  describe('Korean Holiday Detection', () => {
    it('should identify Korean national holidays', () => {
      expect(isHoliday('2025-01-01')).toBe(true)  // New Year
      expect(isHoliday('2025-03-01')).toBe(true)  // Independence Movement Day
      expect(isHoliday('2025-05-05')).toBe(true)  // Children's Day
      expect(isHoliday('2025-08-15')).toBe(true)  // Liberation Day
      expect(isHoliday('2025-12-25')).toBe(true)  // Christmas
    })

    it('should return false for regular weekdays', () => {
      expect(isHoliday('2025-08-01')).toBe(false) // Regular Friday
      expect(isHoliday('2025-08-07')).toBe(false) // Regular Thursday
      expect(isHoliday('2025-08-20')).toBe(false) // Regular Wednesday
    })

    it('should handle weekends correctly', () => {
      // Note: Weekend detection should be separate from holiday detection
      expect(isHoliday('2025-08-02')).toBe(false) // Saturday
      expect(isHoliday('2025-08-03')).toBe(false) // Sunday
    })

    it('should handle invalid dates gracefully', () => {
      expect(isHoliday('invalid-date')).toBe(false)
      expect(isHoliday('')).toBe(false)
      expect(isHoliday('2025-13-32')).toBe(false) // Invalid month/day
    })
  })

  describe('Payroll Calculations', () => {
    it('should calculate correct payroll totals', () => {
      const payrollData = {
        userId: 'user-1',
        month: '2025-08',
        hourlyRate: 15000, // 15,000 KRW per hour
        overtimeRate: 22500, // 1.5x regular rate
        attendanceRecords: mockAttendanceRecords
      }

      const payrollTotals = calculatePayrollTotals(payrollData)

      expect(payrollTotals).toEqual({
        regularHours: 20,      // (8 + 4 + 8) = 20 regular hours
        overtimeHours: 2,      // 2 overtime hours
        regularPay: 300000,    // 20 * 15,000
        overtimePay: 45000,    // 2 * 22,500
        totalPay: 345000,      // 300,000 + 45,000
        totalHours: 22,        // 20 + 2
        totalLaborHours: 2.75, // As calculated in monthly totals
        workDays: 3,
        absentDays: 2
      })
    })

    it('should handle zero labor hours in payroll', () => {
      const payrollData = {
        userId: 'user-1',
        month: '2025-09',
        hourlyRate: 15000,
        overtimeRate: 22500,
        attendanceRecords: []
      }

      const payrollTotals = calculatePayrollTotals(payrollData)

      expect(payrollTotals).toEqual({
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

    it('should calculate payroll with different hourly rates', () => {
      const payrollData = {
        userId: 'user-1',
        month: '2025-08',
        hourlyRate: 20000, // Higher rate
        overtimeRate: 30000, // 1.5x rate
        attendanceRecords: mockAttendanceRecords.slice(0, 3) // First 3 records
      }

      const payrollTotals = calculatePayrollTotals(payrollData)

      expect(payrollTotals.regularPay).toBe(400000) // 20 * 20,000
      expect(payrollTotals.overtimePay).toBe(60000)  // 2 * 30,000
      expect(payrollTotals.totalPay).toBe(460000)    // 400,000 + 60,000
    })
  })

  describe('Business Logic Validation', () => {
    it('should enforce maximum labor hours per day', () => {
      // Korean labor law typically limits to 12 hours per day including overtime
      const calculation = calculateLaborHours(1.5) // 12 hours
      expect(calculation.actualHours).toBe(12)
      expect(calculation.overtimeHours).toBe(4)
      expect(calculation.type).toBe('overtime')

      // Test extreme case
      const extremeCalculation = calculateLaborHours(3.0) // 24 hours - unrealistic
      expect(extremeCalculation.laborHours).toBe(3.0)
      expect(extremeCalculation.actualHours).toBe(24)
      expect(extremeCalculation.type).toBe('overtime')
    })

    it('should validate labor hours decimal precision', () => {
      // Labor hours should typically be in 0.25 increments
      expect(formatLaborHours(1.125)).toBe('1.1공수')  // Rounded to nearest 0.1
      expect(formatLaborHours(0.875)).toBe('0.9공수')  // Rounded to nearest 0.1
      expect(formatLaborHours(0.33)).toBe('0.3공수')   // Rounded to nearest 0.1
    })

    it('should handle concurrent date entries', () => {
      // Test that multiple entries for same date are handled correctly
      const duplicateRecords = [
        ...mockAttendanceRecords,
        {
          id: 'att-duplicate',
          user_id: 'user-1',
          site_id: 'site-1',
          date: '2025-08-01', // Same date as first record
          labor_hours: 0.5,
          work_type: 'regular' as const,
          weather_condition: 'clear',
          notes: 'Duplicate entry',
          created_at: '2025-08-01T10:00:00Z'
        }
      ]

      const monthlyTotals = calculateMonthlyTotals(duplicateRecords, '2025-08')

      // Should handle duplicates appropriately (depends on business logic)
      expect(monthlyTotals.records).toHaveLength(6)
      expect(monthlyTotals.totalLaborHours).toBe(3.25) // 2.75 + 0.5
    })
  })

  describe('Integration with Weather Conditions', () => {
    it('should account for weather-related labor hour adjustments', () => {
      const weatherRecords = [
        {
          id: 'weather-1',
          user_id: 'user-1',
          site_id: 'site-1',
          date: '2025-08-10',
          labor_hours: 0.5, // Reduced due to rain
          work_type: 'weather_delay' as const,
          weather_condition: 'heavy_rain',
          notes: 'Work stopped due to heavy rain',
          created_at: '2025-08-10T09:00:00Z'
        },
        {
          id: 'weather-2',
          user_id: 'user-1',
          site_id: 'site-1',
          date: '2025-08-11',
          labor_hours: 0.0, // No work due to typhoon
          work_type: 'weather_cancellation' as const,
          weather_condition: 'typhoon',
          notes: 'Work cancelled due to typhoon',
          created_at: '2025-08-11T09:00:00Z'
        }
      ]

      const monthlyTotals = calculateMonthlyTotals(weatherRecords, '2025-08')

      expect(monthlyTotals.totalLaborHours).toBe(0.5)
      expect(monthlyTotals.workDays).toBe(1)
      expect(monthlyTotals.absentDays).toBe(1)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined attendance records', () => {
      expect(() => calculateMonthlyTotals(null as any, '2025-08')).not.toThrow()
      expect(() => calculateMonthlyTotals(undefined as any, '2025-08')).not.toThrow()
      
      const nullResult = calculateMonthlyTotals(null as any, '2025-08')
      expect(nullResult.totalLaborHours).toBe(0)
    })

    it('should handle invalid labor hours values', () => {
      const invalidRecord = {
        id: 'invalid-1',
        user_id: 'user-1',
        site_id: 'site-1',
        date: '2025-08-20',
        labor_hours: NaN,
        work_type: 'regular' as const,
        weather_condition: 'clear',
        notes: 'Invalid hours',
        created_at: '2025-08-20T09:00:00Z'
      }

      const calculation = calculateLaborHours(invalidRecord.labor_hours)
      expect(calculation.laborHours).toBe(0.0) // Should default to 0
      expect(calculation.type).toBe('absent')
    })

    it('should handle invalid date formats', () => {
      const invalidDateRecord = {
        id: 'invalid-date',
        user_id: 'user-1',
        site_id: 'site-1',
        date: 'invalid-date-format',
        labor_hours: 1.0,
        work_type: 'regular' as const,
        weather_condition: 'clear',
        notes: 'Invalid date',
        created_at: '2025-08-20T09:00:00Z'
      }

      const monthlyTotals = calculateMonthlyTotals([invalidDateRecord], '2025-08')
      expect(monthlyTotals.records).toHaveLength(0) // Should filter out invalid dates
    })
  })
})
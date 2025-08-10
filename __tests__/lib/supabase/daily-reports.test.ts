/**
 * Tests for Daily Reports Business Logic
 * 
 * Testing CRUD operations and workflow for daily construction reports
 * for Task 13
 */

import {
  getDailyReports,
  getDailyReport,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport,
  submitDailyReport,
  approveDailyReport
} from '@/lib/supabase/daily-reports'
import { createClient } from '@/lib/supabase/client'
import { DailyReport } from '@/types'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('Daily Reports Business Logic', () => {
  let mockSupabase: any
  let mockQuery: any
  let mockAuth: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock query chain
    mockQuery = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis()
    }
    
    // Setup mock auth
    mockAuth = {
      getUser: jest.fn()
    }
    
    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn(() => mockQuery),
      auth: mockAuth
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  describe('getDailyReports', () => {
    const mockReports = [
      {
        id: 'report-1',
        site_id: 'site-123',
        work_date: '2024-01-15',
        member_name: 'John Doe',
        process_type: 'Foundation Work',
        total_workers: 10,
        status: 'submitted',
        site: {
          id: 'site-123',
          name: 'Construction Site A',
          organization_id: 'org-123'
        },
        created_by_profile: {
          id: 'user-123',
          full_name: 'Site Manager',
          email: 'manager@site.com'
        }
      },
      {
        id: 'report-2',
        site_id: 'site-456',
        work_date: '2024-01-14',
        member_name: 'Jane Smith',
        process_type: 'Concrete Pouring',
        total_workers: 15,
        status: 'approved',
        site: {
          id: 'site-456',
          name: 'Construction Site B',
          organization_id: 'org-456'
        },
        created_by_profile: {
          id: 'user-456',
          full_name: 'Another Manager',
          email: 'manager2@site.com'
        }
      }
    ]
    
    it('should fetch all daily reports', async () => {
      mockQuery.order.mockResolvedValue({
        data: mockReports,
        error: null
      })
      
      const result = await getDailyReports()
      
      expect(mockSupabase.from).toHaveBeenCalledWith('daily_reports')
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('site:sites!inner'))
      expect(mockQuery.order).toHaveBeenCalledWith('report_date', { ascending: false })
      expect(result).toEqual(mockReports)
    })
    
    it('should filter by site ID when provided', async () => {
      mockQuery.order.mockReturnValue(mockQuery)
      mockQuery.eq.mockResolvedValue({
        data: [mockReports[0]],
        error: null
      })
      
      const result = await getDailyReports('site-123')
      
      expect(mockQuery.eq).toHaveBeenCalledWith('site_id', 'site-123')
      expect(result).toEqual([mockReports[0]])
    })
    
    it('should throw error when query fails', async () => {
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
      
      await expect(getDailyReports()).rejects.toThrow()
    })
  })
  
  describe('getDailyReport', () => {
    const mockReport = {
      id: 'report-123',
      site_id: 'site-123',
      work_date: '2024-01-15',
      member_name: 'John Doe',
      process_type: 'Foundation Work',
      total_workers: 10,
      status: 'submitted',
      sites: {
        id: 'site-123',
        name: 'Construction Site A',
        organization_id: 'org-123'
      },
      created_by_profile: {
        id: 'user-123',
        full_name: 'Site Manager',
        email: 'manager@site.com'
      },
      daily_report_workers: [
        {
          id: 'worker-1',
          user_id: 'user-456',
          role: 'worker',
          start_time: '08:00',
          end_time: '17:00',
          profiles: {
            id: 'user-456',
            full_name: 'Worker One',
            email: 'worker1@site.com'
          }
        }
      ]
    }
    
    it('should fetch single daily report with details', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockReport,
        error: null
      })
      
      const result = await getDailyReport('report-123')
      
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'report-123')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockReport)
    })
    
    it('should throw error when report not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Report not found' }
      })
      
      await expect(getDailyReport('invalid-id')).rejects.toThrow()
    })
  })
  
  describe('createDailyReport', () => {
    const mockUser = {
      id: 'user-123',
      email: 'manager@site.com'
    }
    
    const newReport: Partial<DailyReport> = {
      site_id: 'site-123',
      work_date: '2024-01-15',
      member_name: 'John Doe',
      process_type: 'Foundation Work',
      total_workers: 10,
      issues: 'Weather delay in morning'
    }
    
    it('should create new daily report', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      const createdReport = {
        ...newReport,
        id: 'new-report-123',
        created_by: mockUser.id,
        status: 'draft'
      }
      
      mockQuery.single.mockResolvedValue({
        data: createdReport,
        error: null
      })
      
      const result = await createDailyReport(newReport)
      
      expect(mockAuth.getUser).toHaveBeenCalled()
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          site_id: newReport.site_id,
          work_date: newReport.work_date,
          member_name: newReport.member_name,
          process_type: newReport.process_type,
          total_workers: newReport.total_workers,
          issues: newReport.issues,
          created_by: mockUser.id,
          status: 'draft'
        })
      )
      expect(result).toEqual(createdReport)
    })
    
    it('should throw error when user not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })
      
      await expect(createDailyReport(newReport)).rejects.toThrow('User not authenticated')
    })
    
    it('should throw error when creation fails', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
      
      await expect(createDailyReport(newReport)).rejects.toThrow()
    })
  })
  
  describe('updateDailyReport', () => {
    const updates: Partial<DailyReport> = {
      total_workers: 12,
      issues: 'Weather delay resolved'
    }
    
    it('should update existing daily report', async () => {
      const updatedReport = {
        id: 'report-123',
        ...updates
      }
      
      mockQuery.single.mockResolvedValue({
        data: updatedReport,
        error: null
      })
      
      const result = await updateDailyReport('report-123', updates)
      
      expect(mockQuery.update).toHaveBeenCalledWith(updates)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'report-123')
      expect(result).toEqual(updatedReport)
    })
    
    it('should throw error when update fails', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      })
      
      await expect(updateDailyReport('report-123', updates)).rejects.toThrow()
    })
  })
  
  describe('deleteDailyReport', () => {
    it('should delete daily report', async () => {
      mockQuery.eq.mockResolvedValue({
        error: null
      })
      
      await deleteDailyReport('report-123')
      
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'report-123')
    })
    
    it('should throw error when deletion fails', async () => {
      mockQuery.eq.mockResolvedValue({
        error: { message: 'Delete failed' }
      })
      
      await expect(deleteDailyReport('report-123')).rejects.toThrow()
    })
  })
  
  describe('submitDailyReport', () => {
    it('should submit daily report for approval', async () => {
      const submittedReport = {
        id: 'report-123',
        status: 'submitted',
        submitted_at: expect.any(String)
      }
      
      mockQuery.single.mockResolvedValue({
        data: submittedReport,
        error: null
      })
      
      const result = await submitDailyReport('report-123')
      
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'submitted',
        submitted_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'report-123')
      expect(result).toEqual(submittedReport)
    })
    
    it('should throw error when submission fails', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Submit failed' }
      })
      
      await expect(submitDailyReport('report-123')).rejects.toThrow()
    })
  })
  
  describe('approveDailyReport', () => {
    it('should approve daily report', async () => {
      const approvedReport = {
        id: 'report-123',
        status: 'approved',
        approved_by: 'manager-123',
        approved_at: expect.any(String)
      }
      
      mockQuery.single.mockResolvedValue({
        data: approvedReport,
        error: null
      })
      
      const result = await approveDailyReport('report-123', 'manager-123')
      
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'approved',
        approved_by: 'manager-123',
        approved_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'report-123')
      expect(result).toEqual(approvedReport)
    })
    
    it('should throw error when approval fails', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Approve failed' }
      })
      
      await expect(approveDailyReport('report-123', 'manager-123')).rejects.toThrow()
    })
  })
  
  describe('Business Logic Validations', () => {
    it('should handle reports with multiple workers', async () => {
      const reportWithWorkers = {
        id: 'report-123',
        total_workers: 5,
        daily_report_workers: [
          { id: '1', user_id: 'u1', role: 'worker' },
          { id: '2', user_id: 'u2', role: 'worker' },
          { id: '3', user_id: 'u3', role: 'worker' },
          { id: '4', user_id: 'u4', role: 'worker' },
          { id: '5', user_id: 'u5', role: 'worker' }
        ]
      }
      
      mockQuery.single.mockResolvedValue({
        data: reportWithWorkers,
        error: null
      })
      
      const result = await getDailyReport('report-123')
      
      expect(result.daily_report_workers).toHaveLength(5)
      expect(result.total_workers).toBe(5)
    })
    
    it('should handle date formatting in reports', async () => {
      const report = {
        id: 'report-123',
        work_date: '2024-01-15',
        submitted_at: '2024-01-15T14:30:00Z',
        approved_at: '2024-01-15T16:00:00Z'
      }
      
      mockQuery.single.mockResolvedValue({
        data: report,
        error: null
      })
      
      const result = await getDailyReport('report-123')
      
      expect(result.work_date).toBe('2024-01-15')
      expect(result.submitted_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })
})
import { getDailyReports } from '@/lib/supabase/daily-reports'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('Daily Reports Database Utils', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    // Create a more comprehensive mock chain
    const createMockQuery = (data: any, error: any = null) => {
      const mockQueryBase = {
        eq: jest.fn(),
        order: jest.fn(),
        select: jest.fn(),
      }
      
      // Make methods chainable and have the final result
      mockQueryBase.eq.mockReturnValue(Promise.resolve({ data, error }))
      mockQueryBase.order.mockReturnValue(mockQueryBase)
      mockQueryBase.select.mockReturnValue(mockQueryBase)
      
      // For queries without additional chaining
      Object.assign(mockQueryBase, Promise.resolve({ data, error }))
      
      return mockQueryBase
    }
    
    mockSupabase = {
      from: jest.fn(() => createMockQuery(null)),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getDailyReports', () => {
    it('should fetch daily reports without site filter', async () => {
      const mockReports = [
        { id: 'report-1', title: 'Report 1' },
        { id: 'report-2', title: 'Report 2' }
      ]
      
      // Create a mock query that resolves with our data
      const mockQuery = {
        eq: jest.fn(),
        order: jest.fn(),
        select: jest.fn(),
        then: jest.fn((onResolve) => onResolve({ data: mockReports, error: null })),
        catch: jest.fn(),
      }
      
      // Chain the methods properly
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.order.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getDailyReports()

      expect(result).toEqual(mockReports)
      expect(mockSupabase.from).toHaveBeenCalledWith('daily_reports')
      expect(mockQuery.order).toHaveBeenCalledWith('report_date', { ascending: false })
    })

    it('should fetch daily reports with site filter', async () => {
      const mockReports = [
        { id: 'report-1', title: 'Report 1', site_id: 'site-123' }
      ]
      
      // Create a mock query that resolves with our data
      const mockQuery = {
        eq: jest.fn(),
        order: jest.fn(),
        select: jest.fn(),
        then: jest.fn((onResolve) => onResolve({ data: mockReports, error: null })),
        catch: jest.fn(),
      }
      
      // Chain the methods properly
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.order.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getDailyReports('site-123')

      expect(result).toEqual(mockReports)
      expect(mockQuery.eq).toHaveBeenCalledWith('site_id', 'site-123')
    })

    it('should handle fetch errors', async () => {
      const error = new Error('Fetch failed')
      
      // Create a mock query that resolves with an error
      const mockQuery = {
        eq: jest.fn(),
        order: jest.fn(),
        select: jest.fn(),
        then: jest.fn((onResolve) => onResolve({ data: null, error })),
        catch: jest.fn(),
      }
      
      // Chain the methods properly
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.order.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      
      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(getDailyReports()).rejects.toThrow('Fetch failed')
    })
  })
})
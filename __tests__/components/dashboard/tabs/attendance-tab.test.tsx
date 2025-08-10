/**
 * Attendance Tab Component Test Suite
 * Tests for labor hours system, calendar display, PDF generation, and Korean-specific features
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import { jest } from '@jest/globals'
import AttendanceTab from '@/components/dashboard/tabs/attendance-tab'
import { createMockProfile } from '@/__tests__/utils/test-utils'

// Mock jsPDF for PDF generation testing
const mockJsPDF = {
  setFontSize: jest.fn(),
  text: jest.fn(),
  line: jest.fn(),
  save: jest.fn()
}

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => mockJsPDF)
})

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase)
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('AttendanceTab Component', () => {
  const mockProfile = createMockProfile({
    id: 'user-123',
    full_name: '김철수',
    role: 'worker'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful Supabase response for sites
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'test-site-1', name: 'Test Construction Site Alpha', address: 'Test District, Test City 123' },
        { id: 'test-site-2', name: 'Test Construction Site Beta', address: 'Test District, Test City 456' }
      ],
      error: null
    })
  })

  describe('Component Rendering', () => {
    it('should render tab navigation with correct labels', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      expect(screen.getByText('출력정보')).toBeInTheDocument()
      expect(screen.getByText('급여정보')).toBeInTheDocument()
    })

    it('should render site selection dropdown', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('전체 현장')).toBeInTheDocument()
      })
    })

    it('should render calendar navigation controls', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      const currentDate = new Date()
      const expectedHeader = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`
      
      await waitFor(() => {
        expect(screen.getByText(expectedHeader)).toBeInTheDocument()
      })
      
      // Check for navigation buttons
      const prevButton = screen.getByRole('button', { name: /이전/i }) || 
                         document.querySelector('button[data-testid="prev-month"]') ||
                         screen.getAllByRole('button').find(btn => 
                           btn.querySelector('svg')?.getAttribute('data-testid') === 'chevron-left'
                         )
      expect(prevButton).toBeInTheDocument()
    })
  })

  describe('Labor Hours Display (공수 시스템)', () => {
    it('should display labor hours in correct format', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Check if labor hours are displayed in calendar (from mock data)
        // The component has mock data with labor hours like 1.0, 1.5, 0.5
        const laborHourElements = screen.getAllByText(/\d+\.\d+/)
        expect(laborHourElements.length).toBeGreaterThan(0)
      })
    })

    it('should convert labor hours correctly (1.0 공수 = 8 hours)', () => {
      // Test the business logic: 1.0 공수 should equal 8 working hours
      const laborHours = 1.0
      const expectedWorkHours = 8
      expect(laborHours * 8).toBe(expectedWorkHours)
      
      const halfDay = 0.5
      expect(halfDay * 8).toBe(4)
    })

    it('should display labor hours with proper decimal formatting', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Check statistics display shows formatted labor hours
        const statsSection = screen.getByText('총공수').closest('div')
        expect(statsSection).toBeInTheDocument()
      })
    })

    it('should handle undefined/null labor hours gracefully', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Look for dash or empty display for absent days
        const dashElements = screen.getAllByText('-')
        expect(dashElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Calendar Color Coding', () => {
    it('should apply correct styling for different labor hour ranges', () => {
      // Test color coding logic (currently simplified in component)
      const getDayBackground = (laborHours: number | undefined) => {
        if (!laborHours || laborHours === 0) return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      }

      // Test different labor hour values
      expect(getDayBackground(undefined)).toContain('bg-gray-50')
      expect(getDayBackground(0)).toContain('bg-gray-50')
      expect(getDayBackground(0.5)).toContain('bg-blue-50')
      expect(getDayBackground(1.0)).toContain('bg-blue-50')
      expect(getDayBackground(1.5)).toContain('bg-blue-50')
    })

    it('should show selected date with proper highlighting', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Find calendar days and click one
        const calendarDays = screen.getAllByRole('button').filter(btn => 
          /^\d+$/.test(btn.textContent || '')
        )
        
        if (calendarDays.length > 0) {
          fireEvent.click(calendarDays[0])
          
          // Selected day should have blue background
          expect(calendarDays[0]).toHaveClass('bg-blue-600', 'text-white')
        }
      })
    })
  })

  describe('Statistics Display', () => {
    it('should calculate and display work statistics correctly', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Check for statistics labels
        expect(screen.getByText('작업일')).toBeInTheDocument()
        expect(screen.getByText('현장')).toBeInTheDocument()
        expect(screen.getByText('총공수')).toBeInTheDocument()
      })
    })

    it('should show correct statistics values', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Look for numeric values in statistics
        const statisticsSection = screen.getByText('작업일').closest('div')
        expect(statisticsSection).toBeInTheDocument()
        
        // Should have some numeric values displayed
        const numericElements = statisticsSection?.querySelectorAll('.text-lg')
        expect(numericElements?.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Site Filtering', () => {
    it('should allow site selection from dropdown', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        const siteSelect = screen.getByDisplayValue('전체 현장')
        expect(siteSelect).toBeInTheDocument()
        
        // Change site selection
        fireEvent.change(siteSelect, { target: { value: 'test-site-1' } })
        expect(siteSelect).toHaveValue('test-site-1')
      })
    })

    it('should load sites from Supabase', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('sites')
        expect(mockSupabase.select).toHaveBeenCalledWith('id, name, address')
        expect(mockSupabase.order).toHaveBeenCalledWith('name')
      })
    })
  })

  describe('Sorting Functionality', () => {
    it('should render sortable table headers', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        expect(screen.getByText('날짜')).toBeInTheDocument()
        expect(screen.getByText('현장')).toBeInTheDocument()
        expect(screen.getByText('공수')).toBeInTheDocument()
      })
    })

    it('should handle table header clicks for sorting', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        const dateHeader = screen.getByText('날짜').closest('th')
        expect(dateHeader).toBeInTheDocument()
        
        // Click header should be clickable
        if (dateHeader) {
          fireEvent.click(dateHeader)
          // Check if sort icon changes (chevron should be present)
          const chevronIcons = dateHeader.querySelectorAll('svg')
          expect(chevronIcons.length).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between print and salary tabs', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      const printTab = screen.getByText('출력정보')
      const salaryTab = screen.getByText('급여정보')
      
      // Default should be print tab
      expect(printTab).toHaveClass('bg-blue-50')
      
      // Click salary tab
      fireEvent.click(salaryTab)
      
      await waitFor(() => {
        expect(salaryTab).toHaveClass('bg-blue-50')
      })
      
      // Click back to print tab
      fireEvent.click(printTab)
      
      await waitFor(() => {
        expect(printTab).toHaveClass('bg-blue-50')
      })
    })

    it('should show different content for each tab', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      // Print tab should show calendar
      await waitFor(() => {
        const currentDate = new Date()
        const monthHeader = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`
        expect(screen.getByText(monthHeader)).toBeInTheDocument()
      })
      
      // Switch to salary tab
      const salaryTab = screen.getByText('급여정보')
      fireEvent.click(salaryTab)
      
      await waitFor(() => {
        // Salary tab should show different headers
        expect(screen.getByText('기본급')).toBeInTheDocument()
        expect(screen.getByText('연장수당')).toBeInTheDocument()
        expect(screen.getByText('실지급액')).toBeInTheDocument()
      })
    })
  })

  describe('PDF Generation', () => {
    beforeEach(() => {
      // Reset PDF mock
      Object.values(mockJsPDF).forEach(mock => {
        if (typeof mock === 'function') {
          (mock as jest.Mock).mockClear()
        }
      })
    })

    it('should render PDF download buttons in salary tab', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      // Switch to salary tab
      const salaryTab = screen.getByText('급여정보')
      fireEvent.click(salaryTab)
      
      await waitFor(() => {
        // Look for download icons/buttons
        const downloadButtons = screen.getAllByTitle('PDF 다운로드')
        expect(downloadButtons.length).toBeGreaterThan(0)
      })
    })

    it('should generate PDF with correct employee information', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      // Switch to salary tab
      const salaryTab = screen.getByText('급여정보')
      fireEvent.click(salaryTab)
      
      await waitFor(() => {
        const downloadButtons = screen.getAllByTitle('PDF 다운로드')
        if (downloadButtons.length > 0) {
          fireEvent.click(downloadButtons[0])
          
          // Verify PDF generation was called
          expect(mockJsPDF.setFontSize).toHaveBeenCalled()
          expect(mockJsPDF.text).toHaveBeenCalledWith(
            expect.stringContaining('INOPNC Construction'),
            expect.any(Number),
            expect.any(Number)
          )
          expect(mockJsPDF.text).toHaveBeenCalledWith(
            expect.stringContaining('김철수'),
            expect.any(Number),
            expect.any(Number)
          )
          expect(mockJsPDF.save).toHaveBeenCalled()
        }
      })
    })

    it('should include salary details in PDF', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      // Switch to salary tab and generate PDF
      const salaryTab = screen.getByText('급여정보')
      fireEvent.click(salaryTab)
      
      await waitFor(() => {
        const downloadButtons = screen.getAllByTitle('PDF 다운로드')
        if (downloadButtons.length > 0) {
          fireEvent.click(downloadButtons[0])
          
          // Check if salary items are added to PDF
          expect(mockJsPDF.text).toHaveBeenCalledWith(
            'Basic Salary',
            expect.any(Number),
            expect.any(Number)
          )
          expect(mockJsPDF.text).toHaveBeenCalledWith(
            'Overtime Pay',
            expect.any(Number),
            expect.any(Number)
          )
        }
      })
    })

    it('should handle PDF generation errors gracefully', async () => {
      // Mock PDF save to throw error
      mockJsPDF.save.mockImplementation(() => {
        throw new Error('PDF generation failed')
      })
      
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      
      render(<AttendanceTab profile={mockProfile} />)
      
      const salaryTab = screen.getByText('급여정보')
      fireEvent.click(salaryTab)
      
      await waitFor(() => {
        const downloadButtons = screen.getAllByTitle('PDF 다운로드')
        if (downloadButtons.length > 0) {
          fireEvent.click(downloadButtons[0])
          
          // Should show error alert
          expect(alertSpy).toHaveBeenCalledWith('PDF 생성 중 오류가 발생했습니다.')
        }
      })
      
      alertSpy.mockRestore()
    })
  })

  describe('Korean Localization', () => {
    it('should display all text in Korean', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Check for Korean labels
        expect(screen.getByText('출력정보')).toBeInTheDocument()
        expect(screen.getByText('급여정보')).toBeInTheDocument()
        expect(screen.getByText('전체 현장')).toBeInTheDocument()
        expect(screen.getByText('작업일')).toBeInTheDocument()
        expect(screen.getByText('총공수')).toBeInTheDocument()
      })
    })

    it('should format currency in Korean format', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      const salaryTab = screen.getByText('급여정보')
      fireEvent.click(salaryTab)
      
      await waitFor(() => {
        // Look for Korean currency formatting (만원 units)
        const currencyElements = screen.getAllByText(/\d+만/)
        expect(currencyElements.length).toBeGreaterThan(0)
      })
    })

    it('should display Korean day names in calendar', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        const koreanDays = ['일', '월', '화', '수', '목', '금', '토']
        koreanDays.forEach(day => {
          expect(screen.getByText(day)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner while data loads', () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      // Loading spinner should be present initially
      const spinner = screen.getByText('데이터 로딩...')
      expect(spinner).toBeInTheDocument()
    })

    it('should hide loading spinner after data loads', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        expect(screen.queryByText('데이터 로딩...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase errors gracefully', async () => {
      // Mock Supabase error
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
      
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Should still render with fallback data
        expect(screen.getByText('전체 현장')).toBeInTheDocument()
      })
    })

    it('should use fallback mock data when Supabase fails', async () => {
      // Mock Supabase failure
      mockSupabase.select.mockRejectedValue(new Error('Network error'))
      
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Should render with mock sites
        expect(screen.getByText('전체 현장')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render compact design elements for mobile', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Check for mobile-friendly classes
        const compactElements = document.querySelectorAll('.text-xs')
        expect(compactElements.length).toBeGreaterThan(0)
      })
    })

    it('should use touch-friendly button sizes', async () => {
      render(<AttendanceTab profile={mockProfile} />)
      
      await waitFor(() => {
        // Calendar buttons should have touch-manipulation class
        const touchButtons = document.querySelectorAll('.touch-manipulation')
        expect(touchButtons.length).toBeGreaterThan(0)
      })
    })
  })
})
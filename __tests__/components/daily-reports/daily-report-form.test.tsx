/**
 * Tests for DailyReportForm Component
 * 
 * Testing form validation, submission, and error handling
 * for Task 14.2
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import DailyReportForm from '@/components/daily-reports/daily-report-form'
import { createDailyReport } from '@/lib/supabase/daily-reports'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/supabase/daily-reports', () => ({
  createDailyReport: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>{children}</a>
    )
  }
})

describe('DailyReportForm Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }
  
  const mockSites = [
    {
      id: 'site-1',
      name: 'Construction Site A',
      organization_id: 'org-1'
    },
    {
      id: 'site-2', 
      name: 'Construction Site B',
      organization_id: 'org-1'
    }
  ]
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(createDailyReport as jest.Mock).mockResolvedValue({ id: 'report-123' })
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Required fields
      expect(screen.getByLabelText('현장 선택 *')).toBeInTheDocument()
      expect(screen.getByLabelText('작업일자 *')).toBeInTheDocument()
      expect(screen.getByLabelText('작업 내용 *')).toBeInTheDocument()
      
      // Optional fields
      expect(screen.getByLabelText('날씨')).toBeInTheDocument()
      expect(screen.getByLabelText('온도 (°C)')).toBeInTheDocument()
      expect(screen.getByLabelText('특이사항')).toBeInTheDocument()
    })

    it('should populate site dropdown with provided sites', () => {
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const siteSelect = screen.getByLabelText('현장 선택 *') as HTMLSelectElement
      
      // Check default option
      expect(screen.getByText('현장을 선택하세요')).toBeInTheDocument()
      
      // Check site options
      expect(screen.getByText('Construction Site A')).toBeInTheDocument()
      expect(screen.getByText('Construction Site B')).toBeInTheDocument()
    })

    it('should set today as default work date', () => {
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const dateInput = screen.getByLabelText('작업일자 *') as HTMLInputElement
      const today = new Date().toISOString().split('T')[0]
      
      expect(dateInput.value).toBe(today)
    })

    it('should render weather options', () => {
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const weatherSelect = screen.getByLabelText('날씨') as HTMLSelectElement
      
      expect(screen.getByText('맑음')).toBeInTheDocument()
      expect(screen.getByText('흐림')).toBeInTheDocument()
      expect(screen.getByText('비')).toBeInTheDocument()
      expect(screen.getByText('눈')).toBeInTheDocument()
      expect(screen.getByText('안개')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should require site selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const submitButton = screen.getByText('저장')
      await user.click(submitButton)
      
      // Form should not submit without site selection
      expect(createDailyReport).not.toHaveBeenCalled()
    })

    it('should require work date', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const dateInput = screen.getByLabelText('작업일자 *') as HTMLInputElement
      await user.clear(dateInput)
      
      const submitButton = screen.getByText('저장')
      await user.click(submitButton)
      
      expect(createDailyReport).not.toHaveBeenCalled()
    })

    it('should require work content', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill required fields except work content
      const siteSelect = screen.getByLabelText('현장 선택 *')
      await user.selectOptions(siteSelect, 'site-1')
      
      const submitButton = screen.getByText('저장')
      await user.click(submitButton)
      
      expect(createDailyReport).not.toHaveBeenCalled()
    })

    it('should validate temperature as number', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const tempInput = screen.getByLabelText('온도 (°C)')
      await user.type(tempInput, '25.5')
      
      expect(tempInput).toHaveValue(25.5)
    })
  })

  describe('Form Submission', () => {
    it('should submit form with all required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill required fields
      const siteSelect = screen.getByLabelText('현장 선택 *')
      await user.selectOptions(siteSelect, 'site-1')
      
      const workContent = screen.getByLabelText('작업 내용 *')
      await user.type(workContent, 'Foundation work completed on section A')
      
      // Submit form
      const submitButton = screen.getByText('저장')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(createDailyReport).toHaveBeenCalledWith({
          site_id: 'site-1',
          work_date: expect.any(String),
          member_name: 'Unknown',
          process_type: 'General',
          total_workers: 1,
          issues: ''
        })
      })
    })

    it('should submit form with all fields filled', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill all fields
      await user.selectOptions(screen.getByLabelText('현장 선택 *'), 'site-2')
      await user.type(screen.getByLabelText('작업 내용 *'), 'Concrete pouring completed')
      await user.selectOptions(screen.getByLabelText('날씨'), '맑음')
      await user.type(screen.getByLabelText('온도 (°C)'), '25.5')
      await user.type(screen.getByLabelText('특이사항'), 'No issues today')
      
      const submitButton = screen.getByText('저장')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(createDailyReport).toHaveBeenCalledWith({
          site_id: 'site-2',
          work_date: expect.any(String),
          member_name: 'Unknown',
          process_type: 'General',
          total_workers: 1,
          issues: 'No issues today'
        })
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      
      // Mock slow API response
      ;(createDailyReport as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 'report-123' }), 100))
      )
      
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill required fields
      await user.selectOptions(screen.getByLabelText('현장 선택 *'), 'site-1')
      await user.type(screen.getByLabelText('작업 내용 *'), 'Test content')
      
      const submitButton = screen.getByText('저장')
      await user.click(submitButton)
      
      // Check loading state
      expect(screen.getByText('저장 중...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('저장')).toBeInTheDocument()
      })
    })

    it('should redirect to report detail page after successful submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill and submit
      await user.selectOptions(screen.getByLabelText('현장 선택 *'), 'site-1')
      await user.type(screen.getByLabelText('작업 내용 *'), 'Test content')
      await user.click(screen.getByText('저장'))
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/daily-reports/report-123')
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error alert when submission fails', async () => {
      const user = userEvent.setup()
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      
      ;(createDailyReport as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill and submit
      await user.selectOptions(screen.getByLabelText('현장 선택 *'), 'site-1')
      await user.type(screen.getByLabelText('작업 내용 *'), 'Test content')
      await user.click(screen.getByText('저장'))
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('작업일지 생성에 실패했습니다.')
      })
      
      alertSpy.mockRestore()
    })

    it('should re-enable submit button after error', async () => {
      const user = userEvent.setup()
      jest.spyOn(window, 'alert').mockImplementation()
      
      ;(createDailyReport as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill and submit
      await user.selectOptions(screen.getByLabelText('현장 선택 *'), 'site-1')
      await user.type(screen.getByLabelText('작업 내용 *'), 'Test content')
      
      const submitButton = screen.getByText('저장')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
        expect(submitButton).toHaveTextContent('저장')
      })
    })

    it('should log error to console', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      jest.spyOn(window, 'alert').mockImplementation()
      
      const error = new Error('API Error')
      ;(createDailyReport as jest.Mock).mockRejectedValue(error)
      
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill and submit
      await user.selectOptions(screen.getByLabelText('현장 선택 *'), 'site-1')
      await user.type(screen.getByLabelText('작업 내용 *'), 'Test content')
      await user.click(screen.getByText('저장'))
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating report:', error)
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Form Navigation', () => {
    it('should have cancel button that links to dashboard', () => {
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const cancelButton = screen.getByText('취소')
      expect(cancelButton).toHaveAttribute('href', '/dashboard')
    })

    it('should have back to dashboard link', () => {
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const backLink = screen.getByText('대시보드로 돌아가기')
      expect(backLink).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all form fields', () => {
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Check all labels are associated with inputs
      expect(screen.getByLabelText('현장 선택 *')).toBeInTheDocument()
      expect(screen.getByLabelText('작업일자 *')).toBeInTheDocument()
      expect(screen.getByLabelText('작업 내용 *')).toBeInTheDocument()
      expect(screen.getByLabelText('날씨')).toBeInTheDocument()
      expect(screen.getByLabelText('온도 (°C)')).toBeInTheDocument()
      expect(screen.getByLabelText('특이사항')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Start with the first form field
      const siteSelect = screen.getByLabelText('현장 선택 *')
      siteSelect.focus()
      expect(siteSelect).toHaveFocus()
      
      // Tab to next field
      await user.tab()
      expect(screen.getByLabelText('작업일자 *')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText('작업 내용 *')).toHaveFocus()
    })
  })

  describe('Form State Management', () => {
    it('should update form state when fields change', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      const workContent = screen.getByLabelText('작업 내용 *') as HTMLTextAreaElement
      await user.type(workContent, 'Updated content')
      
      expect(workContent.value).toBe('Updated content')
      
      const tempInput = screen.getByLabelText('온도 (°C)') as HTMLInputElement
      await user.type(tempInput, '30')
      
      expect(tempInput.value).toBe('30')
    })

    it('should preserve form data between field changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<DailyReportForm sites={mockSites} />)
      
      // Fill multiple fields
      await user.selectOptions(screen.getByLabelText('현장 선택 *'), 'site-1')
      await user.type(screen.getByLabelText('작업 내용 *'), 'Content')
      await user.selectOptions(screen.getByLabelText('날씨'), '비')
      
      // Verify all values are preserved
      expect(screen.getByLabelText('현장 선택 *')).toHaveValue('site-1')
      expect(screen.getByLabelText('작업 내용 *')).toHaveValue('Content')
      expect(screen.getByLabelText('날씨')).toHaveValue('비')
    })
  })
})
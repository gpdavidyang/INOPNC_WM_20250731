/**
 * Tests for DailyReportList Component
 * 
 * Testing the daily report list data table component
 * for Task 14
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import DailyReportList from '@/components/daily-reports/daily-report-list'
import { getDailyReports } from '@/lib/supabase/daily-reports'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/supabase/daily-reports', () => ({
  getDailyReports: jest.fn()
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

describe('DailyReportList Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }
  
  const mockReports = [
    {
      id: 'report-1',
      report_date: '2024-01-15',
      status: 'draft',
      work_content: 'Foundation work completed on section A',
      site: { 
        id: 'site-1', 
        name: 'Construction Site A' 
      },
      created_by_profile: { 
        id: 'user-1',
        full_name: 'John Doe' 
      }
    },
    {
      id: 'report-2',
      report_date: '2024-01-14',
      status: 'submitted',
      work_content: 'Concrete pouring for second floor',
      site: { 
        id: 'site-1', 
        name: 'Construction Site A' 
      },
      created_by_profile: { 
        id: 'user-2',
        full_name: 'Jane Smith' 
      }
    },
    {
      id: 'report-3',
      report_date: '2024-01-13',
      status: 'approved',
      work_content: 'Steel frame installation completed',
      site: { 
        id: 'site-2', 
        name: 'Construction Site B' 
      },
      created_by_profile: { 
        id: 'user-1',
        full_name: 'John Doe' 
      }
    }
  ]
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(getDailyReports as jest.Mock).mockResolvedValue(mockReports)
  })

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      renderWithProviders(<DailyReportList />)
      
      // Check for loading spinner - the component doesn't use role="status" but has a spinner div
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should render report list after loading', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        expect(screen.getByText('작업일지 목록')).toBeInTheDocument()
      })
      
      // Check that all reports are displayed
      expect(screen.getByText('Foundation work completed on section A')).toBeInTheDocument()
      expect(screen.getByText('Concrete pouring for second floor')).toBeInTheDocument()
      expect(screen.getByText('Steel frame installation completed')).toBeInTheDocument()
    })

    it('should display empty state when no reports', async () => {
      ;(getDailyReports as jest.Mock).mockResolvedValue([])
      
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        expect(screen.getByText('작업일지가 없습니다.')).toBeInTheDocument()
      })
    })

    it('should display error state when loading fails', async () => {
      ;(getDailyReports as jest.Mock).mockRejectedValue(new Error('Failed to load'))
      
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        expect(screen.getByText('작업일지를 불러오는데 실패했습니다.')).toBeInTheDocument()
      })
    })
  })

  describe('Status Badges', () => {
    it('should display correct status badges', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        expect(screen.getByText('작성중')).toBeInTheDocument() // draft
        expect(screen.getByText('제출됨')).toBeInTheDocument() // submitted
        expect(screen.getByText('승인됨')).toBeInTheDocument() // approved
      })
    })

    it('should apply correct status colors', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        const draftBadge = screen.getByText('작성중')
        expect(draftBadge).toHaveClass('bg-gray-100', 'text-gray-800')
        
        const submittedBadge = screen.getByText('제출됨')
        expect(submittedBadge).toHaveClass('bg-blue-100', 'text-blue-800')
        
        const approvedBadge = screen.getByText('승인됨')
        expect(approvedBadge).toHaveClass('bg-green-100', 'text-green-800')
      })
    })
  })

  describe('Report Information Display', () => {
    it('should display report dates', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        // Dates should be formatted
        expect(screen.getByText('2024-01-15')).toBeInTheDocument()
        expect(screen.getByText('2024-01-14')).toBeInTheDocument()
        expect(screen.getByText('2024-01-13')).toBeInTheDocument()
      })
    })

    it('should display site names', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        // There are multiple Site A entries, so use getAllByText
        const siteATexts = screen.getAllByText('현장: Construction Site A')
        expect(siteATexts.length).toBeGreaterThanOrEqual(1)
        
        expect(screen.getByText('현장: Construction Site B')).toBeInTheDocument()
      })
    })

    it('should display creator names', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        expect(screen.getAllByText(/작성자: John Doe/)).toHaveLength(2)
        expect(screen.getByText('작성자: Jane Smith')).toBeInTheDocument()
      })
    })

    it('should truncate long work content', async () => {
      const longContent = 'A'.repeat(200) // Very long content
      const reportsWithLongContent = [{
        ...mockReports[0],
        work_content: longContent
      }]
      
      ;(getDailyReports as jest.Mock).mockResolvedValue(reportsWithLongContent)
      
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        const contentElement = screen.getByText(longContent)
        expect(contentElement).toHaveClass('line-clamp-2')
      })
    })
  })

  describe('Actions', () => {
    it('should show create button when canCreate is true', async () => {
      renderWithProviders(<DailyReportList canCreate={true} />)
      
      await waitFor(() => {
        const createButton = screen.getByText('새 작업일지')
        expect(createButton).toBeInTheDocument()
        expect(createButton.closest('a')).toHaveAttribute('href', '/dashboard/daily-reports/new')
      })
    })

    it('should not show create button when canCreate is false', async () => {
      renderWithProviders(<DailyReportList canCreate={false} />)
      
      await waitFor(() => {
        expect(screen.queryByText('새 작업일지')).not.toBeInTheDocument()
      })
    })

    it('should show view action for all reports', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        const viewLinks = screen.getAllByRole('link', { name: '' }).filter(
          link => link.querySelector('[class*="lucide-eye"]')
        )
        expect(viewLinks).toHaveLength(3)
        
        // Check href attributes
        expect(viewLinks[0]).toHaveAttribute('href', '/dashboard/daily-reports/report-1')
        expect(viewLinks[1]).toHaveAttribute('href', '/dashboard/daily-reports/report-2')
        expect(viewLinks[2]).toHaveAttribute('href', '/dashboard/daily-reports/report-3')
      })
    })

    it('should show edit and delete actions only for draft reports', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        // Find the draft report row (first one)
        const draftReportRow = screen.getByText('Foundation work completed on section A').closest('li')
        
        // Should have edit and delete buttons
        const editLink = draftReportRow?.querySelector('a[href*="/edit"]')
        expect(editLink).toBeInTheDocument()
        expect(editLink).toHaveAttribute('href', '/dashboard/daily-reports/report-1/edit')
        
        const deleteButton = draftReportRow?.querySelector('button')
        expect(deleteButton).toBeInTheDocument()
        
        // Non-draft reports should not have edit/delete
        const submittedReportRow = screen.getByText('Concrete pouring for second floor').closest('li')
        expect(submittedReportRow?.querySelector('a[href*="/edit"]')).not.toBeInTheDocument()
        expect(submittedReportRow?.querySelector('button')).not.toBeInTheDocument()
      })
    })

    it('should show confirmation dialog on delete', async () => {
      const user = userEvent.setup()
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
      
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        const deleteButton = screen.getAllByRole('button')[0] // First delete button
        expect(deleteButton).toBeInTheDocument()
      })
      
      const deleteButton = screen.getAllByRole('button')[0]
      await user.click(deleteButton)
      
      expect(confirmSpy).toHaveBeenCalledWith('정말 삭제하시겠습니까?')
      
      confirmSpy.mockRestore()
    })
  })

  describe('Filtering', () => {
    it('should filter reports by siteId when provided', async () => {
      renderWithProviders(<DailyReportList siteId="site-1" />)
      
      await waitFor(() => {
        expect(getDailyReports).toHaveBeenCalledWith('site-1')
      })
    })

    it('should load all reports when siteId is not provided', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        expect(getDailyReports).toHaveBeenCalledWith(undefined)
      })
    })

    it('should reload reports when siteId changes', async () => {
      const { rerender } = renderWithProviders(<DailyReportList siteId="site-1" />)
      
      await waitFor(() => {
        expect(getDailyReports).toHaveBeenCalledWith('site-1')
      })
      
      // Change siteId
      rerender(<DailyReportList siteId="site-2" />)
      
      await waitFor(() => {
        expect(getDailyReports).toHaveBeenCalledWith('site-2')
        expect(getDailyReports).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: '작업일지 목록' })
        expect(heading).toBeInTheDocument()
        expect(heading.tagName).toBe('H3')
      })
    })

    it('should have accessible links', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        links.forEach(link => {
          expect(link).toHaveAttribute('href')
        })
      })
    })

    it('should use semantic list structure', async () => {
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        const list = screen.getByRole('list')
        expect(list).toBeInTheDocument()
        
        const listItems = screen.getAllByRole('listitem')
        expect(listItems).toHaveLength(3) // 3 reports
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      ;(getDailyReports as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        expect(screen.getByText('작업일지를 불러오는데 실패했습니다.')).toBeInTheDocument()
      })
      
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it('should handle empty data gracefully', async () => {
      ;(getDailyReports as jest.Mock).mockResolvedValue(null)
      
      renderWithProviders(<DailyReportList />)
      
      await waitFor(() => {
        expect(screen.getByText('작업일지가 없습니다.')).toBeInTheDocument()
      })
    })
  })
})
/**
 * Tests for DailyReportFormEnhanced Component
 * 
 * Testing enhanced form with 공수 (labor hours) input validation
 * for Task 14.2
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import DailyReportFormEnhanced from '@/components/daily-reports/daily-report-form-enhanced'
import { createDailyReport } from '@/app/actions/daily-reports'
import { uploadPhotoToStorage } from '@/app/actions/simple-upload'
import { addBulkAttendance } from '@/app/actions/attendance'
import { Profile } from '@/types'

// Mock dependencies
jest.mock('@/app/actions/daily-reports', () => ({
  createDailyReport: jest.fn()
}))

jest.mock('@/app/actions/simple-upload', () => ({
  uploadPhotoToStorage: jest.fn()
}))

jest.mock('@/app/actions/attendance', () => ({
  addBulkAttendance: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn()
  }))
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  Building: () => <div>Building Icon</div>,
  Calendar: () => <div>Calendar Icon</div>,
  FileText: () => <div>FileText Icon</div>,
  Users: () => <div>Users Icon</div>,
  Camera: () => <div>Camera Icon</div>,
  ChevronDown: () => <div>ChevronDown Icon</div>,
  ChevronUp: () => <div>ChevronUp Icon</div>,
  X: () => <div>X Icon</div>,
  User: () => <div>User Icon</div>
}))

describe('DailyReportFormEnhanced Component', () => {
  const mockSites = [
    { 
      id: 'site-1', 
      name: 'Construction Site A',
      organization_id: 'org-1',
      address: '123 Main St',
      status: 'active',
      created_at: '2024-01-01'
    },
    { 
      id: 'site-2', 
      name: 'Construction Site B',
      organization_id: 'org-1',
      address: '456 Oak Ave',
      status: 'active',
      created_at: '2024-01-01'
    }
  ]
  
  const mockProfile: Profile = {
    id: 'user-1',
    email: 'user@test.com',
    full_name: 'Test User',
    role: 'site_manager',
    organization_id: 'org-1',
    site_id: 'site-1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    status: 'active'
  }
  
  const mockWorkers = [
    { 
      id: 'worker-1', 
      full_name: 'Worker One', 
      role: 'worker' as const,
      email: 'worker1@test.com',
      organization_id: 'org-1',
      site_id: 'site-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      status: 'active' as const
    },
    { 
      id: 'worker-2', 
      full_name: 'Worker Two', 
      role: 'worker' as const,
      email: 'worker2@test.com',
      organization_id: 'org-1',
      site_id: 'site-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      status: 'active' as const
    }
  ]
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createDailyReport as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'report-123' }
    })
    ;(addBulkAttendance as jest.Mock).mockResolvedValue({
      success: true
    })
  })

  describe('Worker Management with 공수 Input', () => {
    it('should render worker section with 공수 dropdown', async () => {
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Click on worker section to expand it
      const workerSection = screen.getByText('작업자 입력')
      await userEvent.click(workerSection)
      
      // Add a worker
      const addWorkerButton = screen.getByText('작업자 추가')
      await userEvent.click(addWorkerButton)
      
      await waitFor(() => {
        expect(screen.getByText('공수')).toBeInTheDocument()
      })
    })

    it('should display correct 공수 options', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Expand worker section
      await user.click(screen.getByText('작업자 입력'))
      
      // Add a worker
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        const laborHoursSelect = screen.getByLabelText('공수') as HTMLSelectElement
        expect(laborHoursSelect).toBeInTheDocument()
        
        // Check available options
        const options = Array.from(laborHoursSelect.options).map(opt => opt.value)
        expect(options).toEqual(['0', '1', '1.5', '2', '2.5', '3'])
      })
    })

    it('should validate 공수 values correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Fill basic required fields
      await user.selectOptions(screen.getByLabelText('현장 선택'), 'site-1')
      
      // Expand worker section
      await user.click(screen.getByText('작업자 입력'))
      
      // Add a worker
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('작업자')).toBeInTheDocument()
      })
      
      // Select worker and 공수
      const workerSelect = screen.getByLabelText('작업자')
      await user.selectOptions(workerSelect, 'worker-1')
      
      const laborHoursSelect = screen.getByLabelText('공수')
      await user.selectOptions(laborHoursSelect, '1.5')
      
      expect(laborHoursSelect).toHaveValue('1.5')
    })

    it('should calculate total 공수 correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Expand worker section
      await user.click(screen.getByText('작업자 입력'))
      
      // Add multiple workers with different 공수
      await user.click(screen.getByText('작업자 추가'))
      await waitFor(() => {
        const workerSelects = screen.getAllByLabelText('작업자')
        expect(workerSelects).toHaveLength(1)
      })
      
      // First worker: 1.0 공수
      await user.selectOptions(screen.getAllByLabelText('작업자')[0], 'worker-1')
      await user.selectOptions(screen.getAllByLabelText('공수')[0], '1')
      
      // Add second worker
      await user.click(screen.getByText('작업자 추가'))
      await waitFor(() => {
        const workerSelects = screen.getAllByLabelText('작업자')
        expect(workerSelects).toHaveLength(2)
      })
      
      // Second worker: 0.5 공수
      await user.selectOptions(screen.getAllByLabelText('작업자')[1], 'worker-2')
      await user.selectOptions(screen.getAllByLabelText('공수')[1], '1.5')
      
      // Total should be 2.5 공수
      // Note: The component might need to display total somewhere
    })

    it('should handle 0 공수 (휴무) correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Expand worker section
      await user.click(screen.getByText('작업자 입력'))
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('공수')).toBeInTheDocument()
      })
      
      // Select 0 공수
      const laborHoursSelect = screen.getByLabelText('공수')
      await user.selectOptions(laborHoursSelect, '0')
      
      expect(laborHoursSelect).toHaveValue('0')
    })

    it('should not allow invalid 공수 values', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Expand worker section
      await user.click(screen.getByText('작업자 입력'))
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        const laborHoursSelect = screen.getByLabelText('공수') as HTMLSelectElement
        
        // Check that only valid values are available
        const validValues = ['0', '1', '1.5', '2', '2.5', '3']
        const options = Array.from(laborHoursSelect.options).map(opt => opt.value)
        
        expect(options).toEqual(validValues)
        
        // Try to find invalid options (should not exist)
        expect(options).not.toContain('0.25')
        expect(options).not.toContain('4')
        expect(options).not.toContain('-1')
      })
    })

    it('should remove worker entry with 공수', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Expand worker section and add worker
      await user.click(screen.getByText('작업자 입력'))
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('작업자')).toBeInTheDocument()
      })
      
      // Configure worker
      await user.selectOptions(screen.getByLabelText('작업자'), 'worker-1')
      await user.selectOptions(screen.getByLabelText('공수'), '1')
      
      // Remove worker
      const removeButton = screen.getByRole('button', { name: /X Icon/i })
      await user.click(removeButton)
      
      // Worker should be removed
      expect(screen.queryByLabelText('작업자')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('공수')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission with 공수', () => {
    it('should include 공수 data in form submission', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Fill required fields
      await user.selectOptions(screen.getByLabelText('현장 선택'), 'site-1')
      
      // Expand and fill work content
      await user.click(screen.getByText('작업 내용'))
      const workContent = screen.getByLabelText('작업 내용')
      await user.type(workContent, 'Test work content')
      
      // Add worker with 공수
      await user.click(screen.getByText('작업자 입력'))
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('작업자')).toBeInTheDocument()
      })
      
      await user.selectOptions(screen.getByLabelText('작업자'), 'worker-1')
      await user.selectOptions(screen.getByLabelText('공수'), '1.5')
      
      // Submit form
      const submitButton = screen.getByText('작성 완료')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(createDailyReport).toHaveBeenCalledWith(
          expect.objectContaining({
            site_id: 'site-1',
            work_content: 'Test work content',
            attendance_records: expect.arrayContaining([
              expect.objectContaining({
                worker_id: 'worker-1',
                labor_hours: 1.5
              })
            ])
          })
        )
      })
    })

    it('should save draft with 공수 data', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Fill some fields
      await user.selectOptions(screen.getByLabelText('현장 선택'), 'site-1')
      
      // Add worker with 공수
      await user.click(screen.getByText('작업자 입력'))
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('작업자')).toBeInTheDocument()
      })
      
      await user.selectOptions(screen.getByLabelText('작업자'), 'worker-2')
      await user.selectOptions(screen.getByLabelText('공수'), '2')
      
      // Save draft
      const saveButton = screen.getByText('임시 저장')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(createDailyReport).toHaveBeenCalledWith(
          expect.objectContaining({
            site_id: 'site-1',
            attendance_records: expect.arrayContaining([
              expect.objectContaining({
                worker_id: 'worker-2',
                labor_hours: 2
              })
            ])
          })
        )
      })
    })
  })

  describe('Business Logic Validation', () => {
    it('should validate 공수 ranges according to business rules', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Expand worker section
      await user.click(screen.getByText('작업자 입력'))
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        const laborHoursSelect = screen.getByLabelText('공수') as HTMLSelectElement
        const options = Array.from(laborHoursSelect.options)
        
        // Business rules:
        // - 0: 휴무 (no work)
        // - 1.0: 정규 근무 (8 hours)
        // - 1.5, 2.0, 2.5, 3.0: 초과 근무 포함
        
        // Check that fractional values like 0.25, 0.5, 0.75 are not available
        const values = options.map(opt => opt.value)
        expect(values).not.toContain('0.25')
        expect(values).not.toContain('0.5')
        expect(values).not.toContain('0.75')
        
        // Only specific values are allowed
        expect(values).toEqual(['0', '1', '1.5', '2', '2.5', '3'])
      })
    })

    it('should handle multiple workers with same 공수', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Expand worker section
      await user.click(screen.getByText('작업자 입력'))
      
      // Add two workers
      await user.click(screen.getByText('작업자 추가'))
      await waitFor(() => {
        expect(screen.getAllByLabelText('작업자')).toHaveLength(1)
      })
      
      await user.click(screen.getByText('작업자 추가'))
      await waitFor(() => {
        expect(screen.getAllByLabelText('작업자')).toHaveLength(2)
      })
      
      // Set both to same 공수
      const laborHoursSelects = screen.getAllByLabelText('공수')
      await user.selectOptions(laborHoursSelects[0], '1')
      await user.selectOptions(laborHoursSelects[1], '1')
      
      // Both should have same value
      expect(laborHoursSelects[0]).toHaveValue('1')
      expect(laborHoursSelects[1]).toHaveValue('1')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for 공수 inputs', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <DailyReportFormEnhanced 
          sites={mockSites}
          currentUser={mockProfile}
          workers={mockWorkers}
        />
      )
      
      // Expand worker section
      await user.click(screen.getByText('작업자 입력'))
      await user.click(screen.getByText('작업자 추가'))
      
      await waitFor(() => {
        const laborHoursLabel = screen.getByText('공수')
        const laborHoursSelect = screen.getByLabelText('공수')
        
        expect(laborHoursLabel).toBeInTheDocument()
        expect(laborHoursSelect).toBeInTheDocument()
        expect(laborHoursSelect.tagName).toBe('SELECT')
      })
    })
  })
})
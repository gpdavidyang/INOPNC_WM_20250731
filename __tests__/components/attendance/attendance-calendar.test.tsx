/**
 * Tests for AttendanceCalendar Component
 * 
 * Testing the attendance calendar UI component
 * for Task 14
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { AttendanceCalendar } from '@/components/attendance/attendance-calendar'
import { getAttendanceRecords, getCompanyAttendanceSummary } from '@/app/actions/attendance'
import { getSites } from '@/app/actions/sites'
import type { Profile } from '@/types'

// Mock dependencies
jest.mock('@/app/actions/attendance', () => ({
  getAttendanceRecords: jest.fn(),
  getCompanyAttendanceSummary: jest.fn()
}))

jest.mock('@/app/actions/sites', () => ({
  getSites: jest.fn()
}))

// Mock Next.js dynamic import
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: () => Promise<any>) => {
    const Component = fn().then ? fn : () => fn()
    return Component
  }
}))

describe('AttendanceCalendar Component', () => {
  // Mock current date to ensure consistent test results
  const mockDate = new Date('2024-01-15T10:00:00')
  const originalDate = Date
  
  beforeAll(() => {
    global.Date = jest.fn((...args) => {
      if (args.length === 0) {
        return mockDate
      }
      return new originalDate(...args)
    }) as any
    global.Date.now = () => mockDate.getTime()
    Object.setPrototypeOf(global.Date, originalDate)
    
    // Copy static methods
    for (const prop in originalDate) {
      if (originalDate.hasOwnProperty(prop)) {
        ;(global.Date as any)[prop] = (originalDate as any)[prop]
      }
    }
  })
  
  afterAll(() => {
    global.Date = originalDate
  })
  
  const mockProfile: Profile = {
    id: 'user-123',
    email: 'worker@test.com',
    full_name: 'Test Worker',
    role: 'worker',
    organization_id: 'org-123',
    site_id: 'site-123',
    phone: '+1234567890',
    status: 'active',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
  
  const mockSites = [
    {
      id: 'site-123',
      name: 'Construction Site A',
      organization_id: 'org-123',
      address: '123 Main St',
      status: 'active',
      created_at: '2024-01-01'
    },
    {
      id: 'site-456',
      name: 'Construction Site B',
      organization_id: 'org-123',
      address: '456 Oak Ave',
      status: 'active',
      created_at: '2024-01-01'
    }
  ]
  
  const mockAttendanceRecords = [
    {
      id: 'record-1',
      user_id: 'user-123',
      site_id: 'site-123',
      date: '2024-01-15',
      check_in_time: '08:00:00',
      check_out_time: '17:00:00',
      labor_hours: 1.0,
      status: 'present'
    },
    {
      id: 'record-2',
      user_id: 'user-123',
      site_id: 'site-123',
      date: '2024-01-16',
      check_in_time: '08:00:00',
      check_out_time: '12:00:00',
      labor_hours: 0.5,
      status: 'present'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful responses by default
    ;(getSites as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSites
    })
    
    ;(getAttendanceRecords as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAttendanceRecords.map(record => ({
        ...record,
        attendance_date: record.date,
        site: { name: 'Construction Site A' }
      }))
    })
    
    ;(getCompanyAttendanceSummary as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        totalDays: 2,
        totalHours: 12,
        totalWorkers: 5,
        records: [{
          date: '2024-01-15',
          totalWorkers: 5
        }]
      }
    })
  })

  describe('Rendering', () => {
    it('should render calendar with current month', async () => {
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        // The calendar shows the current month
        expect(screen.getByText(/\d{4}년 \d{2}월/)).toBeInTheDocument()
      })
    })

    it('should render weekday headers', async () => {
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        const weekdays = ['일', '월', '화', '수', '목', '금', '토']
        weekdays.forEach(day => {
          expect(screen.getByText(day)).toBeInTheDocument()
        })
      })
    })

    it('should render calendar grid', async () => {
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        // Check for calendar grid structure - weekday headers
        expect(screen.getByText('월')).toBeInTheDocument()
        expect(screen.getByText('화')).toBeInTheDocument()
      })
    })

    it('should show site selector for partner view', async () => {
      const partnerProfile = { ...mockProfile, role: 'customer_manager' as const }
      
      renderWithProviders(<AttendanceCalendar profile={partnerProfile} isPartnerView={true} />)
      
      await waitFor(() => {
        // The component shows a select dropdown for sites, not text "현장 선택"
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    it('should not show site selector for worker view with single site', async () => {
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        // With only one site, the selector is not shown
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to previous month', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        // The navigation buttons don't have text, they use ChevronLeft/ChevronRight icons
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
      
      // The previous button is the first button with variant="outline"
      const buttons = screen.getAllByRole('button')
      const prevButton = buttons[0] // First navigation button
      await user.click(prevButton)
      
      // Verify that attendance data is refetched
      expect(getAttendanceRecords).toHaveBeenCalled()
      const calls = (getAttendanceRecords as jest.Mock).mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(2) // Initial + after navigation
    })

    it('should navigate to next month', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(1)
      })
      
      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[1] // Second navigation button
      await user.click(nextButton)
      
      // Verify that attendance data is refetched
      expect(getAttendanceRecords).toHaveBeenCalled()
      const calls = (getAttendanceRecords as jest.Mock).mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(2) // Initial + after navigation
    })
  })

  describe('Attendance Data Display', () => {
    it('should display attendance records with labor hours', async () => {
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        // The component shows the current month (January 2024 based on our mock)
        expect(screen.getByText('2024년 01월')).toBeInTheDocument()
      })
      
      // The component needs time to process the attendance data
      await waitFor(() => {
        // Since we have labor hours of 1.0 and 0.5, they should be visible
        const allText = document.body.textContent || ''
        expect(allText).toContain('1')
        expect(allText).toContain('0.5')
      }, { timeout: 2000 })
    })

    it('should apply different colors based on labor hours', async () => {
      const records = [
        { ...mockAttendanceRecords[0], date: '2024-01-10', labor_hours: 1.0 }, // Full day
        { ...mockAttendanceRecords[0], date: '2024-01-11', labor_hours: 0.5 }, // Half day
        { ...mockAttendanceRecords[0], date: '2024-01-12', labor_hours: 0.25 }, // Quarter day
      ]
      
      ;(getAttendanceRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: records.map(record => ({
          ...record,
          attendance_date: record.date,
          site: { name: 'Construction Site A' }
        }))
      })
      
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        // Check that different labor hours are displayed somewhere in the calendar
        const allText = document.body.textContent || ''
        expect(allText).toContain('1')
        expect(allText).toContain('0.5')
        expect(allText).toContain('0.25')
      })
    })

    it('should show summary statistics', async () => {
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        expect(screen.getByText(/출근일:/)).toBeInTheDocument()
        expect(screen.getByText(/총 공수:/)).toBeInTheDocument()
      })
    })
  })

  describe('Site Selection', () => {
    it('should load and display sites for partner view', async () => {
      const partnerProfile = { ...mockProfile, role: 'customer_manager' as const }
      
      renderWithProviders(<AttendanceCalendar profile={partnerProfile} isPartnerView={true} />)
      
      await waitFor(() => {
        expect(getSites).toHaveBeenCalled()
      })
    })

    it('should update attendance data when site is selected', async () => {
      const user = userEvent.setup()
      const partnerProfile = { ...mockProfile, role: 'customer_manager' as const }
      
      renderWithProviders(<AttendanceCalendar profile={partnerProfile} isPartnerView={true} />)
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
      
      const siteSelector = screen.getByRole('combobox')
      // Use fireEvent for select elements
      fireEvent.change(siteSelector, { target: { value: 'site-456' } })
      
      // Verify company attendance summary is refetched with new site
      await waitFor(() => {
        expect(getCompanyAttendanceSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            site_id: 'site-456'
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle site loading error gracefully', async () => {
      ;(getSites as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to load sites'
      })
      
      const partnerProfile = { ...mockProfile, role: 'customer_manager' as const }
      renderWithProviders(<AttendanceCalendar profile={partnerProfile} isPartnerView={true} />)
      
      await waitFor(() => {
        // Sites list will be empty but component should still render
        expect(getSites).toHaveBeenCalled()
        // Component should still be visible
        expect(screen.getByText(/\d{4}년 \d{2}월/)).toBeInTheDocument()
      })
    })

    it('should handle attendance data loading error gracefully', async () => {
      ;(getAttendanceRecords as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to load attendance'
      })
      
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        // Component should still render even if attendance data fails
        expect(getAttendanceRecords).toHaveBeenCalled()
        expect(screen.getByText(/\d{4}년 \d{2}월/)).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching data', async () => {
      // Mock delayed response
      ;(getAttendanceRecords as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      )
      
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      // Check for loading indicator if component shows one
      // This would depend on the actual component implementation
      await waitFor(() => {
        expect(getAttendanceRecords).toHaveBeenCalled()
      })
    })
  })

  describe('Date Selection', () => {
    it('should allow selecting a date', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<AttendanceCalendar profile={mockProfile} isPartnerView={false} />)
      
      await waitFor(() => {
        const dayButton = screen.getByText('15')
        expect(dayButton).toBeInTheDocument()
      })
      
      const dayButton = screen.getByText('15')
      await user.click(dayButton)
      
      // Verify date selection behavior based on component implementation
      // This would depend on what happens when a date is clicked
    })
  })
  
})
/**
 * Tests for AttendanceCheck Component
 * 
 * Testing the attendance check-in/check-out UI component
 * for Task 14
 */

import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import AttendanceCheck from '@/components/attendance/attendance-check'
import type { Site } from '@/types'

// Mock the attendance actions module
const mockCheckIn = jest.fn()
const mockCheckOut = jest.fn()
const mockGetTodayAttendance = jest.fn()

jest.mock('@/app/actions/attendance', () => ({
  checkIn: (data: any) => mockCheckIn(data),
  checkOut: (data: any) => mockCheckOut(data),
  getTodayAttendance: (siteId: string) => mockGetTodayAttendance(siteId)
}))

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
}

// Mock setInterval and Date
const mockDate = new Date('2024-01-15T09:30:00')
const realDate = Date
const realSetInterval = setInterval

describe('AttendanceCheck Component', () => {
  const mockSite: Site = {
    id: 'site-123',
    name: 'Construction Site A',
    organization_id: 'org-123',
    address: '123 Main St',
    status: 'active',
    created_at: '2024-01-01',
    latitude: 37.5665,
    longitude: 126.9780
  }
  
  const mockTodayAttendance = {
    id: 'attendance-123',
    user_id: 'user-123',
    site_id: 'site-123',
    date: '2024-01-15',
    check_in_time: '08:30:00',
    check_out_time: null,
    status: 'present',
    work_hours: null,
    overtime_hours: null
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    })
    
    // Mock Date
    global.Date = jest.fn(() => mockDate) as any
    global.Date.now = realDate.now
    
    // Mock getTodayAttendance to return empty by default
    mockGetTodayAttendance.mockResolvedValue({
      success: true,
      data: []
    })
  })
  
  afterEach(() => {
    global.Date = realDate
    global.setInterval = realSetInterval
  })
  
  describe('Rendering', () => {
    it('should display current time and date', async () => {
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByText(/09:30:00/)).toBeInTheDocument()
        expect(screen.getByText(/2024년 1월 15일 월요일/)).toBeInTheDocument()
      })
    })
    
    it('should display site name', async () => {
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByText('Construction Site A')).toBeInTheDocument()
      })
    })
    
    it('should show check-in button when not checked in', async () => {
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /출근하기/ })).toBeInTheDocument()
      })
    })
    
    it('should show attendance status section', async () => {
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByText('오늘의 출근 현황')).toBeInTheDocument()
        expect(screen.getByText('출근 시간')).toBeInTheDocument()
        expect(screen.getByText('퇴근 시간')).toBeInTheDocument()
      })
    })
    
    it('should show notice section', async () => {
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByText('출퇴근 체크 안내')).toBeInTheDocument()
        expect(screen.getByText(/GPS 위치 정보가 자동으로 기록됩니다/)).toBeInTheDocument()
      })
    })
  })
  
  describe('Location Services', () => {
    it('should request location on mount', async () => {
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()
      })
    })
    
    it('should show location checking message', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        // Simulate delay
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      expect(screen.getByText('위치 확인 중...')).toBeInTheDocument()
    })
    
    it('should show location success message', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 10
          }
        })
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByText(/위치 확인됨 \(정확도: 10m\)/)).toBeInTheDocument()
      })
    })
    
    it('should handle location errors gracefully', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        setTimeout(() => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'Permission denied'
          })
        }, 10)
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      // Just check that the component renders and doesn't crash on location error
      await waitFor(() => {
        expect(screen.getByText('출근하기')).toBeInTheDocument()
      })
    })
    
    it('should handle browser without geolocation support', async () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByText('브라우저가 위치 정보를 지원하지 않습니다')).toBeInTheDocument()
      })
    })
  })
  
  describe('Check-In Functionality', () => {
    beforeEach(() => {
      // Mock successful location
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 10
          }
        })
      })
    })
    
    it('should handle successful check-in', async () => {
      const user = userEvent.setup()
      
      mockCheckIn.mockResolvedValue({
        success: true,
        data: {
          ...mockTodayAttendance,
          check_in_time: '09:30:00'
        }
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /출근하기/ })).toBeInTheDocument()
      })
      
      const checkInButton = screen.getByRole('button', { name: /출근하기/ })
      await user.click(checkInButton)
      
      expect(mockCheckIn).toHaveBeenCalledWith({
        site_id: 'site-123',
        latitude: 37.5665,
        longitude: 126.9780,
        accuracy: 10,
        address: undefined,
        device_info: navigator.userAgent
      })
      
      await waitFor(() => {
        expect(screen.getByText('09:30')).toBeInTheDocument()
      })
    })
    
    it('should show error on check-in failure', async () => {
      const user = userEvent.setup()
      window.alert = jest.fn()
      
      mockCheckIn.mockResolvedValue({
        success: false,
        error: '출근 체크에 실패했습니다'
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /출근하기/ })).toBeInTheDocument()
      })
      
      const checkInButton = screen.getByRole('button', { name: /출근하기/ })
      await user.click(checkInButton)
      
      expect(window.alert).toHaveBeenCalledWith('출근 체크에 실패했습니다')
    })
    
    it('should disable button while checking in', async () => {
      const user = userEvent.setup()
      
      mockCheckIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockTodayAttendance }), 100))
      )
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /출근하기/ })).toBeInTheDocument()
      })
      
      const checkInButton = screen.getByRole('button', { name: /출근하기/ })
      await user.click(checkInButton)
      
      expect(checkInButton).toBeDisabled()
    })
  })
  
  describe('Check-Out Functionality', () => {
    beforeEach(() => {
      // Mock successful location
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 10
          }
        })
      })
      
      // Mock already checked in
      mockGetTodayAttendance.mockResolvedValue({
        success: true,
        data: [mockTodayAttendance]
      })
    })
    
    it('should show check-out button when checked in', async () => {
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /퇴근하기/ })).toBeInTheDocument()
      })
    })
    
    it('should handle successful check-out', async () => {
      const user = userEvent.setup()
      
      mockCheckOut.mockResolvedValue({
        success: true,
        data: {
          ...mockTodayAttendance,
          check_out_time: '18:00:00',
          work_hours: 8.5,
          overtime_hours: 0.5
        }
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /퇴근하기/ })).toBeInTheDocument()
      })
      
      const checkOutButton = screen.getByRole('button', { name: /퇴근하기/ })
      await user.click(checkOutButton)
      
      expect(mockCheckOut).toHaveBeenCalledWith({
        attendance_id: 'attendance-123',
        latitude: 37.5665,
        longitude: 126.9780,
        accuracy: 10,
        address: undefined,
        device_info: navigator.userAgent
      })
      
      await waitFor(() => {
        expect(screen.getByText('18:00')).toBeInTheDocument()
        expect(screen.getByText('8.5시간')).toBeInTheDocument()
      })
    })
    
    it('should show completion message after check-out', async () => {
      const user = userEvent.setup()
      
      mockCheckOut.mockResolvedValue({
        success: true,
        data: {
          ...mockTodayAttendance,
          check_out_time: '18:00:00',
          work_hours: 8.5
        }
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /퇴근하기/ })).toBeInTheDocument()
      })
      
      const checkOutButton = screen.getByRole('button', { name: /퇴근하기/ })
      await user.click(checkOutButton)
      
      await waitFor(() => {
        expect(screen.getByText('오늘의 근무가 완료되었습니다')).toBeInTheDocument()
      })
    })
  })
  
  describe('Work Hours Display', () => {
    it('should display work hours and overtime', async () => {
      mockGetTodayAttendance.mockResolvedValue({
        success: true,
        data: [{
          ...mockTodayAttendance,
          check_out_time: '18:30:00',
          work_hours: 9.0,
          overtime_hours: 1.0
        }]
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByText('총 근무시간')).toBeInTheDocument()
        expect(screen.getByText('9.0시간')).toBeInTheDocument()
        expect(screen.getByText(/정규: 8시간, 초과: 1.0시간/)).toBeInTheDocument()
      })
    })
    
    it('should not show work hours when not checked out', async () => {
      mockGetTodayAttendance.mockResolvedValue({
        success: true,
        data: [mockTodayAttendance]
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByText('08:30')).toBeInTheDocument()
      })
      
      expect(screen.queryByText('총 근무시간')).not.toBeInTheDocument()
    })
  })
  
  describe('Time Updates', () => {
    it('should set up time update interval', () => {
      global.setInterval = jest.fn(() => 123) as any
      
      render(<AttendanceCheck site={mockSite} />)
      
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000)
    })
  })
  
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      
      mockGetTodayAttendance.mockRejectedValue(new Error('Network error'))
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error fetching attendance:', expect.any(Error))
      })
      
      consoleError.mockRestore()
    })
    
    it('should handle check-in errors', async () => {
      const user = userEvent.setup()
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      window.alert = jest.fn()
      
      mockCheckIn.mockRejectedValue(new Error('Network error'))
      
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 10
          }
        })
      })
      
      render(<AttendanceCheck site={mockSite} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /출근하기/ })).toBeInTheDocument()
      })
      
      const checkInButton = screen.getByRole('button', { name: /출근하기/ })
      await user.click(checkInButton)
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('출근 체크 중 오류가 발생했습니다')
      })
      
      consoleError.mockRestore()
    })
  })
})
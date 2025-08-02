import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SunlightToggle } from '@/components/ui/sunlight-toggle'
import { useSunlightMode } from '@/contexts/SunlightModeContext'

// Mock the SunlightModeContext
jest.mock('@/contexts/SunlightModeContext', () => ({
  useSunlightMode: jest.fn(),
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Sun: ({ className, ...props }: any) => (
    <svg data-testid="sun-icon" className={className} {...props} />
  ),
  SunMedium: ({ className, ...props }: any) => (
    <svg data-testid="sun-medium-icon" className={className} {...props} />
  ),
}))

describe('SunlightToggle', () => {
  const mockToggleSunlightMode = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render toggle button with default state (off)', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-label', '햇빛 모드 켜기')
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(button).toHaveAttribute('title', '햇빛 모드 꺼짐 (수동)')
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    })

    it('should render toggle button in sunlight mode (on)', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: true,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', '햇빛 모드 끄기')
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(button).toHaveAttribute('title', '햇빛 모드 켜짐 (수동)')
      expect(screen.getByTestId('sun-medium-icon')).toBeInTheDocument()
    })

    it('should render with auto detection indicator when auto detection is enabled', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: true,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', '햇빛 모드 꺼짐 (자동)')
      
      // Check for auto detection indicator
      const indicator = button.querySelector('.absolute.-top-1.-right-1')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveAttribute('title', '자동 감지 활성화')
    })

    it('should render with correct title when auto detection is enabled and sunlight mode is on', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: true,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: true,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', '햇빛 모드 켜짐 (자동)')
    })
  })

  describe('Functionality', () => {
    it('should call toggleSunlightMode when clicked', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(mockToggleSunlightMode).toHaveBeenCalledTimes(1)
    })

    it('should toggle from off to on state', () => {
      const { rerender } = render(<SunlightToggle />)

      // Initially off
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })
      rerender(<SunlightToggle />)

      let button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()

      // Simulate toggle to on
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: true,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })
      rerender(<SunlightToggle />)

      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('sun-medium-icon')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply correct classes when sunlight mode is off', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-100', 'text-gray-600')
    })

    it('should apply correct classes when sunlight mode is on', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: true,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })

    it('should have minimum touch target size for accessibility', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]')
    })

    it('should have focus visible styles for keyboard navigation', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-blue-500')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('aria-pressed')
      expect(button).toHaveAttribute('title')
    })

    it('should have aria-hidden on icons', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const icon = screen.getByTestId('sun-icon')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should have aria-hidden on auto detection indicator', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: true,
      })

      render(<SunlightToggle />)

      const indicator = screen.getByRole('button').querySelector('.absolute.-top-1.-right-1')
      expect(indicator).toHaveAttribute('aria-hidden', 'true')
    })

    it('should be keyboard accessible', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      
      // Test keyboard activation
      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyUp(button, { key: 'Enter' })
      
      // Button should be focusable
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('should update aria-label and aria-pressed when state changes', () => {
      const { rerender } = render(<SunlightToggle />)

      // Initially off
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })
      rerender(<SunlightToggle />)

      let button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', '햇빛 모드 켜기')
      expect(button).toHaveAttribute('aria-pressed', 'false')

      // Toggle to on
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: true,
        toggleSunlightMode: mockToggleSunlightMode,
        isAutoDetection: false,
      })
      rerender(<SunlightToggle />)

      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', '햇빛 모드 끄기')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Context Integration', () => {
    it('should handle missing context gracefully', () => {
      ;(useSunlightMode as jest.Mock).mockReturnValue({
        isSunlightMode: false,
        toggleSunlightMode: undefined,
        isAutoDetection: false,
      })

      render(<SunlightToggle />)

      const button = screen.getByRole('button')
      
      // Should render without errors even with undefined toggle function
      expect(button).toBeInTheDocument()
      
      // Click should not throw error
      expect(() => fireEvent.click(button)).not.toThrow()
    })

    it('should work with all possible context states', () => {
      const testCases = [
        { isSunlightMode: true, isAutoDetection: true },
        { isSunlightMode: true, isAutoDetection: false },
        { isSunlightMode: false, isAutoDetection: true },
        { isSunlightMode: false, isAutoDetection: false },
      ]

      testCases.forEach(({ isSunlightMode, isAutoDetection }) => {
        ;(useSunlightMode as jest.Mock).mockReturnValue({
          isSunlightMode,
          toggleSunlightMode: mockToggleSunlightMode,
          isAutoDetection,
        })

        const { unmount } = render(<SunlightToggle />)
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveAttribute('aria-pressed', isSunlightMode.toString())
        
        if (isAutoDetection) {
          expect(button.querySelector('.absolute.-top-1.-right-1')).toBeInTheDocument()
        } else {
          expect(button.querySelector('.absolute.-top-1.-right-1')).not.toBeInTheDocument()
        }

        unmount()
      })
    })
  })
})
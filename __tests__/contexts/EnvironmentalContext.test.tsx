import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { EnvironmentalProvider, useEnvironmental } from '@/contexts/EnvironmentalContext'
import { mockLocalStorage } from '../utils/test-utils'

// Mock Date for consistent testing
const mockDate = new Date('2024-08-01T10:00:00') // 10 AM - working hours
const originalDate = Date

describe('EnvironmentalContext', () => {
  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    
    // Mock Date
    global.Date = jest.fn(() => mockDate) as any
    global.Date.now = originalDate.now
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop width
    })
    
    // Clear document classes
    document.documentElement.classList.remove('glove-mode', 'precision-mode')
  })

  afterEach(() => {
    global.Date = originalDate
  })

  describe('EnvironmentalProvider and useEnvironmental', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      
      expect(() => {
        renderHook(() => useEnvironmental())
      }).toThrow('useEnvironmental must be used within an EnvironmentalProvider')
      
      consoleError.mockRestore()
    })

    it('should provide default values', () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      expect(result.current.interactionMode).toBe('auto')
      expect(result.current.environmentalCondition).toBe('normal')
      expect(result.current.isAutoDetection).toBe(true)
      expect(result.current.isGloveMode).toBe(false)
      expect(result.current.isPrecisionMode).toBe(false)
      expect(result.current.touchTargetSize).toBe(44) // WCAG minimum
      expect(result.current.fontSizeMultiplier).toBe(1)
    })

    it('should load saved preferences from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'inopnc-interaction-mode') return 'glove'
        if (key === 'inopnc-environmental-condition') return 'rain'
        if (key === 'inopnc-environmental-auto') return 'false'
        return null
      })

      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      expect(result.current.interactionMode).toBe('glove')
      expect(result.current.environmentalCondition).toBe('rain')
      expect(result.current.isAutoDetection).toBe(false)
    })

    it('should save preferences to localStorage', async () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      act(() => {
        result.current.setInteractionMode('glove')
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('inopnc-interaction-mode', 'glove')
      })

      act(() => {
        result.current.setEnvironmentalCondition('rain')
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('inopnc-environmental-condition', 'rain')
      })
    })

    it('should compute isGloveMode correctly', () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      expect(result.current.isGloveMode).toBe(false)

      act(() => {
        result.current.setInteractionMode('glove')
      })

      expect(result.current.isGloveMode).toBe(true)

      act(() => {
        result.current.setInteractionMode('auto')
      })

      expect(result.current.isGloveMode).toBe(false)
    })

    it('should compute isPrecisionMode correctly', () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      expect(result.current.isPrecisionMode).toBe(false)

      act(() => {
        result.current.setInteractionMode('precision')
      })

      expect(result.current.isPrecisionMode).toBe(true)
    })

    it('should compute touchTargetSize based on conditions', () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      // Default (normal conditions)
      expect(result.current.touchTargetSize).toBe(44)

      // Glove mode
      act(() => {
        result.current.setInteractionMode('glove')
      })
      expect(result.current.touchTargetSize).toBe(56)

      // Rain condition
      act(() => {
        result.current.setEnvironmentalCondition('rain')
      })
      expect(result.current.touchTargetSize).toBeGreaterThan(56)

      // Cold condition
      act(() => {
        result.current.setEnvironmentalCondition('cold')
      })
      expect(result.current.touchTargetSize).toBeGreaterThan(56)

      // Precision mode
      act(() => {
        result.current.setInteractionMode('precision')
      })
      expect(result.current.touchTargetSize).toBe(44)
    })

    it('should compute fontSizeMultiplier based on conditions', () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      // Default
      expect(result.current.fontSizeMultiplier).toBe(1)

      // Glove mode
      act(() => {
        result.current.setInteractionMode('glove')
      })
      expect(result.current.fontSizeMultiplier).toBe(1.1)

      // Bright sun condition
      act(() => {
        result.current.setEnvironmentalCondition('bright-sun')
      })
      expect(result.current.fontSizeMultiplier).toBeGreaterThan(1.1)

      // Dust condition
      act(() => {
        result.current.setEnvironmentalCondition('dust')
      })
      expect(result.current.fontSizeMultiplier).toBeGreaterThan(1.1)
    })

    it('should add/remove mode classes to document', () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      act(() => {
        result.current.setInteractionMode('glove')
      })

      expect(document.documentElement.classList.contains('glove-mode')).toBe(true)
      expect(document.documentElement.classList.contains('precision-mode')).toBe(false)

      act(() => {
        result.current.setInteractionMode('precision')
      })

      expect(document.documentElement.classList.contains('glove-mode')).toBe(false)
      expect(document.documentElement.classList.contains('precision-mode')).toBe(true)

      act(() => {
        result.current.setInteractionMode('auto')
      })

      expect(document.documentElement.classList.contains('glove-mode')).toBe(false)
      expect(document.documentElement.classList.contains('precision-mode')).toBe(false)
    })

    it('should disable auto-detection when manually setting mode', () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      expect(result.current.isAutoDetection).toBe(true)

      act(() => {
        result.current.setInteractionMode('glove')
      })

      expect(result.current.isAutoDetection).toBe(false)
    })

    it('should auto-detect glove mode on mobile during working hours', async () => {
      // Set mobile width
      Object.defineProperty(window, 'innerWidth', { value: 400 })
      
      // Set working hours (10 AM)
      const workingHoursDate = new Date('2024-08-01T10:00:00')
      global.Date = jest.fn(() => workingHoursDate) as any

      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      // Wait for effect to run
      await waitFor(() => {
        expect(result.current.isGloveMode).toBe(true)
      })
    })

    it('should auto-detect precision mode on desktop', async () => {
      // Set desktop width
      Object.defineProperty(window, 'innerWidth', { value: 1440 })
      
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      // Wait for effect to run
      await waitFor(() => {
        expect(result.current.isPrecisionMode).toBe(true)
      })
    })

    it('should not auto-detect when auto-detection is disabled', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'inopnc-environmental-auto') return 'false'
        return null
      })

      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      await waitFor(() => {
        expect(result.current.isAutoDetection).toBe(false)
        expect(result.current.interactionMode).toBe('auto')
      })
    })

    it('should clean up on unmount', () => {
      const { unmount } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      act(() => {
        unmount()
      })

      expect(document.documentElement.classList.contains('glove-mode')).toBe(false)
      expect(document.documentElement.classList.contains('precision-mode')).toBe(false)
    })
  })

  describe('Integration tests', () => {
    it('should handle multiple consumers correctly', () => {
      const Consumer1 = () => {
        const { touchTargetSize } = useEnvironmental()
        return <div data-testid="target-size">{touchTargetSize}</div>
      }

      const Consumer2 = () => {
        const { setInteractionMode } = useEnvironmental()
        return (
          <button data-testid="set-glove" onClick={() => setInteractionMode('glove')}>
            Set Glove Mode
          </button>
        )
      }

      const App = () => (
        <EnvironmentalProvider>
          <Consumer1 />
          <Consumer2 />
        </EnvironmentalProvider>
      )

      const { getByTestId } = render(<App />)

      expect(getByTestId('target-size')).toHaveTextContent('44')

      fireEvent.click(getByTestId('set-glove'))

      expect(getByTestId('target-size')).toHaveTextContent('56')
    })

    it('should properly cascade environmental conditions', () => {
      const { result } = renderHook(() => useEnvironmental(), {
        wrapper: EnvironmentalProvider,
      })

      // Test cascading effects of glove + rain
      act(() => {
        result.current.setInteractionMode('glove')
        result.current.setEnvironmentalCondition('rain')
      })

      expect(result.current.touchTargetSize).toBeGreaterThan(56)
      expect(result.current.fontSizeMultiplier).toBeGreaterThan(1.1)
    })
  })
})

// Additional imports needed at the top
import { render, fireEvent } from '../utils/test-utils'
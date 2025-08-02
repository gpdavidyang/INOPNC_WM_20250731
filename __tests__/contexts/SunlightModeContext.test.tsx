import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { SunlightModeProvider, useSunlightMode, getSunlightClass, applySunlightStyles } from '@/contexts/SunlightModeContext'
import { mockLocalStorage } from '../utils/test-utils'

// Mock Date for consistent testing
const mockDate = new Date('2024-08-01T14:00:00') // 2 PM - peak sunlight hours
const originalDate = Date

describe('SunlightModeContext', () => {
  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    
    // Mock Date
    global.Date = jest.fn(() => mockDate) as any
    global.Date.now = originalDate.now
    
    // Clear document classes
    document.documentElement.classList.remove('sunlight-mode')
  })

  afterEach(() => {
    global.Date = originalDate
  })

  describe('SunlightModeProvider and useSunlightMode', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      
      expect(() => {
        renderHook(() => useSunlightMode())
      }).toThrow('useSunlightMode must be used within a SunlightModeProvider')
      
      consoleError.mockRestore()
    })

    it('should provide default values', () => {
      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      expect(result.current.isSunlightMode).toBe(false)
      expect(result.current.isAutoDetection).toBe(true)
      expect(typeof result.current.setSunlightMode).toBe('function')
      expect(typeof result.current.toggleSunlightMode).toBe('function')
      expect(typeof result.current.setAutoDetection).toBe('function')
    })

    it('should load saved preferences from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'inopnc-sunlight-mode') return 'true'
        if (key === 'inopnc-sunlight-auto') return 'false'
        return null
      })

      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      expect(result.current.isSunlightMode).toBe(true)
      expect(result.current.isAutoDetection).toBe(false)
    })

    it('should save preferences to localStorage', async () => {
      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      act(() => {
        result.current.setSunlightMode(true)
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('inopnc-sunlight-mode', 'true')
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('inopnc-sunlight-auto', 'false')
      })
    })

    it('should toggle sunlight mode', () => {
      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      expect(result.current.isSunlightMode).toBe(false)

      act(() => {
        result.current.toggleSunlightMode()
      })

      expect(result.current.isSunlightMode).toBe(true)

      act(() => {
        result.current.toggleSunlightMode()
      })

      expect(result.current.isSunlightMode).toBe(false)
    })

    it('should disable auto-detection when manually setting sunlight mode', () => {
      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      expect(result.current.isAutoDetection).toBe(true)

      act(() => {
        result.current.setSunlightMode(true)
      })

      expect(result.current.isAutoDetection).toBe(false)
    })

    it('should add/remove sunlight-mode class to document', () => {
      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      act(() => {
        result.current.setSunlightMode(true)
      })

      expect(document.documentElement.classList.contains('sunlight-mode')).toBe(true)

      act(() => {
        result.current.setSunlightMode(false)
      })

      expect(document.documentElement.classList.contains('sunlight-mode')).toBe(false)
    })

    it('should auto-detect sunlight mode during peak hours', async () => {
      // Mock peak sunlight hour (2 PM)
      const peakDate = new Date('2024-08-01T14:00:00')
      global.Date = jest.fn(() => peakDate) as any

      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      // Wait for effect to run
      await waitFor(() => {
        expect(result.current.isSunlightMode).toBe(true)
      })
    })

    it('should not auto-detect sunlight mode outside peak hours', async () => {
      // Mock non-peak hour (8 PM)
      const nightDate = new Date('2024-08-01T20:00:00')
      global.Date = jest.fn(() => nightDate) as any

      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      // Wait for effect to run
      await waitFor(() => {
        expect(result.current.isSunlightMode).toBe(false)
      })
    })

    it('should not auto-detect when auto-detection is disabled', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'inopnc-sunlight-auto') return 'false'
        return null
      })

      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      await waitFor(() => {
        expect(result.current.isAutoDetection).toBe(false)
        expect(result.current.isSunlightMode).toBe(false)
      })
    })

    it('should allow setting auto-detection', () => {
      const { result } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      act(() => {
        result.current.setAutoDetection(false)
      })

      expect(result.current.isAutoDetection).toBe(false)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('inopnc-sunlight-auto', 'false')

      act(() => {
        result.current.setAutoDetection(true)
      })

      expect(result.current.isAutoDetection).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('inopnc-sunlight-auto', 'true')
    })
  })

  describe('Utility functions', () => {
    it('should generate sunlight-optimized classes', () => {
      const result = getSunlightClass('text-gray-900', 'text-gray-950')
      expect(result).toBe('text-gray-900 sunlight-mode:text-gray-950')
    })

    it('should conditionally apply sunlight styles', () => {
      const normalStyles = 'bg-white text-black'
      const sunlightStyles = 'brightness-125 contrast-110'

      expect(applySunlightStyles(false, normalStyles, sunlightStyles)).toBe(normalStyles)
      expect(applySunlightStyles(true, normalStyles, sunlightStyles)).toBe('bg-white text-black brightness-125 contrast-110')
    })
  })

  describe('Integration tests', () => {
    it('should handle multiple context consumers', () => {
      const Consumer1 = () => {
        const { isSunlightMode } = useSunlightMode()
        return <div data-testid="consumer1">{isSunlightMode ? 'sunlight' : 'normal'}</div>
      }

      const Consumer2 = () => {
        const { toggleSunlightMode } = useSunlightMode()
        return <button data-testid="toggle" onClick={toggleSunlightMode}>Toggle</button>
      }

      const App = () => (
        <SunlightModeProvider>
          <Consumer1 />
          <Consumer2 />
        </SunlightModeProvider>
      )

      const { getByTestId } = render(<App />)

      expect(getByTestId('consumer1')).toHaveTextContent('normal')

      fireEvent.click(getByTestId('toggle'))

      expect(getByTestId('consumer1')).toHaveTextContent('sunlight')
    })

    it('should clean up on unmount', () => {
      const { unmount } = renderHook(() => useSunlightMode(), {
        wrapper: SunlightModeProvider,
      })

      act(() => {
        unmount()
      })

      expect(document.documentElement.classList.contains('sunlight-mode')).toBe(false)
    })
  })
})

// Additional imports needed at the top
import { render, fireEvent } from '../utils/test-utils'
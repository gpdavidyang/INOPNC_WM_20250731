import { haptic, useHapticFeedback } from '@/lib/haptic-feedback'

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()

describe('HapticFeedback - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleLog.mockClear()
    mockConsoleWarn.mockClear()
  })

  describe('haptic.isSupported()', () => {
    it('should return a boolean value', () => {
      const isSupported = haptic.isSupported()
      expect(typeof isSupported).toBe('boolean')
    })
  })

  describe('haptic.feedback()', () => {
    it('should handle all feedback patterns without throwing', async () => {
      const patterns = ['light', 'medium', 'heavy', 'success', 'warning', 'error', 'selection'] as const
      
      for (const pattern of patterns) {
        await expect(haptic.feedback(pattern)).resolves.toBeUndefined()
      }
    })

    it('should handle pattern options without throwing', async () => {
      await expect(haptic.feedback('light', { pattern: 'double' })).resolves.toBeUndefined()
      await expect(haptic.feedback('medium', { pattern: 'triple' })).resolves.toBeUndefined()
      await expect(haptic.feedback('heavy', { pattern: 'long' })).resolves.toBeUndefined()
    })

    it('should handle custom options without throwing', async () => {
      await expect(haptic.feedback('light', { 
        duration: 150, 
        intensity: 0.5,
        pattern: 'single' 
      })).resolves.toBeUndefined()
    })
  })

  describe('haptic.construction()', () => {
    it('should handle all construction actions without throwing', async () => {
      const actions = ['button-press', 'form-submit', 'error', 'success', 'navigation', 'alert'] as const
      
      for (const action of actions) {
        await expect(haptic.construction(action)).resolves.toBeUndefined()
      }
    })
  })

  describe('haptic.test()', () => {
    it('should log test information', async () => {
      await haptic.test()
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Testing haptic feedback...')
      expect(mockConsoleLog).toHaveBeenCalledWith('Supported:', expect.any(Boolean))
    })
  })

  describe('useHapticFeedback hook', () => {
    it('should return haptic object and convenience methods', () => {
      const {
        haptic: hookHaptic,
        isSupported,
        onButtonPress,
        onFormSubmit,
        onError,
        onSuccess,
        onNavigate,
        onAlert
      } = useHapticFeedback()

      expect(hookHaptic).toBeDefined()
      expect(typeof isSupported).toBe('boolean')
      expect(typeof onButtonPress).toBe('function')
      expect(typeof onFormSubmit).toBe('function')
      expect(typeof onError).toBe('function')
      expect(typeof onSuccess).toBe('function')
      expect(typeof onNavigate).toBe('function')
      expect(typeof onAlert).toBe('function')
    })

    it('should provide working convenience methods that do not throw', async () => {
      const { onButtonPress, onFormSubmit, onError, onSuccess, onNavigate, onAlert } = useHapticFeedback()

      await expect(onButtonPress()).resolves.toBeUndefined()
      await expect(onFormSubmit()).resolves.toBeUndefined()
      await expect(onError()).resolves.toBeUndefined()
      await expect(onSuccess()).resolves.toBeUndefined()
      await expect(onNavigate()).resolves.toBeUndefined()
      await expect(onAlert()).resolves.toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should handle calls gracefully even if vibration fails', async () => {
      // Test that the API calls don't throw errors
      await expect(haptic.feedback('light')).resolves.toBeUndefined()
      await expect(haptic.construction('button-press')).resolves.toBeUndefined()
    })
  })

  describe('Advanced features detection', () => {
    it('should handle missing advanced APIs gracefully', async () => {
      // Ensure advanced haptic features don't cause errors when not available
      await expect(haptic.feedback('success')).resolves.toBeUndefined()
      await expect(haptic.feedback('error')).resolves.toBeUndefined()
    })
  })

  describe('Pattern validation', () => {
    it('should handle pattern combinations correctly', async () => {
      // Test that different pattern types work
      const combinations = [
        { pattern: 'light', options: { pattern: 'single' } },
        { pattern: 'medium', options: { pattern: 'double' } },
        { pattern: 'heavy', options: { pattern: 'triple' } },
        { pattern: 'success', options: { pattern: 'long' } },
      ] as const

      for (const { pattern, options } of combinations) {
        await expect(haptic.feedback(pattern, options)).resolves.toBeUndefined()
      }
    })
  })
})
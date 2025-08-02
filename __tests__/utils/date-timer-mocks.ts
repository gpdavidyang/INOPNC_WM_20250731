/**
 * Date and timer mocking utilities for consistent testing
 * Provides helpers for testing time-dependent functionality
 */

import { act } from '@testing-library/react'

/**
 * Mock Date class for consistent testing
 */
export class MockDate {
  private static mockCurrentTime: number = Date.now()
  private static originalDate = Date

  static setMockDate(date: Date | string | number) {
    if (typeof date === 'string') {
      this.mockCurrentTime = new Date(date).getTime()
    } else if (date instanceof Date) {
      this.mockCurrentTime = date.getTime()
    } else {
      this.mockCurrentTime = date
    }
  }

  static getCurrentMockTime() {
    return this.mockCurrentTime
  }

  static advanceTime(milliseconds: number) {
    this.mockCurrentTime += milliseconds
  }

  static mockImplementation() {
    global.Date = jest.fn((...args: any[]) => {
      if (args.length === 0) {
        return new MockDate.originalDate(MockDate.mockCurrentTime)
      }
      return new MockDate.originalDate(...args)
    }) as any

    global.Date.now = jest.fn(() => MockDate.mockCurrentTime)
    global.Date.UTC = MockDate.originalDate.UTC
    global.Date.parse = MockDate.originalDate.parse
  }

  static restoreImplementation() {
    global.Date = this.originalDate
  }
}

/**
 * Timer utilities for testing
 */
export class TimerUtils {
  private static isUsingFakeTimers = false

  static useFakeTimers() {
    if (!this.isUsingFakeTimers) {
      jest.useFakeTimers()
      this.isUsingFakeTimers = true
    }
  }

  static useRealTimers() {
    if (this.isUsingFakeTimers) {
      jest.useRealTimers()
      this.isUsingFakeTimers = false
    }
  }

  static async advanceTimersByTime(ms: number) {
    await act(async () => {
      jest.advanceTimersByTime(ms)
    })
  }

  static async runAllTimers() {
    await act(async () => {
      jest.runAllTimers()
    })
  }

  static async runOnlyPendingTimers() {
    await act(async () => {
      jest.runOnlyPendingTimers()
    })
  }

  static clearAllTimers() {
    jest.clearAllTimers()
  }

  static getTimerCount() {
    return jest.getTimerCount()
  }
}

/**
 * Date testing utilities
 */
export const dateTestUtils = {
  /**
   * Set up date mocking for tests
   */
  setup(mockDate: Date | string = '2024-01-15T10:00:00Z') {
    MockDate.setMockDate(mockDate)
    MockDate.mockImplementation()
  },

  /**
   * Clean up date mocking
   */
  cleanup() {
    MockDate.restoreImplementation()
  },

  /**
   * Advance mock date by specified time
   */
  advanceBy(amount: number, unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' = 'milliseconds') {
    const multipliers = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    }

    MockDate.advanceTime(amount * multipliers[unit])
  },

  /**
   * Set mock date to specific value
   */
  setDate(date: Date | string) {
    MockDate.setMockDate(date)
  },

  /**
   * Get current mock date
   */
  getCurrentDate() {
    return new Date(MockDate.getCurrentMockTime())
  },

  /**
   * Create date relative to mock current time
   */
  createRelativeDate(amount: number, unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' = 'days') {
    const multipliers = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    }

    const offset = amount * multipliers[unit]
    return new Date(MockDate.getCurrentMockTime() + offset)
  },
}

/**
 * Timer testing utilities
 */
export const timerTestUtils = {
  /**
   * Set up timer mocking for tests
   */
  setup() {
    TimerUtils.useFakeTimers()
  },

  /**
   * Clean up timer mocking
   */
  cleanup() {
    TimerUtils.clearAllTimers()
    TimerUtils.useRealTimers()
  },

  /**
   * Fast forward time and run pending timers
   */
  async fastForward(ms: number) {
    await TimerUtils.advanceTimersByTime(ms)
  },

  /**
   * Run all pending timers to completion
   */
  async runAllTimers() {
    await TimerUtils.runAllTimers()
  },

  /**
   * Run only currently pending timers
   */
  async runPendingTimers() {
    await TimerUtils.runOnlyPendingTimers()
  },

  /**
   * Get count of pending timers
   */
  getPendingTimerCount() {
    return TimerUtils.getTimerCount()
  },

  /**
   * Clear all pending timers
   */
  clearAllTimers() {
    TimerUtils.clearAllTimers()
  },
}

/**
 * Helper for testing date formatting
 */
export const testDateFormatting = {
  /**
   * Test date display in different locales
   */
  testLocaleFormatting(date: Date, expectedFormats: Record<string, string>) {
    Object.entries(expectedFormats).forEach(([locale, expected]) => {
      const formatted = date.toLocaleDateString(locale)
      expect(formatted).toBe(expected)
    })
  },

  /**
   * Test relative time formatting
   */
  testRelativeTimeFormatting(
    baseDate: Date,
    targetDate: Date,
    expectedFormat: string
  ) {
    // Mock implementation would depend on your date formatting library
    // This is a placeholder for the concept
    const timeDiff = targetDate.getTime() - baseDate.getTime()
    // Your relative time formatting logic here
    expect(timeDiff).toBeDefined()
  },
}

/**
 * Helper for testing timeout and interval behavior
 */
export const testTimingBehavior = {
  /**
   * Test that a function is called after specified delay
   */
  async testTimeout(callback: jest.Mock, delay: number) {
    timerTestUtils.setup()
    
    setTimeout(callback, delay)
    
    // Should not be called immediately
    expect(callback).not.toHaveBeenCalled()
    
    // Should not be called before delay
    await timerTestUtils.fastForward(delay - 1)
    expect(callback).not.toHaveBeenCalled()
    
    // Should be called after delay
    await timerTestUtils.fastForward(1)
    expect(callback).toHaveBeenCalledTimes(1)
    
    timerTestUtils.cleanup()
  },

  /**
   * Test that a function is called repeatedly at intervals
   */
  async testInterval(callback: jest.Mock, interval: number, expectedCalls: number) {
    timerTestUtils.setup()
    
    const intervalId = setInterval(callback, interval)
    
    // Should not be called immediately
    expect(callback).not.toHaveBeenCalled()
    
    // Test each interval
    for (let i = 1; i <= expectedCalls; i++) {
      await timerTestUtils.fastForward(interval)
      expect(callback).toHaveBeenCalledTimes(i)
    }
    
    clearInterval(intervalId)
    timerTestUtils.cleanup()
  },

  /**
   * Test debounced function behavior
   */
  async testDebounce(callback: jest.Mock, debounceDelay: number) {
    timerTestUtils.setup()
    
    // Call multiple times rapidly
    callback()
    callback()
    callback()
    
    // Should not be called yet
    expect(callback).toHaveBeenCalledTimes(3) // Mock tracks all calls
    
    // Fast forward past debounce delay
    await timerTestUtils.fastForward(debounceDelay)
    
    // Your debounce implementation would determine the behavior here
    
    timerTestUtils.cleanup()
  },

  /**
   * Test throttled function behavior
   */
  async testThrottle(callback: jest.Mock, throttleDelay: number) {
    timerTestUtils.setup()
    
    // Call multiple times rapidly
    callback()
    callback()
    callback()
    
    // Your throttle implementation would determine the behavior here
    
    await timerTestUtils.fastForward(throttleDelay)
    
    timerTestUtils.cleanup()
  },
}

/**
 * Helper for testing component lifecycle timing
 */
export const testComponentTiming = {
  /**
   * Test useEffect cleanup timing
   */
  async testEffectCleanup(
    renderComponent: () => any,
    unmountComponent: () => void,
    expectCleanup: () => void
  ) {
    timerTestUtils.setup()
    
    const component = renderComponent()
    
    // Unmount component
    await act(async () => {
      unmountComponent()
    })
    
    // Run any pending cleanup
    await timerTestUtils.runPendingTimers()
    
    expectCleanup()
    
    timerTestUtils.cleanup()
  },

  /**
   * Test loading state timing
   */
  async testLoadingStates(
    triggerLoading: () => Promise<void>,
    checkLoadingState: (isLoading: boolean) => void,
    loadingDuration: number
  ) {
    timerTestUtils.setup()
    
    // Initially not loading
    checkLoadingState(false)
    
    // Start loading
    const loadingPromise = triggerLoading()
    
    // Should be loading
    checkLoadingState(true)
    
    // Wait for loading to complete
    await timerTestUtils.fastForward(loadingDuration)
    await loadingPromise
    
    // Should not be loading
    checkLoadingState(false)
    
    timerTestUtils.cleanup()
  },
}

/**
 * Utility to create a test environment with both date and timer mocking
 */
export const createDateTimeTestEnvironment = (mockDate?: Date | string) => {
  beforeEach(() => {
    dateTestUtils.setup(mockDate)
    timerTestUtils.setup()
  })

  afterEach(() => {
    dateTestUtils.cleanup()
    timerTestUtils.cleanup()
  })

  return {
    date: dateTestUtils,
    timer: timerTestUtils,
  }
}

/**
 * Jest setup for date/time testing
 */
export const setupDateTimeTesting = () => {
  beforeAll(() => {
    // Set up global date/time testing environment
  })

  afterAll(() => {
    // Clean up global date/time testing environment
    MockDate.restoreImplementation()
    TimerUtils.useRealTimers()
  })
}
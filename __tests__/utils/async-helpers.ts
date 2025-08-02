/**
 * Async testing utilities for React Testing Library
 * Provides proper act() wrappers and async handling for tests
 */

import { act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Wrapper for act() that handles both sync and async operations
 */
export const actAsync = async (callback: () => Promise<void> | void) => {
  await act(async () => {
    await callback()
  })
}

/**
 * Helper to wait for state updates with act() wrapper
 */
export const waitForStateUpdate = async (callback?: () => void) => {
  await act(async () => {
    if (callback) {
      callback()
    }
    // Wait for next tick to allow state updates
    await new Promise(resolve => setImmediate(resolve))
  })
}

/**
 * Helper to wait for async operations with timeout
 */
export const waitForAsync = async (
  callback: () => Promise<boolean> | boolean,
  timeout = 5000,
  interval = 100
) => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = await callback()
      if (result) {
        return true
      }
    } catch (error) {
      // Continue waiting if callback throws
    }
    
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error(`waitForAsync timed out after ${timeout}ms`)
}

/**
 * Enhanced waitFor with act() wrapper
 */
export const waitForWithAct = async <T>(
  callback: () => T | Promise<T>,
  options?: Parameters<typeof waitFor>[1]
) => {
  return await act(async () => {
    return await waitFor(callback, {
      timeout: 5000,
      ...options,
    })
  })
}

/**
 * Helper for testing form submissions with proper async handling
 */
export const submitForm = async (form: HTMLFormElement) => {
  const user = userEvent.setup()
  
  await act(async () => {
    await user.click(form.querySelector('button[type="submit"]') as HTMLElement)
  })
  
  // Wait for form submission to complete
  await waitForStateUpdate()
}

/**
 * Helper for testing user interactions with act() wrapper
 */
export const userInteraction = {
  async click(element: HTMLElement) {
    const user = userEvent.setup()
    await act(async () => {
      await user.click(element)
    })
    await waitForStateUpdate()
  },

  async type(element: HTMLElement, text: string) {
    const user = userEvent.setup()
    await act(async () => {
      await user.type(element, text)
    })
    await waitForStateUpdate()
  },

  async clear(element: HTMLElement) {
    const user = userEvent.setup()
    await act(async () => {
      await user.clear(element)
    })
    await waitForStateUpdate()
  },

  async selectOptions(element: HTMLElement, options: string | string[]) {
    const user = userEvent.setup()
    await act(async () => {
      await user.selectOptions(element, options)
    })
    await waitForStateUpdate()
  },

  async upload(element: HTMLElement, file: File | File[]) {
    const user = userEvent.setup()
    await act(async () => {
      await user.upload(element, file)
    })
    await waitForStateUpdate()
  },

  async keyboard(keys: string) {
    const user = userEvent.setup()
    await act(async () => {
      await user.keyboard(keys)
    })
    await waitForStateUpdate()
  },
}

/**
 * Helper to mock and control timers in tests
 */
export const createTimerUtils = () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  return {
    async advanceTimers(ms: number) {
      await act(async () => {
        jest.advanceTimersByTime(ms)
      })
    },

    async runAllTimers() {
      await act(async () => {
        jest.runAllTimers()
      })
    },

    async runOnlyPendingTimers() {
      await act(async () => {
        jest.runOnlyPendingTimers()
      })
    },
  }
}

/**
 * Helper to test component error boundaries
 */
export const testErrorBoundary = async (
  renderComponent: () => void,
  triggerError: () => Promise<void> | void
) => {
  // Suppress console.error for this test
  const originalError = console.error
  console.error = jest.fn()

  try {
    renderComponent()
    
    await act(async () => {
      await triggerError()
    })
    
    return true
  } catch (error) {
    return false
  } finally {
    console.error = originalError
  }
}

/**
 * Helper to test loading states
 */
export const testLoadingState = async (
  getLoadingElement: () => HTMLElement | null,
  triggerLoadingAction: () => Promise<void> | void,
  waitForCompletion?: () => Promise<void> | void
) => {
  // Before action - should not be loading
  expect(getLoadingElement()).not.toBeInTheDocument()
  
  // Trigger loading action
  await act(async () => {
    await triggerLoadingAction()
  })
  
  // During loading - should show loading state
  await waitFor(() => {
    expect(getLoadingElement()).toBeInTheDocument()
  })
  
  // Wait for completion if provided
  if (waitForCompletion) {
    await act(async () => {
      await waitForCompletion()
    })
    
    // After completion - should not be loading
    await waitFor(() => {
      expect(getLoadingElement()).not.toBeInTheDocument()
    })
  }
}

/**
 * Helper to test error states
 */
export const testErrorState = async (
  getErrorElement: () => HTMLElement | null,
  triggerErrorAction: () => Promise<void> | void,
  expectedErrorMessage?: string
) => {
  // Before action - should not show error
  expect(getErrorElement()).not.toBeInTheDocument()
  
  // Trigger error action
  await act(async () => {
    await triggerErrorAction()
  })
  
  // Should show error state
  await waitFor(() => {
    const errorElement = getErrorElement()
    expect(errorElement).toBeInTheDocument()
    
    if (expectedErrorMessage) {
      expect(errorElement).toHaveTextContent(expectedErrorMessage)
    }
  })
}

/**
 * Helper to create controlled promises for testing
 */
export const createControlledPromise = <T = any>() => {
  let resolvePromise: (value: T) => void
  let rejectPromise: (error: any) => void
  
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  
  return {
    promise,
    resolve: resolvePromise!,
    reject: rejectPromise!,
  }
}

/**
 * Helper to test component cleanup and memory leaks
 */
export const testComponentCleanup = (
  renderComponent: () => { unmount: () => void },
  checkCleanup: () => boolean
) => {
  const { unmount } = renderComponent()
  
  // Component should be mounted and functional
  expect(checkCleanup()).toBe(true)
  
  // Unmount component
  act(() => {
    unmount()
  })
  
  // Check that cleanup was performed
  expect(checkCleanup()).toBe(false)
}
/**
 * MSW server setup for testing
 * Configures Mock Service Worker for consistent API mocking
 */

import { setupServer } from 'msw/node'
import { handlers } from './msw-handlers'

// Setup MSW server with default handlers
export const server = setupServer(...handlers)

// For Jest testing environment, we need to ensure proper cleanup
if (typeof global !== 'undefined') {
  // Start server before all tests
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn', // Changed from 'error' to 'warn' for better compatibility
    })
  })

  // Reset handlers between tests
  afterEach(() => {
    server.resetHandlers()
  })

  // Clean up after all tests
  afterAll(() => {
    server.close()
  })
}

export { server as mswServer }
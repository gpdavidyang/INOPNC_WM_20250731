import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import { createClient } from '@/lib/supabase/client'
import { AuthProvider } from '@/contexts/auth-context'

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}))

// Test component that can throw errors
const ErrorThrowingComponent = ({ shouldThrow = false, errorType = 'runtime' }: { 
  shouldThrow?: boolean
  errorType?: 'runtime' | 'network' | 'auth' | 'permission'
}) => {
  React.useEffect(() => {
    if (shouldThrow) {
      switch (errorType) {
        case 'runtime':
          throw new Error('Runtime error occurred')
        case 'network':
          throw new Error('Network connection failed')
        case 'auth':
          throw new Error('Authentication failed')
        case 'permission':
          throw new Error('Permission denied')
        default:
          throw new Error('Unknown error')
      }
    }
  }, [shouldThrow, errorType])

  return <div data-testid="success-component">Component rendered successfully</div>
}

// Component that simulates network loading states
const NetworkComponent = ({ 
  shouldFail = false, 
  isLoading = false 
}: { 
  shouldFail?: boolean
  isLoading?: boolean 
}) => {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(isLoading)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (shouldFail) {
      setLoading(false)
      setError('Failed to load data')
      return
    }

    if (isLoading) {
      setTimeout(() => {
        setLoading(false)
        setData({ message: 'Data loaded successfully' })
      }, 100)
    }
  }, [shouldFail, isLoading])

  if (loading) {
    return (
      <div data-testid="loading-fallback">
        <div className="animate-spin">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="error-fallback">
        <div className="text-red-600">Error: {error}</div>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div data-testid="empty-state">
        <div>No data available</div>
      </div>
    )
  }

  return (
    <div data-testid="success-data">
      {data.message}
    </div>
  )
}

// Supabase data component that can fail
const SupabaseDataComponent = ({ shouldFail = false }: { shouldFail?: boolean }) => {
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        
        if (shouldFail) {
          throw new Error('Database connection failed')
        }

        const { data: result, error: supabaseError } = await supabase
          .from('daily_reports')
          .select('*')

        if (supabaseError) {
          throw supabaseError
        }

        setData(result || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [shouldFail])

  if (loading) {
    return (
      <div data-testid="supabase-loading">
        Loading data...
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="supabase-error">
        <div className="error-message">Database Error: {error}</div>
        <div className="error-actions">
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="supabase-success">
      <div>Records found: {data.length}</div>
      {data.map((item, index) => (
        <div key={index} data-testid={`record-${index}`}>
          {item.title || 'Untitled'}
        </div>
      ))}
    </div>
  )
}

// Custom error boundary component
const CustomErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={
        <div data-testid="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

describe('Error Boundary and Fallback UI Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null
        }),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } }
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: [
              { id: 1, title: 'Test Report 1' },
              { id: 2, title: 'Test Report 2' }
            ],
            error: null
          })
        })
      }),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Error Boundary Functionality', () => {
    it('should catch runtime errors and display fallback UI', async () => {
      render(
        <CustomErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} errorType="runtime" />
        </CustomErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument()
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('An unexpected error occurred. Please try refreshing the page.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument()
      })

      expect(screen.queryByTestId('success-component')).not.toBeInTheDocument()
    })

    it('should not display fallback UI when no errors occur', () => {
      render(
        <CustomErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </CustomErrorBoundary>
      )

      expect(screen.getByTestId('success-component')).toBeInTheDocument()
      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument()
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument()
    })

    it('should handle different error types appropriately', async () => {
      const errorTypes = ['runtime', 'network', 'auth', 'permission'] as const

      for (const errorType of errorTypes) {
        const { unmount } = render(
          <CustomErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} errorType={errorType} />
          </CustomErrorBoundary>
        )

        await waitFor(() => {
          expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('should work with nested components', async () => {
      const NestedComponent = () => (
        <div>
          <div>Parent Component</div>
          <ErrorThrowingComponent shouldThrow={true} errorType="runtime" />
        </div>
      )

      render(
        <CustomErrorBoundary>
          <NestedComponent />
        </CustomErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument()
      })

      expect(screen.queryByText('Parent Component')).not.toBeInTheDocument()
    })
  })

  describe('Loading States and Fallbacks', () => {
    it('should display loading fallback during data loading', async () => {
      render(<NetworkComponent isLoading={true} />)

      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('success-data')).not.toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('success-data')).toBeInTheDocument()
        expect(screen.getByText('Data loaded successfully')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument()
    })

    it('should display error fallback when network request fails', () => {
      render(<NetworkComponent shouldFail={true} />)

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
      expect(screen.getByText('Error: Failed to load data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      expect(screen.queryByTestId('success-data')).not.toBeInTheDocument()
    })

    it('should display empty state when no data is available', () => {
      render(<NetworkComponent />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(screen.queryByTestId('success-data')).not.toBeInTheDocument()
    })
  })

  describe('Supabase Integration Error Handling', () => {
    it('should handle successful Supabase data loading', async () => {
      render(<SupabaseDataComponent />)

      expect(screen.getByTestId('supabase-loading')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('supabase-success')).toBeInTheDocument()
        expect(screen.getByText('Records found: 2')).toBeInTheDocument()
        expect(screen.getByTestId('record-0')).toHaveTextContent('Test Report 1')
        expect(screen.getByTestId('record-1')).toHaveTextContent('Test Report 2')
      })
    })

    it('should handle Supabase connection errors', async () => {
      render(<SupabaseDataComponent shouldFail={true} />)

      expect(screen.getByTestId('supabase-loading')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('supabase-error')).toBeInTheDocument()
        expect(screen.getByText('Database Error: Database connection failed')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
      })

      expect(screen.queryByTestId('supabase-success')).not.toBeInTheDocument()
    })

    it('should handle Supabase authentication errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'JWT expired', code: 'PGRST301' }
          })
        })
      })

      render(<SupabaseDataComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('supabase-error')).toBeInTheDocument()
        expect(screen.getByText(/JWT expired/)).toBeInTheDocument()
      })
    })

    it('should handle empty Supabase query results', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      render(<SupabaseDataComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('supabase-success')).toBeInTheDocument()
        expect(screen.getByText('Records found: 0')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Error Scenarios', () => {
    it('should handle authentication context errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth service unavailable'))

      const TestComponentWithAuth = () => {
        const [error, setError] = React.useState<string | null>(null)

        React.useEffect(() => {
          const supabase = createClient()
          supabase.auth.getUser().catch((err) => {
            setError(err.message)
          })
        }, [])

        if (error) {
          return (
            <div data-testid="auth-error-fallback">
              <div>Authentication Error: {error}</div>
              <button onClick={() => window.location.href = '/auth/login'}>
                Go to Login
              </button>
            </div>
          )
        }

        return <div data-testid="auth-success">Authenticated</div>
      }

      render(
        <AuthProvider>
          <TestComponentWithAuth />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-fallback')).toBeInTheDocument()
        expect(screen.getByText('Authentication Error: Auth service unavailable')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument()
      })
    })

    it('should handle session expiration gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' }
      })

      const SessionComponent = () => {
        const [sessionError, setSessionError] = React.useState<string | null>(null)

        React.useEffect(() => {
          const checkSession = async () => {
            const supabase = createClient()
            const { error } = await supabase.auth.getUser()
            if (error) {
              setSessionError(error.message)
            }
          }
          checkSession()
        }, [])

        if (sessionError) {
          return (
            <div data-testid="session-expired-fallback">
              <div>Session Expired</div>
              <div>Please log in again to continue</div>
              <button onClick={() => window.location.href = '/auth/login'}>
                Login
              </button>
            </div>
          )
        }

        return <div data-testid="session-valid">Session is valid</div>
      }

      render(<SessionComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('session-expired-fallback')).toBeInTheDocument()
        expect(screen.getByText('Session Expired')).toBeInTheDocument()
        expect(screen.getByText('Please log in again to continue')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Recovery', () => {
    it('should not cause infinite re-rendering with error boundaries', async () => {
      let renderCount = 0

      const CountingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        renderCount++
        
        if (shouldThrow && renderCount === 1) {
          throw new Error('First render error')
        }

        return <div data-testid="counting-component">Render count: {renderCount}</div>
      }

      render(
        <CustomErrorBoundary>
          <CountingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument()
      })

      // Should not continue re-rendering after error boundary catches error
      expect(renderCount).toBe(1)
    })

    it('should allow recovery after error is resolved', async () => {
      const RecoverableComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Recoverable error')
        }
        return <div data-testid="recovered-component">Component recovered</div>
      }

      const { rerender } = render(
        <CustomErrorBoundary>
          <RecoverableComponent shouldThrow={true} />
        </CustomErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument()
      })

      // Simulate error resolution by re-rendering without error
      rerender(
        <CustomErrorBoundary>
          <RecoverableComponent shouldThrow={false} />
        </CustomErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByTestId('recovered-component')).toBeInTheDocument()
        expect(screen.getByText('Component recovered')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument()
    })
  })
})
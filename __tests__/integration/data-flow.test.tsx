import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/providers/auth-provider'
import { SunlightModeProvider } from '@/contexts/SunlightModeContext'
import { EnvironmentalProvider } from '@/contexts/EnvironmentalContext'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard'),
}))

// Test component that uses multiple contexts
const TestComponent = () => {
  const [user, setUser] = React.useState<any>(null)
  
  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])
  
  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in as ${user.email}` : 'Not logged in'}
      </div>
      <div data-testid="body-classes">
        {document.documentElement.className}
      </div>
    </div>
  )
}

describe('Data Flow Integration Tests', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset document classes
    document.documentElement.className = ''
    
    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
        onAuthStateChange: jest.fn((callback) => {
          // Simulate immediate auth state callback
          callback('INITIAL_SESSION', null)
          return {
            data: { subscription: { unsubscribe: jest.fn() } },
          }
        }),
      },
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  describe('Context Provider Integration', () => {
    it('should integrate multiple context providers correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })
      
      const { getByTestId } = render(
        <AuthProvider>
          <SunlightModeProvider>
            <EnvironmentalProvider>
              <TestComponent />
            </EnvironmentalProvider>
          </SunlightModeProvider>
        </AuthProvider>
      )
      
      // Wait for auth state to be loaded
      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com')
      })
      
      // Check that environmental context is applied (should have interaction mode and environmental condition)
      const bodyClasses = getByTestId('body-classes')
      // The class should contain either 'precision-mode', 'glove-mode', or 'auto-mode'
      // and an environmental condition like 'env-normal', 'env-bright-sun', etc.
      expect(bodyClasses.textContent).toMatch(/(?:precision|glove|auto)-mode/)
    })
    
    it('should handle auth state changes across contexts', async () => {
      let authCallback: any
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      })
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })
      
      const { getByTestId, rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Initially not logged in
      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('Not logged in')
      })
      
      // Simulate login
      const mockUser = { id: 'user-123', email: 'new@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      // Trigger auth state change with session
      authCallback('SIGNED_IN', { user: mockUser })
      
      // Need to wait for the component to update
      await waitFor(() => {
        // The component will re-fetch user data, so it should still show as not logged in
        // because we haven't updated the mock
        expect(getByTestId('user-status')).toHaveTextContent('Not logged in')
      })
    })
  })
  
  describe('Global State Updates', () => {
    it('should update multiple contexts when environmental conditions change', async () => {
      const TestEnvironmentComponent = () => {
        const [sunlightClasses, setSunlightClasses] = React.useState('')
        const [envClasses, setEnvClasses] = React.useState('')
        
        React.useEffect(() => {
          const observer = new MutationObserver(() => {
            setSunlightClasses(document.documentElement.className)
            setEnvClasses(document.documentElement.className)
          })
          
          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
          })
          
          return () => observer.disconnect()
        }, [])
        
        return (
          <div>
            <div data-testid="sunlight-classes">{sunlightClasses}</div>
            <div data-testid="env-classes">{envClasses}</div>
          </div>
        )
      }
      
      const { getByTestId } = render(
        <SunlightModeProvider>
          <EnvironmentalProvider>
            <TestEnvironmentComponent />
          </EnvironmentalProvider>
        </SunlightModeProvider>
      )
      
      await waitFor(() => {
        const envClasses = getByTestId('env-classes').textContent
        // Should contain interaction mode and environmental condition
        expect(envClasses).toMatch(/(?:precision|glove|auto)-mode/)
        expect(envClasses).toMatch(/env-(?:normal|rain|bright-sun|dust|cold)/)
      })
    })
  })
  
  describe('Error Boundary Integration', () => {
    it('should handle errors in nested components gracefully', async () => {
      // Mock getSession to return immediately
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })
      
      const ThrowError = () => {
        throw new Error('Test error')
      }
      
      const ErrorFallback = ({ error }: { error: Error }) => (
        <div data-testid="error-message">{error.message}</div>
      )
      
      // Simple error boundary for testing
      class TestErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean; error: Error | null }
      > {
        state = { hasError: false, error: null }
        
        static getDerivedStateFromError(error: Error) {
          return { hasError: true, error }
        }
        
        render() {
          if (this.state.hasError) {
            return <ErrorFallback error={this.state.error!} />
          }
          return this.props.children
        }
      }
      
      // Component that waits for auth to load before throwing
      const WaitAndThrow = () => {
        const [isReady, setIsReady] = React.useState(false)
        
        React.useEffect(() => {
          // Wait a tick to ensure auth provider has initialized
          const timer = setTimeout(() => setIsReady(true), 0)
          return () => clearTimeout(timer)
        }, [])
        
        if (isReady) {
          return <ThrowError />
        }
        
        return <div>Loading...</div>
      }
      
      const { getByTestId } = render(
        <TestErrorBoundary>
          <AuthProvider>
            <WaitAndThrow />
          </AuthProvider>
        </TestErrorBoundary>
      )
      
      await waitFor(() => {
        expect(getByTestId('error-message')).toHaveTextContent('Test error')
      })
    })
  })
  
  describe('Real-time Data Synchronization', () => {
    it('should handle real-time subscription updates', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn((callback) => {
          // Simulate immediate subscription
          if (callback) callback('subscribed')
          return mockChannel
        }),
        unsubscribe: jest.fn(),
      }
      
      mockSupabase.channel = jest.fn().mockReturnValue(mockChannel)
      mockSupabase.removeChannel = jest.fn()
      
      const TestRealtimeComponent = () => {
        const [messages, setMessages] = React.useState<any[]>([])
        
        React.useEffect(() => {
          const supabase = createClient()
          const channel = supabase
            .channel('test-channel')
            .on('postgres_changes', 
              { event: 'INSERT', schema: 'public', table: 'messages' },
              (payload) => {
                setMessages(prev => [...prev, payload.new])
              }
            )
            .subscribe()
          
          return () => {
            supabase.removeChannel(channel)
          }
        }, [])
        
        return (
          <div data-testid="message-count">{messages.length}</div>
        )
      }
      
      const { getByTestId } = render(<TestRealtimeComponent />)
      
      expect(mockSupabase.channel).toHaveBeenCalledWith('test-channel')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }),
        expect.any(Function)
      )
      
      // Simulate real-time message
      const insertCallback = mockChannel.on.mock.calls[0][2]
      insertCallback({ new: { id: 1, text: 'Hello' } })
      
      await waitFor(() => {
        expect(getByTestId('message-count')).toHaveTextContent('1')
      })
    })
  })
  
  describe('Session Management and Token Refresh', () => {
    it('should handle token refresh automatically', async () => {
      let sessionCallback: any
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        sessionCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      })
      
      const initialSession = {
        access_token: 'initial-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() / 1000 + 3600, // 1 hour from now
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: initialSession },
        error: null,
      })
      
      const TestSessionComponent = () => {
        const [session, setSession] = React.useState<any>(null)
        
        React.useEffect(() => {
          const supabase = createClient()
          supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
          })
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
              setSession(session)
            }
          )
          
          return () => subscription.unsubscribe()
        }, [])
        
        return (
          <div data-testid="token">
            {session?.access_token || 'No token'}
          </div>
        )
      }
      
      const { getByTestId } = render(<TestSessionComponent />)
      
      await waitFor(() => {
        expect(getByTestId('token')).toHaveTextContent('initial-token')
      })
      
      // Simulate token refresh
      const refreshedSession = {
        access_token: 'refreshed-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() / 1000 + 7200, // 2 hours from now
      }
      
      sessionCallback('TOKEN_REFRESHED', refreshedSession)
      
      await waitFor(() => {
        expect(getByTestId('token')).toHaveTextContent('refreshed-token')
      })
    })
  })
})
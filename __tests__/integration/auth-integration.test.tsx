import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loginUser, signupUser, resetPassword } from '@/app/auth/actions'
import LoginPage from '@/app/auth/login/page'
import SignupPage from '@/app/auth/signup/page'
import ResetPasswordPage from '@/app/auth/reset-password/page'
import { AuthProvider } from '@/contexts/auth-context'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/app/auth/actions', () => ({
  loginUser: jest.fn(),
  signupUser: jest.fn(),
  resetPassword: jest.fn(),
}))

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(),
}

describe('Authentication Flow Integration Tests', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock useRouter
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })

    // Mock createClient
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)

    // Mock auth state change subscription
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })

    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Login Flow Integration', () => {
    it('should handle successful login flow end-to-end', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }

      // Mock successful login
      ;(loginUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: mockUser }
      })

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      })

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      // Fill in login form
      const emailInput = screen.getByLabelText(/이메일/i)
      const passwordInput = screen.getByLabelText(/비밀번호/i)
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith(expect.any(FormData))
      })

      // Verify login was called with correct data
      const formData = (loginUser as jest.Mock).mock.calls[0][0]
      expect(formData.get('email')).toBe('test@example.com')
      expect(formData.get('password')).toBe('password123')
    })

    it('should handle login errors and display error messages', async () => {
      // Mock failed login
      ;(loginUser as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid email or password'
      })

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const emailInput = screen.getByLabelText(/이메일/i)
      const passwordInput = screen.getByLabelText(/비밀번호/i)
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument()
      })
    })

    it('should handle loading states during login', async () => {
      // Mock slow login response
      let resolveLogin: (value: any) => void
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve
      })
      ;(loginUser as jest.Mock).mockReturnValue(loginPromise)

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const emailInput = screen.getByLabelText(/이메일/i)
      const passwordInput = screen.getByLabelText(/비밀번호/i)
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Check loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })

      // Resolve the promise
      resolveLogin!({ success: true, data: { user: { id: '123' } } })

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Signup Flow Integration', () => {
    it('should handle successful signup flow end-to-end', async () => {
      // Mock successful signup
      ;(signupUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: 'new-user-123', email: 'newuser@example.com' } }
      })

      render(
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      )

      // Fill in signup form
      const emailInput = screen.getByLabelText(/이메일/i)
      const passwordInput = screen.getByLabelText('비밀번호')
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i)
      const fullNameInput = screen.getByLabelText(/이름/i)
      const submitButton = screen.getByRole('button', { name: /가입하기/i })

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(fullNameInput, { target: { value: 'New User' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(signupUser).toHaveBeenCalledWith(expect.any(FormData))
      })

      const formData = (signupUser as jest.Mock).mock.calls[0][0]
      expect(formData.get('email')).toBe('newuser@example.com')
      expect(formData.get('password')).toBe('password123')
      expect(formData.get('fullName')).toBe('New User')
    })

    it('should validate password confirmation matching', async () => {
      render(
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      )

      const passwordInput = screen.getByLabelText('비밀번호')
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i)
      const submitButton = screen.getByRole('button', { name: /가입하기/i })

      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument()
      })

      // Ensure signup was not called
      expect(signupUser).not.toHaveBeenCalled()
    })

    it('should handle signup errors', async () => {
      ;(signupUser as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Email already exists'
      })

      render(
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      )

      const emailInput = screen.getByLabelText(/이메일/i)
      const passwordInput = screen.getByLabelText('비밀번호')
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i)
      const fullNameInput = screen.getByLabelText(/이름/i)
      const submitButton = screen.getByRole('button', { name: /가입하기/i })

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(fullNameInput, { target: { value: 'Test User' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Password Reset Flow Integration', () => {
    it('should handle successful password reset request', async () => {
      ;(resetPassword as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Password reset email sent'
      })

      render(
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      )

      const emailInput = screen.getByLabelText(/이메일/i)
      const submitButton = screen.getByRole('button', { name: /재설정 링크 보내기/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(resetPassword).toHaveBeenCalledWith(expect.any(FormData))
      })

      const formData = (resetPassword as jest.Mock).mock.calls[0][0]
      expect(formData.get('email')).toBe('test@example.com')

      await waitFor(() => {
        expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument()
      })
    })

    it('should handle password reset errors', async () => {
      ;(resetPassword as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Email not found'
      })

      render(
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      )

      const emailInput = screen.getByLabelText(/이메일/i)
      const submitButton = screen.getByRole('button', { name: /재설정 링크 보내기/i })

      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email not found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Authentication State Management Integration', () => {
    it('should properly manage authentication state across components', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      // Start with no user
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null }
      })

      let authStateCallback: Function
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const TestComponent = () => {
        return (
          <AuthProvider>
            <div data-testid="auth-state">Authenticated</div>
          </AuthProvider>
        )
      }

      render(<TestComponent />)

      // Initially no user should be authenticated
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      })

      // Simulate sign in event
      if (authStateCallback!) {
        authStateCallback('SIGNED_IN', { user: mockUser })
      }

      // Verify state update
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('should handle session timeout and refresh', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      })

      let authStateCallback: Function
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const TestComponent = () => {
        return (
          <AuthProvider>
            <div data-testid="auth-state">Authenticated</div>
          </AuthProvider>
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      })

      // Simulate token refresh
      if (authStateCallback!) {
        authStateCallback('TOKEN_REFRESHED', { user: mockUser })
      }

      // Should not trigger navigation refresh for token refresh
      await waitFor(() => {
        expect(mockRefresh).not.toHaveBeenCalled()
      })
    })

    it('should handle sign out and redirect to login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      })

      let authStateCallback: Function
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const TestComponent = () => {
        return (
          <AuthProvider>
            <div data-testid="auth-state">Authenticated</div>
          </AuthProvider>
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      })

      // Simulate sign out
      if (authStateCallback!) {
        authStateCallback('SIGNED_OUT', null)
      }

      // Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })
  })

  describe('Form Validation Integration', () => {
    it('should validate email format across all auth forms', async () => {
      const forms = [
        { component: LoginPage, submitButtonText: /로그인/i },
        { component: SignupPage, submitButtonText: /가입하기/i },
        { component: ResetPasswordPage, submitButtonText: /재설정 링크 보내기/i }
      ]

      for (const { component: Component, submitButtonText } of forms) {
        const { unmount } = render(
          <AuthProvider>
            <Component />
          </AuthProvider>
        )

        const emailInput = screen.getByLabelText(/이메일/i)
        const submitButton = screen.getByRole('button', { name: submitButtonText })

        // Test invalid email
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
        fireEvent.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/유효한 이메일 주소를 입력해주세요/i)).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('should validate required fields', async () => {
      render(
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      )

      const submitButton = screen.getByRole('button', { name: /가입하기/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // Should show validation errors for required fields
        expect(screen.getByText(/이메일은 필수입니다/i)).toBeInTheDocument()
        expect(screen.getByText(/비밀번호는 필수입니다/i)).toBeInTheDocument()
        expect(screen.getByText(/이름은 필수입니다/i)).toBeInTheDocument()
      })

      // Ensure signup was not called
      expect(signupUser).not.toHaveBeenCalled()
    })
  })

  describe('Authentication Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      ;(loginUser as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const emailInput = screen.getByLabelText(/이메일/i)
      const passwordInput = screen.getByLabelText(/비밀번호/i)
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/네트워크 오류가 발생했습니다/i)).toBeInTheDocument()
      })
    })

    it('should handle server errors appropriately', async () => {
      ;(loginUser as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Server temporarily unavailable'
      })

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const emailInput = screen.getByLabelText(/이메일/i)
      const passwordInput = screen.getByLabelText(/비밀번호/i)
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Server temporarily unavailable/i)).toBeInTheDocument()
      })
    })
  })
})
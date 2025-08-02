import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from '@/app/auth/login/page'
import { signIn } from '@/app/auth/actions'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock auth actions
jest.mock('@/app/auth/actions', () => ({
  signIn: jest.fn(),
}))

// Mock fetch for seed data
global.fetch = jest.fn()

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()
  const mockGet = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock useRouter
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })

    // Mock useSearchParams
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    })

    // Mock window.location.href safely
    delete (window as any).location
    ;(window as any).location = { href: '' }

    // Mock alert
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      mockGet.mockReturnValue(null)
      
      render(<LoginPage />)

      // Check logo and title
      expect(screen.getByText('INOPNC')).toBeInTheDocument()
      expect(screen.getByText('건설 작업일지 관리 시스템')).toBeInTheDocument()

      // Check form elements
      expect(screen.getByLabelText('이메일')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()

      // Check navigation links
      expect(screen.getByText('계정이 없으신가요? 회원가입')).toBeInTheDocument()
      expect(screen.getByText('비밀번호를 잊으셨나요?')).toBeInTheDocument()

      // Check demo accounts section
      expect(screen.getByText('데모 계정:')).toBeInTheDocument()
      expect(screen.getByText('작업자: worker@inopnc.com / password123')).toBeInTheDocument()
    })

    it('should render with custom redirect parameter', () => {
      mockGet.mockReturnValue('/custom-path')
      
      render(<LoginPage />)
      
      expect(mockGet).toHaveBeenCalledWith('redirectTo')
    })
  })

  describe('Form Interactions', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(null)
    })

    it('should update email and password fields', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일') as HTMLInputElement
      const passwordInput = screen.getByLabelText('비밀번호') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('password123')
    })

    it('should toggle password visibility', () => {
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText('비밀번호') as HTMLInputElement
      const toggleButton = passwordInput.parentElement?.querySelector('button')

      // Initially password should be hidden
      expect(passwordInput.type).toBe('password')

      // Click toggle button
      if (toggleButton) {
        fireEvent.click(toggleButton)
        expect(passwordInput.type).toBe('text')

        // Click again to hide
        fireEvent.click(toggleButton)
        expect(passwordInput.type).toBe('password')
      }
    })

    it('should show required validation for empty fields', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')

      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })
  })

  describe('Login Functionality', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('/dashboard')
    })

    it('should handle successful login', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ success: true })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const submitButton = screen.getByRole('button', { name: '로그인' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard')
      })
    })

    it('should handle login error', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const submitButton = screen.getByRole('button', { name: '로그인' })

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('should translate invalid credentials error to Korean', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ error: 'Invalid login credentials' })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const submitButton = screen.getByRole('button', { name: '로그인' })

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument()
      })
    })

    it('should show loading state during login', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve
      })
      ;(signIn as jest.Mock).mockReturnValue(signInPromise)

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const submitButton = screen.getByRole('button', { name: '로그인' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('로그인 중...')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })

      // Resolve the promise
      resolveSignIn!({ success: true })

      await waitFor(() => {
        expect(screen.queryByText('로그인 중...')).not.toBeInTheDocument()
      })
    })

    it('should use custom redirect path', async () => {
      mockGet.mockReturnValue('/custom-redirect')
      ;(signIn as jest.Mock).mockResolvedValue({ success: true })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')
      const submitButton = screen.getByRole('button', { name: '로그인' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(window.location.href).toBe('/custom-redirect')
      })
    })
  })

  describe('Demo Data Functionality', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(null)
    })

    it('should handle successful demo data creation', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(<LoginPage />)

      const seedButton = screen.getByText('데모 데이터 생성')
      fireEvent.click(seedButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/seed')
        expect(global.alert).toHaveBeenCalledWith('데모 데이터가 생성되었습니다. 아래 계정으로 로그인하세요.')
      })
    })

    it('should handle demo data creation error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Database error' }),
      })

      render(<LoginPage />)

      const seedButton = screen.getByText('데모 데이터 생성')
      fireEvent.click(seedButton)

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument()
      })
    })

    it('should show loading state during demo data creation', async () => {
      let resolveFetch: (value: any) => void
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve
      })
      ;(global.fetch as jest.Mock).mockReturnValue(fetchPromise)

      render(<LoginPage />)

      const seedButton = screen.getByText('데모 데이터 생성')
      fireEvent.click(seedButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('생성 중...')).toBeInTheDocument()
        expect(seedButton).toBeDisabled()
      })

      // Resolve the promise
      resolveFetch!({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    })

    it('should handle fetch network error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<LoginPage />)

      const seedButton = screen.getByText('데모 데이터 생성')
      fireEvent.click(seedButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(null)
    })

    it('should have proper form labels and associations', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('should have proper input types', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('이메일')
      const passwordInput = screen.getByLabelText('비밀번호')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should have proper button roles and states', () => {
      render(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: '로그인' })
      const toggleButton = screen.getAllByRole('button').find(btn => 
        btn.closest('.relative')
      )

      expect(submitButton).toHaveAttribute('type', 'submit')
      if (toggleButton) {
        expect(toggleButton).toHaveAttribute('type', 'button')
      }
    })
  })
})
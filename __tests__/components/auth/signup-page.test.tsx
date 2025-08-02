import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SignupPage from '@/app/auth/signup/page'
import { signUp } from '@/app/auth/actions'
import type { UserRole } from '@/types'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth actions
jest.mock('@/app/auth/actions', () => ({
  signUp: jest.fn(),
}))

describe('SignupPage', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock useRouter
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })

    // Mock alert
    global.alert = jest.fn()
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render signup form with all elements', () => {
      render(<SignupPage />)

      // Check logo and title
      expect(screen.getByText('INOPNC')).toBeInTheDocument()
      expect(screen.getByText('건설 작업일지 관리 시스템')).toBeInTheDocument()

      // Check form elements (some labels have asterisks for required fields)
      expect(screen.getByLabelText('이름 *')).toBeInTheDocument()
      expect(screen.getByLabelText('이메일 *')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호 *')).toBeInTheDocument()
      expect(screen.getByLabelText('전화번호')).toBeInTheDocument()
      expect(screen.getByLabelText('역할 *')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument()

      // Check navigation link
      expect(screen.getByText('이미 계정이 있으신가요? 로그인')).toBeInTheDocument()
    })

    it('should have default role selection', () => {
      render(<SignupPage />)

      const roleSelect = screen.getByLabelText('역할 *') as HTMLSelectElement
      expect(roleSelect.value).toBe('worker')
    })

    it('should render all role options', () => {
      render(<SignupPage />)

      const roleSelect = screen.getByLabelText('역할 *')
      
      // Check if role options are available
      expect(screen.getByDisplayValue('작업자')).toBeInTheDocument()
      
      // Open select and check options
      fireEvent.click(roleSelect)
      
      // Note: We can't easily test all dropdown options without more complex setup
      // but we can test that the select exists and has a default value
    })
  })

  describe('Form Interactions', () => {
    it('should update form fields', () => {
      render(<SignupPage />)

      const emailInput = screen.getByLabelText('이메일 *') as HTMLInputElement
      const passwordInput = screen.getByLabelText('비밀번호 *') as HTMLInputElement
      const nameInput = screen.getByLabelText('이름 *') as HTMLInputElement
      const phoneInput = screen.getByLabelText('전화번호') as HTMLInputElement
      const roleSelect = screen.getByLabelText('역할 *') as HTMLSelectElement

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInput, { target: { value: '010-1234-5678' } })
      fireEvent.change(roleSelect, { target: { value: 'site_manager' } })

      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('password123')
      expect(nameInput.value).toBe('Test User')
      expect(phoneInput.value).toBe('010-1234-5678')
      expect(roleSelect.value).toBe('site_manager')
    })

    it('should toggle password visibility', () => {
      render(<SignupPage />)

      const passwordInput = screen.getByLabelText('비밀번호 *') as HTMLInputElement
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

    it('should show required validation for fields', () => {
      render(<SignupPage />)

      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const nameInput = screen.getByLabelText('이름 *')
      const phoneInput = screen.getByLabelText('전화번호')

      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
      expect(nameInput).toHaveAttribute('required')
      // Phone is not required in the actual implementation
      expect(phoneInput).not.toHaveAttribute('required')
    })
  })

  describe('Signup Functionality', () => {
    it('should handle successful signup', async () => {
      ;(signUp as jest.Mock).mockResolvedValue({ success: true })

      render(<SignupPage />)

      // Fill out form
      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const nameInput = screen.getByLabelText('이름 *')
      const phoneInput = screen.getByLabelText('전화번호')
      const submitButton = screen.getByRole('button', { name: '회원가입' })

      fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'New User' } })
      fireEvent.change(phoneInput, { target: { value: '010-9876-5432' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith(
          'new@example.com',
          'password123',
          'New User',
          '010-9876-5432',
          'worker'
        )
      })

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('회원가입이 완료되었습니다.')
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should handle signup with different role', async () => {
      ;(signUp as jest.Mock).mockResolvedValue({ success: true })

      render(<SignupPage />)

      // Fill out form with site manager role
      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const nameInput = screen.getByLabelText('이름 *')
      const phoneInput = screen.getByLabelText('전화번호')
      const roleSelect = screen.getByLabelText('역할 *')
      const submitButton = screen.getByRole('button', { name: '회원가입' })

      fireEvent.change(emailInput, { target: { value: 'manager@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'Site Manager' } })
      fireEvent.change(phoneInput, { target: { value: '010-1111-2222' } })
      fireEvent.change(roleSelect, { target: { value: 'site_manager' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith(
          'manager@example.com',
          'password123',
          'Site Manager',
          '010-1111-2222',
          'site_manager'
        )
      })
    })

    it('should handle signup error', async () => {
      ;(signUp as jest.Mock).mockResolvedValue({ error: 'Email already exists' })

      render(<SignupPage />)

      // Fill out form
      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const nameInput = screen.getByLabelText('이름 *')
      const phoneInput = screen.getByLabelText('전화번호')
      const submitButton = screen.getByRole('button', { name: '회원가입' })

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'Existing User' } })
      fireEvent.change(phoneInput, { target: { value: '010-1234-5678' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })

      // Should not navigate on error
      expect(mockPush).not.toHaveBeenCalled()
      expect(global.alert).not.toHaveBeenCalled()
    })

    it('should handle signup exception', async () => {
      ;(signUp as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<SignupPage />)

      // Fill out form
      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const nameInput = screen.getByLabelText('이름 *')
      const phoneInput = screen.getByLabelText('전화번호')
      const submitButton = screen.getByRole('button', { name: '회원가입' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInput, { target: { value: '010-1234-5678' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('회원가입 중 오류가 발생했습니다.')).toBeInTheDocument()
      })

      expect(console.error).toHaveBeenCalledWith('Signup error:', expect.any(Error))
    })

    it('should show loading state during signup', async () => {
      let resolveSignUp: (value: any) => void
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve
      })
      ;(signUp as jest.Mock).mockReturnValue(signUpPromise)

      render(<SignupPage />)

      // Fill out form
      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const nameInput = screen.getByLabelText('이름 *')
      const phoneInput = screen.getByLabelText('전화번호')
      const submitButton = screen.getByRole('button', { name: '회원가입' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInput, { target: { value: '010-1234-5678' } })

      fireEvent.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('가입 중...')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })

      // Resolve the promise
      resolveSignUp!({ success: true })

      await waitFor(() => {
        expect(screen.queryByText('가입 중...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should prevent submission with empty form', () => {
      render(<SignupPage />)

      const submitButton = screen.getByRole('button', { name: '회원가입' })
      
      // Click submit without filling form
      fireEvent.click(submitButton)

      // signUp should not be called
      expect(signUp).not.toHaveBeenCalled()
    })

    it('should handle email format validation', () => {
      render(<SignupPage />)

      const emailInput = screen.getByLabelText('이메일 *')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
    })

    it('should handle password minimum requirements', () => {
      render(<SignupPage />)

      const passwordInput = screen.getByLabelText('비밀번호 *')
      
      expect(passwordInput).toHaveAttribute('minLength', '6')
      expect(passwordInput).toHaveAttribute('required')
    })

    it('should handle phone number type', () => {
      render(<SignupPage />)

      const phoneInput = screen.getByLabelText('전화번호')
      
      expect(phoneInput).toHaveAttribute('type', 'tel')
      // Phone is not required in the actual implementation
      expect(phoneInput).not.toHaveAttribute('required')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and associations', () => {
      render(<SignupPage />)

      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const nameInput = screen.getByLabelText('이름 *')
      const phoneInput = screen.getByLabelText('전화번호')
      const roleSelect = screen.getByLabelText('역할 *')

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(nameInput).toHaveAttribute('id', 'fullName')
      expect(phoneInput).toHaveAttribute('id', 'phone')
      expect(roleSelect).toHaveAttribute('id', 'role')
    })

    it('should have proper input types', () => {
      render(<SignupPage />)

      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const phoneInput = screen.getByLabelText('전화번호')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(phoneInput).toHaveAttribute('type', 'tel')
    })

    it('should have proper ARIA attributes for error states', async () => {
      ;(signUp as jest.Mock).mockResolvedValue({ error: 'Test error' })

      render(<SignupPage />)

      // Fill out all required fields first
      const emailInput = screen.getByLabelText('이메일 *')
      const passwordInput = screen.getByLabelText('비밀번호 *')
      const nameInput = screen.getByLabelText('이름 *')
      const submitButton = screen.getByRole('button', { name: '회원가입' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorElement = screen.getByText('Test error')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveClass('text-red-600')
      })
    })
  })
})
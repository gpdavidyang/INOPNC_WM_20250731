import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResetPasswordForm from '@/app/auth/reset-password/reset-password-form'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('ResetPasswordForm', () => {
  const mockResetPasswordForEmail = jest.fn()
  const mockSupabase = {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    // Mock window.location.origin
    delete (window as any).location
    ;(window as any).location = { origin: 'http://localhost' }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render reset password form', () => {
      render(<ResetPasswordForm />)

      expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '재설정 링크 전송' })).toBeInTheDocument()
      expect(screen.getByText('로그인으로 돌아가기')).toBeInTheDocument()
    })

    it('should have proper form elements', () => {
      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Form Interactions', () => {
    it('should update email field', () => {
      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(emailInput.value).toBe('test@example.com')
    })

    it('should prevent submission with empty email', () => {
      render(<ResetPasswordForm />)

      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })
      const emailInput = screen.getByLabelText('이메일 주소')

      fireEvent.click(submitButton)

      // HTML5 validation should prevent submission
      expect(emailInput).toHaveAttribute('required')
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
    })
  })

  describe('Password Reset Functionality', () => {
    it('should handle successful password reset request', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null })

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
          redirectTo: 'http://localhost/auth/update-password',
        })
      })

      await waitFor(() => {
        expect(screen.getByText('비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.')).toBeInTheDocument()
      })

      // Success message should have green styling
      const successMessage = screen.getByText('비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.')
      expect(successMessage.closest('div')).toHaveClass('bg-green-50', 'text-green-800')
    })

    it('should handle password reset error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ 
        error: { message: 'User not found' } 
      })

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument()
      })

      // Error message should have red styling
      const errorMessage = screen.getByText('User not found')
      expect(errorMessage.closest('div')).toHaveClass('bg-red-50', 'text-red-800')
    })

    it('should handle network error', async () => {
      mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'))

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should handle error without message', async () => {
      mockResetPasswordForEmail.mockRejectedValue({})

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument()
      })
    })

    it('should show loading state during request', async () => {
      let resolveReset: (value: any) => void
      const resetPromise = new Promise((resolve) => {
        resolveReset = resolve
      })
      mockResetPasswordForEmail.mockReturnValue(resetPromise)

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('전송 중...')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })

      // Resolve the promise
      resolveReset!({ error: null })

      await waitFor(() => {
        expect(screen.queryByText('전송 중...')).not.toBeInTheDocument()
      })
    })

    it('should clear previous messages on new submission', async () => {
      // First, show an error
      mockResetPasswordForEmail.mockResolvedValueOnce({ 
        error: { message: 'First error' } 
      })

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument()
      })

      // Now submit again with success
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null })

      fireEvent.click(submitButton)

      // During loading, message should be cleared
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument()
      })

      // Then success message should appear
      await waitFor(() => {
        expect(screen.getByText('비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should require email field', () => {
      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should have proper email format validation', () => {
      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      
      // HTML5 email validation should be applied
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and associations', () => {
      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      
      expect(emailInput).toHaveAttribute('id', 'email')
    })

    it('should have proper button roles and states', () => {
      render(<ResetPasswordForm />)

      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })
      
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should have proper message accessibility', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null })

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const successMessage = screen.getByText('비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.')
        expect(successMessage).toBeInTheDocument()
        
        // Message should be properly styled for screen readers
        expect(successMessage.closest('div')).toHaveClass('text-green-800')
      })
    })

    it('should have proper link accessibility', () => {
      render(<ResetPasswordForm />)

      const backLink = screen.getByText('로그인으로 돌아가기')
      
      expect(backLink).toHaveAttribute('href', '/auth/login')
    })
  })

  describe('User Experience', () => {
    it('should provide clear feedback for success', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null })

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const message = screen.getByText('비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.')
        expect(message).toBeInTheDocument()
        expect(message.closest('div')).toHaveClass('bg-green-50')
      })
    })

    it('should provide clear feedback for errors', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ 
        error: { message: 'Invalid email address' } 
      })

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소')
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'invalid@email.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const message = screen.getByText('Invalid email address')
        expect(message).toBeInTheDocument()
        expect(message.closest('div')).toHaveClass('bg-red-50')
      })
    })

    it('should maintain email value after submission', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null })

      render(<ResetPasswordForm />)

      const emailInput = screen.getByLabelText('이메일 주소') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' })

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.')).toBeInTheDocument()
      })

      // Email value should be preserved
      expect(emailInput.value).toBe('user@example.com')
    })
  })
})
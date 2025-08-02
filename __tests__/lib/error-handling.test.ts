import {
  ErrorType,
  AppError,
  getUserErrorMessage,
  logError,
  showErrorNotification,
  handleAsync,
  retryOperation,
  validateSupabaseResponse,
  getFieldError
} from '@/lib/error-handling'

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

import { toast } from 'sonner'

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  describe('ErrorType enum', () => {
    it('should have all expected error types', () => {
      expect(ErrorType.AUTHENTICATION).toBe('AUTHENTICATION')
      expect(ErrorType.AUTHORIZATION).toBe('AUTHORIZATION')
      expect(ErrorType.VALIDATION).toBe('VALIDATION')
      expect(ErrorType.NOT_FOUND).toBe('NOT_FOUND')
      expect(ErrorType.SERVER_ERROR).toBe('SERVER_ERROR')
      expect(ErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR')
      expect(ErrorType.UNKNOWN).toBe('UNKNOWN')
    })
  })

  describe('AppError class', () => {
    it('should create error with message and type', () => {
      const error = new AppError('Test error', ErrorType.VALIDATION, 400)
      
      expect(error.message).toBe('Test error')
      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('AppError')
      expect(error instanceof Error).toBe(true)
    })

    it('should create error with default type', () => {
      const error = new AppError('Test error')
      
      expect(error.type).toBe(ErrorType.UNKNOWN)
      expect(error.statusCode).toBeUndefined()
    })

    it('should create error with details', () => {
      const details = { field: 'email', value: 'invalid' }
      const error = new AppError('Validation error', ErrorType.VALIDATION, 400, details)
      
      expect(error.details).toEqual(details)
    })
  })

  describe('getUserErrorMessage', () => {
    it('should return custom message from AppError', () => {
      const error = new AppError('Custom error message', ErrorType.VALIDATION)
      expect(getUserErrorMessage(error)).toBe('Custom error message')
    })

    it('should return default message for AppError without message', () => {
      const error = new AppError('', ErrorType.VALIDATION)
      expect(getUserErrorMessage(error)).toBe('입력값을 확인해 주세요.')
    })

    it('should detect network errors', () => {
      const error = new Error('Failed to fetch from server')
      expect(getUserErrorMessage(error)).toBe('네트워크 연결을 확인해 주세요.')
    })

    it('should detect authentication errors', () => {
      const error = new Error('401 Unauthorized access')
      expect(getUserErrorMessage(error)).toBe('로그인이 필요합니다.')
    })

    it('should detect authorization errors', () => {
      const error = new Error('403 Forbidden access')
      expect(getUserErrorMessage(error)).toBe('권한이 없습니다.')
    })

    it('should detect not found errors', () => {
      const error = new Error('404 Not found')
      expect(getUserErrorMessage(error)).toBe('요청한 정보를 찾을 수 없습니다.')
    })

    it('should detect server errors', () => {
      const error = new Error('500 Internal server error')
      expect(getUserErrorMessage(error)).toBe('서버 오류가 발생했습니다.')
    })

    it('should return original message for other errors', () => {
      const error = new Error('Some specific error')
      expect(getUserErrorMessage(error)).toBe('Some specific error')
    })

    it('should handle unknown error types', () => {
      expect(getUserErrorMessage('string error')).toBe('알 수 없는 오류가 발생했습니다.')
      expect(getUserErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.')
      expect(getUserErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.')
    })
  })

  describe('logError', () => {
    it('should log error with timestamp and context', () => {
      const error = new Error('Test error')
      const context = 'test context'
      
      logError(error, context)
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Development Error]',
        expect.objectContaining({
          timestamp: expect.any(String),
          context,
          error: expect.objectContaining({
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String),
          }),
        })
      )
    })

    it('should log error without context', () => {
      const error = new Error('Test error')
      
      logError(error)
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Development Error]',
        expect.objectContaining({
          context: undefined,
        })
      )
    })

    it('should handle non-Error objects', () => {
      logError('string error', 'context')
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Development Error]',
        expect.objectContaining({
          error: 'string error',
        })
      )
    })

    it('should use production logging in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      logError(new Error('Production error'))
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Production Error]',
        expect.any(Object)
      )
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('showErrorNotification', () => {
    it('should show toast notification with error message', () => {
      const error = new Error('Test error')
      
      showErrorNotification(error)
      
      expect(toast.error).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          duration: 5000,
          action: expect.objectContaining({
            label: '닫기',
            onClick: expect.any(Function),
          }),
        })
      )
    })

    it('should log error when context is provided', () => {
      const error = new Error('Test error')
      const context = 'form submission'
      
      showErrorNotification(error, context)
      
      expect(mockConsoleError).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('handleAsync', () => {
    it('should return data and null error on success', async () => {
      const successPromise = Promise.resolve('success data')
      
      const [data, error] = await handleAsync(successPromise)
      
      expect(data).toBe('success data')
      expect(error).toBeNull()
    })

    it('should return null data and error on failure', async () => {
      const errorPromise = Promise.reject(new Error('Test error'))
      
      const [data, error] = await handleAsync(errorPromise, 'test context')
      
      expect(data).toBeNull()
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Test error')
      expect(mockConsoleError).toHaveBeenCalled()
    })
  })

  describe('retryOperation', () => {
    it('should return result on first success', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      const result = await retryOperation(operation, 3, 100)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First fail'))
        .mockRejectedValueOnce(new Error('Second fail'))
        .mockResolvedValue('success')
      
      const result = await retryOperation(operation, 3, 10) // Small delay for test speed
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw last error after all retries fail', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'))
      
      await expect(retryOperation(operation, 3, 10)).rejects.toThrow('Always fails')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should use exponential backoff delay', async () => {
      jest.useFakeTimers()
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First fail'))
        .mockRejectedValueOnce(new Error('Second fail'))
        .mockResolvedValue('success')
      
      const promise = retryOperation(operation, 3, 100)
      
      // Fast-forward through delays
      await jest.advanceTimersByTimeAsync(100) // First retry delay
      await jest.advanceTimersByTimeAsync(200) // Second retry delay (100 * 2)
      
      const result = await promise
      expect(result).toBe('success')
      
      jest.useRealTimers()
    })
  })

  describe('validateSupabaseResponse', () => {
    it('should return data when no error and data exists', () => {
      const data = { id: 1, name: 'test' }
      
      const result = validateSupabaseResponse(data, null)
      
      expect(result).toEqual(data)
    })

    it('should throw authentication error for PGRST301', () => {
      expect(() => {
        validateSupabaseResponse(null, { code: 'PGRST301' })
      }).toThrow(AppError)
      
      try {
        validateSupabaseResponse(null, { code: 'PGRST301' })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).type).toBe(ErrorType.AUTHENTICATION)
        expect((error as AppError).statusCode).toBe(401)
      }
    })

    it('should throw authorization error for 42501', () => {
      expect(() => {
        validateSupabaseResponse(null, { code: '42501' })
      }).toThrow(AppError)
      
      try {
        validateSupabaseResponse(null, { code: '42501' })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).type).toBe(ErrorType.AUTHORIZATION)
        expect((error as AppError).statusCode).toBe(403)
      }
    })

    it('should throw server error for other error codes', () => {
      expect(() => {
        validateSupabaseResponse(null, { code: 'OTHER', message: 'Some error' })
      }).toThrow(AppError)
      
      try {
        validateSupabaseResponse(null, { code: 'OTHER', message: 'Some error' })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).type).toBe(ErrorType.SERVER_ERROR)
        expect((error as AppError).message).toBe('Some error')
      }
    })

    it('should throw not found error when no data', () => {
      expect(() => {
        validateSupabaseResponse(null, null)
      }).toThrow(AppError)
      
      try {
        validateSupabaseResponse(null, null)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).type).toBe(ErrorType.NOT_FOUND)
        expect((error as AppError).statusCode).toBe(404)
      }
    })
  })

  describe('getFieldError', () => {
    it('should return string error directly', () => {
      const errors = { email: '이메일이 필요합니다.' }
      expect(getFieldError(errors, 'email')).toBe('이메일이 필요합니다.')
    })

    it('should return message from error object', () => {
      const errors = { email: { message: '유효하지 않은 이메일입니다.' } }
      expect(getFieldError(errors, 'email')).toBe('유효하지 않은 이메일입니다.')
    })

    it('should handle required validation error', () => {
      const errors = { name: { type: 'required' } }
      expect(getFieldError(errors, 'name')).toBe('필수 입력 항목입니다.')
    })

    it('should handle minLength validation error', () => {
      const errors = { password: { type: 'minLength', minLength: 8 } }
      expect(getFieldError(errors, 'password')).toBe('최소 8자 이상 입력해주세요.')
    })

    it('should handle maxLength validation error', () => {
      const errors = { description: { type: 'maxLength', maxLength: 100 } }
      expect(getFieldError(errors, 'description')).toBe('최대 100자까지 입력 가능합니다.')
    })

    it('should handle pattern validation error', () => {
      const errors = { phone: { type: 'pattern' } }
      expect(getFieldError(errors, 'phone')).toBe('올바른 형식으로 입력해주세요.')
    })

    it('should return default message for unknown error types', () => {
      const errors = { field: { type: 'unknown' } }
      expect(getFieldError(errors, 'field')).toBe('입력값을 확인해주세요.')
    })

    it('should return undefined when no error exists', () => {
      const errors = {}
      expect(getFieldError(errors, 'email')).toBeUndefined()
    })

    it('should return undefined when field has no error', () => {
      const errors = { email: 'error' }
      expect(getFieldError(errors, 'name')).toBeUndefined()
    })
  })
})
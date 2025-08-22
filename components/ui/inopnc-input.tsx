'use client'

import { getInputClasses, getLabelClasses } from '@/lib/design-system-utils'
import { cn } from '@/lib/utils'
import React from 'react'

interface INOPNCInputProps {
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  className?: string
  inputClassName?: string
  labelClassName?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export function INOPNCInput({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  className,
  inputClassName,
  labelClassName,
  disabled = false,
  readOnly = false,
  required = false,
  error,
  helperText,
  fullWidth = false
}: INOPNCInputProps) {
  const inputClasses = getInputClasses(inputClassName)
  const labelClasses = getLabelClasses(labelClassName)
  
  return (
    <div className={cn('form-group', fullWidth && 'w-full', className)}>
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input 
        type={type}
        className={cn(
          inputClasses,
          fullWidth && 'w-full',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'error-message' : helperText ? 'helper-text' : undefined}
      />
      
      {error && (
        <p 
          id="error-message" 
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p 
          id="helper-text" 
          className="mt-1 text-sm"
          style={{ color: 'var(--muted)' }}
        >
          {helperText}
        </p>
      )}
    </div>
  )
}

// 특정 타입의 입력 필드 컴포넌트들
export function EmailInput({ label = '이메일', ...props }: Omit<INOPNCInputProps, 'type'>) {
  return <INOPNCInput type="email" label={label} {...props} />
}

export function PasswordInput({ label = '비밀번호', ...props }: Omit<INOPNCInputProps, 'type'>) {
  return <INOPNCInput type="password" label={label} {...props} />
}

export function NumberInput({ label = '숫자', ...props }: Omit<INOPNCInputProps, 'type'>) {
  return <INOPNCInput type="number" label={label} {...props} />
}

export function TelInput({ label = '전화번호', ...props }: Omit<INOPNCInputProps, 'type'>) {
  return <INOPNCInput type="tel" label={label} {...props} />
}

export function UrlInput({ label = 'URL', ...props }: Omit<INOPNCInputProps, 'type'>) {
  return <INOPNCInput type="url" label={label} {...props} />
}

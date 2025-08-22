'use client'

import { ButtonConfig, getButtonClasses } from '@/lib/design-system-utils'
import { cn } from '@/lib/utils'
import React from 'react'

interface INOPNCButtonProps extends ButtonConfig {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

export function INOPNCButton({ 
  children, 
  className, 
  onClick, 
  disabled = false,
  loading = false,
  type = 'button',
  fullWidth = false,
  ...buttonConfig 
}: INOPNCButtonProps) {
  const buttonClasses = getButtonClasses({
    ...buttonConfig,
    size: fullWidth ? 'full' : buttonConfig.size
  })
  
  return (
    <button 
      className={cn(buttonClasses, className)}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

// 버튼 변형 컴포넌트들
export function PrimaryButton({ children, ...props }: Omit<INOPNCButtonProps, 'variant'>) {
  return (
    <INOPNCButton variant="primary" {...props}>
      {children}
    </INOPNCButton>
  )
}

export function SecondaryButton({ children, ...props }: Omit<INOPNCButtonProps, 'variant'>) {
  return (
    <INOPNCButton variant="secondary" {...props}>
      {children}
    </INOPNCButton>
  )
}

export function MainButton({ children, ...props }: Omit<INOPNCButtonProps, 'variant'>) {
  return (
    <INOPNCButton variant="main" {...props}>
      {children}
    </INOPNCButton>
  )
}

export function MutedButton({ children, ...props }: Omit<INOPNCButtonProps, 'variant'>) {
  return (
    <INOPNCButton variant="muted" {...props}>
      {children}
    </INOPNCButton>
  )
}

// 크기별 버튼 컴포넌트들
export function CompactButton({ children, ...props }: Omit<INOPNCButtonProps, 'size'>) {
  return (
    <INOPNCButton size="compact" {...props}>
      {children}
    </INOPNCButton>
  )
}

export function StandardButton({ children, ...props }: Omit<INOPNCButtonProps, 'size'>) {
  return (
    <INOPNCButton size="standard" {...props}>
      {children}
    </INOPNCButton>
  )
}

export function FieldButton({ children, ...props }: Omit<INOPNCButtonProps, 'size'>) {
  return (
    <INOPNCButton size="field" {...props}>
      {children}
    </INOPNCButton>
  )
}

export function CriticalButton({ children, ...props }: Omit<INOPNCButtonProps, 'size'>) {
  return (
    <INOPNCButton size="critical" {...props}>
      {children}
    </INOPNCButton>
  )
}

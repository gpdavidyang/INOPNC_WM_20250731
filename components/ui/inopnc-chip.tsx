'use client'

import { ChipVariant, getChipClasses } from '@/lib/design-system-utils'
import { cn } from '@/lib/utils'
import React from 'react'

interface INOPNCChipProps {
  variant: ChipVariant
  children: React.ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export function INOPNCChip({ 
  variant, 
  children, 
  className, 
  onClick, 
  interactive = false 
}: INOPNCChipProps) {
  const chipClasses = getChipClasses(variant)
  
  return (
    <span 
      className={cn(
        chipClasses,
        interactive && 'cursor-pointer hover:scale-105 transition-transform duration-200',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
    >
      {children}
    </span>
  )
}

// 칩 변형 컴포넌트들
export function ChipA({ children, ...props }: Omit<INOPNCChipProps, 'variant'>) {
  return <INOPNCChip variant="a" {...props}>{children}</INOPNCChip>
}

export function ChipB({ children, ...props }: Omit<INOPNCChipProps, 'variant'>) {
  return <INOPNCChip variant="b" {...props}>{children}</INOPNCChip>
}

export function ChipD({ children, ...props }: Omit<INOPNCChipProps, 'variant'>) {
  return <INOPNCChip variant="d" {...props}>{children}</INOPNCChip>
}

export function ChipE({ children, ...props }: Omit<INOPNCChipProps, 'variant'>) {
  return <INOPNCChip variant="e" {...props}>{children}</INOPNCChip>
}

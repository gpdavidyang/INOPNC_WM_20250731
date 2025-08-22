'use client'

import { CardConfig, getCardClasses } from '@/lib/design-system-utils'
import { cn } from '@/lib/utils'
import React from 'react'

interface INOPNCCardProps extends CardConfig {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export function INOPNCCard({ 
  children, 
  className, 
  onClick, 
  interactive = false,
  ...cardConfig 
}: INOPNCCardProps) {
  const cardClasses = getCardClasses(cardConfig)
  
  return (
    <div 
      className={cn(
        cardClasses,
        interactive && 'cursor-pointer hover:scale-[1.02] transition-transform duration-200',
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
    </div>
  )
}

// 카드 변형 컴포넌트들
export function ElevatedCard({ children, ...props }: Omit<INOPNCCardProps, 'variant' | 'elevation'>) {
  return (
    <INOPNCCard variant="elevated" elevation="md" {...props}>
      {children}
    </INOPNCCard>
  )
}

export function ProminentCard({ children, ...props }: Omit<INOPNCCardProps, 'variant'>) {
  return (
    <INOPNCCard variant="prominent" {...props}>
      {children}
    </INOPNCCard>
  )
}

export function SectionHeaderCard({ children, ...props }: Omit<INOPNCCardProps, 'variant'>) {
  return (
    <INOPNCCard variant="section-header" {...props}>
      {children}
    </INOPNCCard>
  )
}

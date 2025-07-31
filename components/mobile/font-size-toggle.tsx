'use client'

import React from 'react'
import { useFontSize } from '@/providers/font-size-provider'
import { cn } from '@/lib/utils'

interface FontSizeToggleProps {
  className?: string
}

export default function FontSizeToggle({ className }: FontSizeToggleProps) {
  const { isLargeFont, toggleFontSize } = useFontSize()

  return (
    <button
      onClick={toggleFontSize}
      className={cn(
        "relative p-2 rounded-lg transition-all duration-300",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isLargeFont && "bg-blue-50 dark:bg-blue-900/20",
        className
      )}
      aria-label={isLargeFont ? "기본 글씨로 변경" : "큰 글씨로 변경"}
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        {isLargeFont ? (
          <svg 
            className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-all duration-300" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <text 
              x="50%" 
              y="50%" 
              dominantBaseline="middle" 
              textAnchor="middle" 
              className="font-bold text-[20px]"
              fill="currentColor"
            >
              A
            </text>
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none"
            />
          </svg>
        ) : (
          <svg 
            className="w-6 h-6 text-gray-600 dark:text-gray-400 transition-all duration-300" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <text 
              x="50%" 
              y="50%" 
              dominantBaseline="middle" 
              textAnchor="middle" 
              className="font-bold text-[14px]"
              fill="currentColor"
            >
              A
            </text>
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none"
            />
          </svg>
        )}
      </div>
      
      {/* 시각적 피드백을 위한 작은 인디케이터 */}
      {isLargeFont && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
      )}
    </button>
  )
}

// 컴팩트 버전 (설정 메뉴용)
export function FontSizeToggleCompact({ className }: FontSizeToggleProps) {
  const { isLargeFont, toggleFontSize } = useFontSize()

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className={cn(
        "font-medium",
        isLargeFont ? "text-lg" : "text-sm",
        "text-gray-700 dark:text-gray-300"
      )}>
        큰 글씨 사용
      </span>
      <button
        onClick={toggleFontSize}
        className={cn(
          "relative w-12 h-6 rounded-full transition-colors duration-300",
          isLargeFont 
            ? "bg-blue-600 dark:bg-blue-500" 
            : "bg-gray-300 dark:bg-gray-600"
        )}
        role="switch"
        aria-checked={isLargeFont}
        aria-label="큰 글씨 사용"
      >
        <div
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full",
            "transform transition-transform duration-300",
            isLargeFont && "translate-x-6"
          )}
        />
      </button>
    </div>
  )
}
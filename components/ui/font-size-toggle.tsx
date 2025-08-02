'use client'

import { useFontSize } from '@/contexts/FontSizeContext'

export function FontSizeToggle() {
  const { isLargeFont, toggleFontSize } = useFontSize()

  return (
    <button
      onClick={toggleFontSize}
      className={`
        relative inline-flex items-center justify-center rounded-lg p-2 min-w-[32px] h-8
        text-gray-500 dark:text-gray-400 
        hover:text-gray-700 dark:hover:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        transition-colors font-semibold
        ${isLargeFont ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
      `}
      title={isLargeFont ? '일반 글꼴로 변경 (현재: 큰 글꼴)' : '큰 글꼴로 변경 (현재: 일반 글꼴)'}
      aria-label={isLargeFont ? '일반 글꼴로 변경' : '큰 글꼴로 변경'}
    >
      <span 
        className={`transition-all duration-200 ${isLargeFont ? 'text-sm scale-110' : 'text-xs'}`}
        aria-hidden="true"
      >
        Aa
      </span>
      {isLargeFont && (
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
      )}
    </button>
  )
}
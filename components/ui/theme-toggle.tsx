'use client'

import { getTheme, toggleTheme } from '@/lib/design-system-utils'
import { useEffect, useState } from 'react'
import { PrimaryButton } from './inopnc-button'

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const theme = getTheme()
    setCurrentTheme(theme)
  }, [])

  const handleToggle = () => {
    const newTheme = toggleTheme()
    setCurrentTheme(newTheme)
  }

  if (!mounted) {
    return (
      <PrimaryButton size="compact" disabled>
        로딩 중...
      </PrimaryButton>
    )
  }

  return (
    <PrimaryButton 
      size="compact" 
      onClick={handleToggle}
      className="min-w-[120px]"
    >
      {currentTheme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}
    </PrimaryButton>
  )
}

// 간단한 아이콘만 있는 버전
export function ThemeToggleIcon() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const theme = getTheme()
    setCurrentTheme(theme)
  }, [])

  const handleToggle = () => {
    const newTheme = toggleTheme()
    setCurrentTheme(newTheme)
  }

  if (!mounted) {
    return <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`${currentTheme === 'light' ? '다크' : '라이트'} 모드로 전환`}
    >
      {currentTheme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
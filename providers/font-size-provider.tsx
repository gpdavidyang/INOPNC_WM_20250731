'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface FontSizeContextType {
  isLargeFont: boolean
  toggleFontSize: () => void
  fontScale: number
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [isLargeFont, setIsLargeFont] = useState(false)

  // localStorage에서 설정 불러오기
  useEffect(() => {
    const savedFontSize = localStorage.getItem('isLargeFont')
    if (savedFontSize === 'true') {
      setIsLargeFont(true)
    }
  }, [])

  const toggleFontSize = () => {
    const newValue = !isLargeFont
    setIsLargeFont(newValue)
    localStorage.setItem('isLargeFont', newValue.toString())
    
    // 사용자에게 피드백 제공 (나중에 토스트로 대체 가능)
    if (newValue) {
      console.log('큰 글씨 모드가 활성화되었습니다.')
    } else {
      console.log('기본 글씨 모드로 변경되었습니다.')
    }
  }

  const value: FontSizeContextType = {
    isLargeFont,
    toggleFontSize,
    fontScale: isLargeFont ? 1.5 : 1.0
  }

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function useFontSize() {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}

// 유틸리티 함수들
export function getTextSize(base: string, large: string, isLargeFont: boolean) {
  return isLargeFont ? large : base
}

export function getButtonSize(isLargeFont: boolean) {
  return isLargeFont 
    ? "min-h-[56px] px-5 py-3" 
    : "min-h-[48px] px-4 py-2"
}

export function getIconSize(isLargeFont: boolean) {
  return isLargeFont ? "w-6 h-6" : "w-5 h-5"
}

export function getSpacing(isLargeFont: boolean) {
  return isLargeFont ? "space-y-4" : "space-y-3"
}
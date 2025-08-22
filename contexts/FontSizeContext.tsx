'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

type FontSizeType = 'small' | 'normal' | 'large' | 'xlarge'

interface FontSizeContextType {
  fontSize: FontSizeType
  setFontSize: (size: FontSizeType) => void
  fontSizeMultiplier: number
  isLargeText: boolean
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

interface FontSizeProviderProps {
  children: ReactNode
}

export function FontSizeProvider({ children }: FontSizeProviderProps) {
  const [fontSize, setFontSizeState] = useState<FontSizeType>('normal')

  const fontSizeMultiplier = {
    small: 0.875,      // 14px (기준 16px 대비)
    normal: 1,         // 16px (기준)
    large: 1.25,       // 20px
    xlarge: 1.5        // 24px
  }[fontSize]

  const isLargeText = fontSize === 'large' || fontSize === 'xlarge'

  // localStorage에서 설정 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inopnc-font-size')
      if (saved && ['small', 'normal', 'large', 'xlarge'].includes(saved)) {
        setFontSizeState(saved as FontSizeType)
      }
    } catch (error) {
      console.warn('Failed to load font size preference:', error)
    }
  }, [])

  // 글자 크기 변경 시 CSS 변수 업데이트
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-size-multiplier', fontSizeMultiplier.toString())
      document.documentElement.classList.remove('font-size-small', 'font-size-normal', 'font-size-large', 'font-size-xlarge')
      document.documentElement.classList.add(`font-size-${fontSize}`)
    }
  }, [fontSize, fontSizeMultiplier])

  const setFontSize = (size: FontSizeType) => {
    setFontSizeState(size)
    try {
      localStorage.setItem('inopnc-font-size', size)
    } catch (error) {
      console.warn('Failed to save font size preference:', error)
    }
  }

  const value = {
    fontSize,
    setFontSize,
    fontSizeMultiplier,
    isLargeText
  }

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  )
}

// Custom hook to use font size context
export function useFontSize() {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}

// Utility function to get font-size-optimized classes
export function getFontSizeClass(
  baseClass: string,
  fontSize: FontSizeType
): string {
  const sizeMap = {
    small: baseClass.replace(/text-(\w+)/, 'text-$1-sm'),
    normal: baseClass,
    large: baseClass.replace(/text-(\w+)/, 'text-$1-lg'),
    xlarge: baseClass.replace(/text-(\w+)/, 'text-$1-xl')
  }
  
  return sizeMap[fontSize] || baseClass
}

// Typography class utility for backward compatibility
export function getTypographyClass(
  size: string,
  isLargeFont: boolean
): string {
  if (isLargeFont) {
    switch (size) {
      case 'xs': return 'text-xs'
      case 'sm': return 'text-sm'
      case 'base': return 'text-base'
      case 'lg': return 'text-lg'
      case 'xl': return 'text-xl'
      case '2xl': return 'text-2xl'
      case '3xl': return 'text-3xl'
      case 'label': return 'text-sm'
      case 'body': return 'text-base'
      case 'large': return 'text-lg'
      default: return 'text-base'
    }
  } else {
    switch (size) {
      case 'xs': return 'text-xs'
      case 'sm': return 'text-sm'
      case 'base': return 'text-base'
      case 'lg': return 'text-lg'
      case 'xl': return 'text-xl'
      case '2xl': return 'text-2xl'
      case '3xl': return 'text-3xl'
      case 'label': return 'text-sm'
      case 'body': return 'text-base'
      case 'large': return 'text-lg'
      default: return 'text-base'
    }
  }
}

// Full typography class utility
export function getFullTypographyClass(
  element: string,
  size: string,
  isLargeFont: boolean
): string {
  if (isLargeFont) {
    switch (size) {
      case 'xs': return 'text-xs'
      case 'sm': return 'text-sm'
      case 'base': return 'text-base'
      case 'lg': return 'text-lg'
      case 'xl': return 'text-xl'
      case '2xl': return 'text-2xl'
      case '3xl': return 'text-3xl'
      case 'label': return 'text-sm'
      case 'body': return 'text-base'
      case 'large': return 'text-lg'
      default: return 'text-base'
    }
  } else {
    switch (size) {
      case 'xs': return 'text-xs'
      case 'sm': return 'text-sm'
      case 'base': return 'text-base'
      case 'lg': return 'text-lg'
      case 'xl': return 'text-xl'
      case '2xl': return 'text-2xl'
      case '3xl': return 'text-3xl'
      case 'label': return 'text-sm'
      case 'body': return 'text-base'
      case 'large': return 'text-lg'
      default: return 'text-base'
    }
  }
}
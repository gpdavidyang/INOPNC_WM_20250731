'use client'

import { setTheme } from '@/lib/design-system-utils'
import { useEffect } from 'react'

export function ThemeInitializer() {
  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem('theme') || 'light'
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    // Use saved theme or system preference
    const themeToUse = (savedTheme || systemTheme) as 'light' | 'dark'
    
    // Set theme for both systems
    if (themeToUse === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    
    // Update INOPNC design system theme
    setTheme(themeToUse)
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      if (!localStorage.getItem('theme')) { // Only auto-change if user hasn't set a preference
        setTheme(newTheme as 'light' | 'dark')
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.setAttribute('data-theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          document.documentElement.setAttribute('data-theme', 'light')
        }
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return null
}
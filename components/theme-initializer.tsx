'use client'

import { useEffect } from 'react'

export function ThemeInitializer() {
  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem('theme') || 'light'
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return null
}
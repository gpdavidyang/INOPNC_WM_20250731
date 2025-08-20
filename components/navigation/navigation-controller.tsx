'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface NavigationControllerProps {
  children: React.ReactNode
}

interface NavigationState {
  isNavigating: boolean
  pendingRoute: string | null
  lastNavigationTime: number
}

/**
 * 통합 네비게이션 컨트롤러
 * 모든 네비게이션 요소의 중복 실행 방지 및 성능 최적화
 */
export function NavigationController({ children }: NavigationControllerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [navState, setNavState] = useState<NavigationState>({
    isNavigating: false,
    pendingRoute: null,
    lastNavigationTime: 0
  })
  const navigationTimeoutRef = useRef<NodeJS.Timeout>()

  // 중복 네비게이션 방지를 위한 디바운스 처리
  const navigate = useCallback((route: string, options?: { replace?: boolean }) => {
    const now = Date.now()
    
    // 같은 경로 중복 방지
    if (pathname === route) {
      console.log('[NavigationController] Same route, skipping:', route)
      return
    }
    
    // 300ms 내 중복 네비게이션 방지 (500ms에서 300ms로 단축)
    if (navState.isNavigating && (now - navState.lastNavigationTime < 300)) {
      console.log('[NavigationController] Navigation in progress, skipping:', route)
      return
    }

    // 이전 타이머 정리
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }

    console.log('[NavigationController] Navigating to:', route)
    setNavState({
      isNavigating: true,
      pendingRoute: route,
      lastNavigationTime: now
    })

    // 즉시 네비게이션 실행 (requestAnimationFrame 제거)
    if (options?.replace) {
      router.replace(route)
    } else {
      router.push(route)
    }

    // 네비게이션 완료 후 상태 초기화 (더 빠른 초기화)
    navigationTimeoutRef.current = setTimeout(() => {
      setNavState(prev => ({
        ...prev,
        isNavigating: false,
        pendingRoute: null
      }))
    }, 200)
  }, [router, pathname, navState.isNavigating, navState.lastNavigationTime])

  // 탭 기반 네비게이션 처리
  const handleTabChange = useCallback((tabId: string) => {
    // 탭 변경은 즉시 실행 (네비게이션 상태 확인 불필요)
    return tabId
  }, [])

  return (
    <NavigationContext.Provider value={{
      navigate,
      handleTabChange,
      isNavigating: navState.isNavigating,
      pendingRoute: navState.pendingRoute
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

// Context for providing navigation functions
import { createContext, useContext } from 'react'

interface NavigationContextType {
  navigate: (route: string, options?: { replace?: boolean }) => void
  handleTabChange: (tabId: string) => string
  isNavigating: boolean
  pendingRoute: string | null
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationController')
  }
  return context
}
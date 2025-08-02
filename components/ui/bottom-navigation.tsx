'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export interface BottomNavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  specialAction?: 'filter-blueprint' // 공도면 특수 동작
}

interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  items: BottomNavItem[]
  currentUser?: {
    id: string
    active_site_id?: string
  }
  onTabChange?: (tabId: string) => void
  activeTab?: string
}

const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(
  ({ className, items, currentUser, onTabChange, activeTab, ...props }, ref) => {
    const pathname = usePathname()
    const router = useRouter()

    const handleNavigation = (item: BottomNavItem, e: React.MouseEvent) => {
      e.preventDefault()
      
      if (item.specialAction === 'filter-blueprint') {
        // 공도면 특수 동작: 공유문서함으로 이동하며 자동 필터링
        if (currentUser?.active_site_id) {
          // 현재 사용자의 활성 현장으로 필터링 + 공도면 badge 검색
          const filterParams = new URLSearchParams({
            site: currentUser.active_site_id,
            document_type: '공도면',
            auto_filter: 'true'
          })
          if (onTabChange) {
            onTabChange('shared-documents')
          } else {
            router.push(`/dashboard/shared-documents?${filterParams.toString()}`)
          }
        } else {
          // 현장 미배정 시 안내 메시지와 함께 기본 경로로 이동
          if (onTabChange) {
            onTabChange('shared-documents')
          } else {
            router.push(`${item.href}?no_site_assigned=true`)
          }
        }
        return
      }
      
      // 일반 네비게이션 - 탭 시스템 또는 라우터 사용
      if (onTabChange && item.href.startsWith('#')) {
        const tabId = item.href.replace('#', '')
        onTabChange(tabId)
      } else {
        router.push(item.href)
      }
    }

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 md:hidden",
          // iOS: 56px + Safe Area, Android: 48px
          "h-[48px] supports-[height:env(safe-area-inset-bottom)]:h-[56px]",
          "border-gray-200 dark:border-gray-700",
          "backdrop-blur-md bg-opacity-90",
          className
        )}
        {...props}
        role="navigation"
        aria-label="하단 메인 네비게이션"
      >
        <div className="flex h-full items-center justify-around px-1">
          {items.map((item, index) => {
            // 활성 상태 판단 로직
            let isActive = false
            if (onTabChange && item.href.startsWith('#')) {
              // 탭 시스템에서는 현재 탭으로 판단
              const tabId = item.href.replace('#', '')
              isActive = activeTab === tabId || 
                (item.specialAction === 'filter-blueprint' && activeTab === 'shared-documents')
            } else {
              // 라우터 기반 시스템
              isActive = pathname === item.href || 
                (item.specialAction === 'filter-blueprint' && pathname.includes('/shared-documents'))
            }
            
            return (
              <button
                key={index}
                onClick={(e) => handleNavigation(item, e)}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-200",
                  // 터치 영역: 44x44px minimum (Apple HIG)
                  "min-h-[44px] min-w-[44px] flex-1",
                  // 텍스트 및 색상
                  "text-[10px] font-normal gap-1",
                  // 터치 최적화
                  "active:scale-95 touch-manipulation",
                  // 포커스 표시
                  "focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                  // 상태별 색상
                  isActive
                    ? "text-blue-600 dark:text-blue-400" // Primary Color (#007AFF)
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
                aria-label={`${item.label}으로 이동`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative">
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: "h-6 w-6", // 24x24px 아이콘
                    "aria-hidden": "true"
                  })}
                  {item.badge && (
                    <div className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white min-w-[16px]">
                      {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                <span className="truncate max-w-[60px] leading-tight">
                  {item.label}
                </span>
                
                {/* 활성 상태 인디케이터 (선택적) */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
        
        {/* iOS Safe Area */}
        <div className="h-safe-area-inset-bottom bg-white dark:bg-gray-900" />
      </nav>
    )
  }
)
BottomNavigation.displayName = "BottomNavigation"

export { BottomNavigation }
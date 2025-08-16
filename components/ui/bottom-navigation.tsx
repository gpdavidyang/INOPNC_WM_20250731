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
      
      console.log('BottomNavigation: Click detected', {
        label: item.label,
        href: item.href,
        specialAction: item.specialAction,
        currentPathname: pathname
      })
      
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
      if (item.href.startsWith('#')) {
        // 해시 기반 탭은 onTabChange 호출
        if (onTabChange) {
          const tabId = item.href.replace('#', '')
          onTabChange(tabId)
        }
      } else {
        // 직접 경로는 항상 라우터 사용
        console.log('BottomNavigation: Calling router.push with', item.href)
        router.push(item.href)
        
        // onTabChange도 호출하여 activeTab 상태 동기화
        if (onTabChange) {
          // Extract tab name from href for proper state management
          const tabName = item.href.split('/').pop() || item.href.replace('/', '')
          onTabChange(tabName)
        }
      }
    }

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 dark:bg-gray-900/95 md:hidden",
          // UI Guidelines 준수: 더 얇은 높이 (44px)
          "h-[44px] supports-[height:env(safe-area-inset-bottom)]:h-[48px]",
          "border-gray-200/50 dark:border-gray-700/50",
          "backdrop-blur-xl backdrop-saturate-180",
          className
        )}
        {...props}
        role="navigation"
        aria-label="하단 메인 네비게이션"
      >
        <div className="flex h-full items-center justify-around px-1">
          {items.map((item, index) => {
            console.log('BottomNavigation: Rendering item', {
              index,
              label: item.label,
              href: item.href,
              hasOnClick: typeof handleNavigation === 'function'
            })
            
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
                onClick={(e) => {
                  console.log('BottomNavigation: Button clicked!', item.label)
                  handleNavigation(item, e)
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-200",
                  // UI Guidelines: 더 조밀한 터치 영역
                  "min-h-[40px] min-w-[40px] flex-1",
                  // UI Guidelines: 더 작은 텍스트와 간격
                  "text-[9px] font-medium gap-0.5",
                  // 터치 최적화
                  "active:scale-95 touch-manipulation",
                  // 포커스 표시 - UI Guidelines 색상
                  "focus-visible:outline-2 focus-visible:outline-toss-blue-500 focus-visible:outline-offset-1",
                  // UI Guidelines 색상 시스템 적용
                  isActive
                    ? "text-toss-blue-600 dark:text-toss-blue-400" // Toss Primary Color
                    : "text-toss-gray-600 dark:text-toss-gray-400 hover:text-toss-gray-700 dark:hover:text-toss-gray-300"
                )}
                aria-label={`${item.label}으로 이동`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative">
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: "h-5 w-5", // UI Guidelines: 더 작은 아이콘 (20x20px)
                    "aria-hidden": "true",
                    strokeWidth: isActive ? 2.5 : 1.5 // 활성 상태에서만 더 두꺼운 선
                  })}
                  {item.badge && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white min-w-[14px]">
                      {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                <span className="truncate max-w-[50px] leading-none">
                  {item.label}
                </span>
                
                {/* UI Guidelines: 더 미묘한 활성 상태 인디케이터 */}
                {isActive && (
                  <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-4 h-px bg-toss-blue-600 dark:bg-toss-blue-400 rounded-full opacity-80"></div>
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
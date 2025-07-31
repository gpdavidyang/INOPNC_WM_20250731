'use client'

import { Bell, Search } from 'lucide-react'
import { MobileThemeToggleCompact } from './mobile-theme-toggle'
import FontSizeToggle from './font-size-toggle'
import { useFontSize } from '@/providers/font-size-provider'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  title: string
  showSearch?: boolean
  showNotification?: boolean
  notificationCount?: number
}

export default function MobileHeader({ 
  title, 
  showSearch = true, 
  showNotification = true, 
  notificationCount = 0 
}: MobileHeaderProps) {
  const { isLargeFont } = useFontSize()
  
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:hidden",
      isLargeFont ? "h-24" : "h-16"
    )}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Title */}
        <h1 className={cn(
          "font-semibold text-gray-900 dark:text-gray-100 ml-12",
          isLargeFont ? "text-2xl" : "text-lg"
        )}>
          {title}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <FontSizeToggle />
          <MobileThemeToggleCompact />
          
          {showSearch && (
            <button className={cn(
              "rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              isLargeFont ? "p-2.5" : "p-2"
            )}>
              <Search className={cn(
                "text-gray-600 dark:text-gray-400",
                isLargeFont ? "h-6 w-6" : "h-5 w-5"
              )} />
            </button>
          )}
          
          {showNotification && (
            <button className={cn(
              "relative rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              isLargeFont ? "p-2.5" : "p-2"
            )}>
              <Bell className={cn(
                "text-gray-600 dark:text-gray-400",
                isLargeFont ? "h-6 w-6" : "h-5 w-5"
              )} />
              {notificationCount > 0 && (
                <span className={cn(
                  "absolute flex items-center justify-center rounded-full bg-red-500",
                  isLargeFont ? "top-1.5 right-1.5 h-2.5 w-2.5" : "top-1 right-1 h-2 w-2"
                )}>
                  <span className="sr-only">{notificationCount}개의 알림</span>
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
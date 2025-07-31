'use client'

import { Bell, Search } from 'lucide-react'
import { MobileThemeToggleCompact } from './mobile-theme-toggle'

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
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Title */}
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-12">
          {title}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <MobileThemeToggleCompact />
          
          {showSearch && (
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          {showNotification && (
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 items-center justify-center rounded-full bg-red-500">
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
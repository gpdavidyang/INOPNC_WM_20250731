'use client'

import { Profile } from '@/types'
import { Menu } from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { FontSizeToggle } from '@/components/ui/font-size-toggle'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'

interface HeaderProps {
  profile: Profile
  onMenuClick?: () => void
  isSidebarOpen?: boolean
}

export default function Header({ profile, onMenuClick, isSidebarOpen = false }: HeaderProps) {
  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    }
  }
  
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 theme-transition" role="banner">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-x-4">
            <button
              type="button"
              className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 theme-transition touch-manipulation min-h-[48px] min-w-[48px]"
              onClick={handleMenuClick}
              aria-label="사이드바 메뉴 열기"
              aria-controls="main-navigation"
              aria-expanded={isSidebarOpen}
            >
              <Menu 
                className={`h-6 w-6 transition-transform duration-200 ${
                  isSidebarOpen ? 'rotate-180' : ''
                }`} 
                aria-hidden="true" 
              />
            </button>

            <div className="flex items-center">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                INOPNC
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-x-2" role="group" aria-label="사용자 메뉴">
            {/* Font Size Toggle */}
            <div role="region" aria-label="글꼴 크기">
              <FontSizeToggle />
            </div>

            {/* Dark Mode Toggle */}
            <div role="region" aria-label="다크 모드">
              <ThemeToggle />
            </div>

            {/* Notifications */}
            <div role="region" aria-label="알림">
              <NotificationDropdown />
            </div>

            {/* User Profile Dropdown */}
            <div role="region" aria-label="사용자 프로필">
              <ProfileDropdown profile={profile} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
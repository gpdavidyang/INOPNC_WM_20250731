'use client'

import { Profile } from '@/types'
import { Menu } from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

interface HeaderProps {
  profile: Profile
  onMenuClick: () => void
}

export default function Header({ profile, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              건설 작업일지 관리 시스템
            </h1>
          </div>

          <div className="flex items-center gap-x-4">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User menu */}
            <div className="relative">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
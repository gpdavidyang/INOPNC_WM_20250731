'use client'

import { Profile } from '@/types'
import { Menu, Bell } from 'lucide-react'

interface HeaderProps {
  profile: Profile
  onMenuClick: () => void
}

export default function Header({ profile, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              건설 작업일지 관리 시스템
            </h1>
          </div>

          <div className="flex items-center gap-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* User menu */}
            <div className="relative">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
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
'use client'

import { Profile, UserRole } from '@/types'
import { Home, FileText, Calendar, FolderOpen, Share2, Edit3, User, Users, BarChart3, Settings, X, Menu } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/auth/actions'
import MobileThemeToggle from './mobile-theme-toggle'

interface MobileSidebarProps {
  profile: Profile
  activeTab: string
  onTabChange: (tab: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon: any
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin']
  },
  {
    id: 'attendance',
    label: '출력현황',
    icon: Calendar,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin']
  },
  {
    id: 'daily-reports',
    label: '작업일지',
    icon: FileText,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin']
  },
  {
    id: 'documents',
    label: '내문서함',
    icon: FolderOpen,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin']
  },
  {
    id: 'shared-documents',
    label: '공유문서함',
    icon: Share2,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin']
  },
  {
    id: 'drawing-tools',
    label: '도면 마킹 도구',
    icon: Edit3,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin']
  },
  {
    id: 'my-info',
    label: '내정보',
    icon: User,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin']
  }
]

const adminMenuItems: MenuItem[] = [
  {
    id: 'user-management',
    label: '사용자 관리',
    icon: Users,
    roles: ['admin', 'system_admin']
  },
  {
    id: 'statistics',
    label: '통계 대시보드',
    icon: BarChart3,
    roles: ['admin', 'system_admin']
  },
  {
    id: 'settings',
    label: '설정',
    icon: Settings,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  }
]

export default function MobileSidebar({ profile, activeTab, onTabChange }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        window.location.href = '/auth/login'
      } else if (result.error) {
        console.error('Logout error:', result.error)
      }
    } catch (error) {
      console.error('Logout error:', error)
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    }
  }

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    setIsOpen(false)
  }

  if (!profile) {
    return null
  }

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(profile.role as UserRole)
  )

  const filteredAdminMenuItems = adminMenuItems.filter(item =>
    item.roles.includes(profile.role as UserRole)
  )

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md md:hidden"
      >
        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b dark:border-gray-800">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">IN</span>
              </div>
              <span className="ml-3 text-lg font-semibold dark:text-white">INOPNC</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4">
              {/* User Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {profile.role === 'worker' && '작업자'}
                  {profile.role === 'site_manager' && '현장관리자'}
                  {profile.role === 'customer_manager' && '파트너사'}
                  {profile.role === 'admin' && '관리자'}
                  {profile.role === 'system_admin' && '시스템관리자'}
                </p>
              </div>

              {/* Main Menu */}
              <nav className="space-y-1">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </button>
                  )
                })}
              </nav>

              {/* Admin Menu */}
              {filteredAdminMenuItems.length > 0 && (
                <>
                  <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
                  <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    관리자 메뉴
                  </p>
                  <nav className="space-y-1">
                    {filteredAdminMenuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {item.label}
                        </button>
                      )
                    })}
                  </nav>
                </>
              )}

              {/* Theme Toggle */}
              <div className="mt-4">
                <MobileThemeToggle />
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t dark:border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
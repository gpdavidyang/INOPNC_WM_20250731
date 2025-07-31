'use client'

import { Home, FileText, Calendar, FolderOpen, MoreHorizontal } from 'lucide-react'
import { Profile, UserRole } from '@/types'

interface MobileBottomNavProps {
  profile: Profile
  activeTab: string
  onTabChange: (tab: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: any
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: 'daily-reports',
    label: '작업일지',
    icon: FileText,
    roles: ['worker', 'site_manager', 'admin', 'system_admin']
  },
  {
    id: 'attendance',
    label: '출근부',
    icon: Calendar,
    roles: ['worker', 'site_manager', 'admin', 'system_admin']
  },
  {
    id: 'documents',
    label: '문서함',
    icon: FolderOpen,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: 'more',
    label: '더보기',
    icon: MoreHorizontal,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  }
]

export default function MobileBottomNav({ profile, activeTab, onTabChange }: MobileBottomNavProps) {
  if (!profile) {
    return null
  }

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(profile.role as UserRole)
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center justify-around h-16">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id || 
            (item.id === 'more' && !['home', 'daily-reports', 'attendance', 'documents'].includes(activeTab))
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full py-2 transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe pb-safe" />
    </nav>
  )
}